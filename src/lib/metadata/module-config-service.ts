import { prisma } from '@/lib/prisma';
import { ModuleConfig, FieldDefinition } from '@/types/metadata';
import { MetadataService } from './metadata-service';
import { ModuleCacheHelpers } from '@/lib/cache/cache-manager';

export class ModuleConfigService {
  // Get module configuration for a tenant (with caching)
  static async getModuleConfig(tenantId: string, moduleName: string): Promise<ModuleConfig | null> {
    // Week 3: Check cache first
    const cachedConfig = ModuleCacheHelpers.getCachedModuleConfig(tenantId, moduleName);
    if (cachedConfig) {
      return cachedConfig;
    }

    const config = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!config) return null;

    const moduleConfig: ModuleConfig = {
      moduleName: config.moduleName,
      displayName: config.displayName,
      icon: config.icon || undefined,
      description: config.description || undefined,
      fields: JSON.parse(config.fields),
      layouts: config.layouts ? JSON.parse(config.layouts) : undefined,
      validations: config.validations ? JSON.parse(config.validations) : undefined,
      status: config.status as any,
      version: config.version,
    };

    // Week 3: Cache the result
    ModuleCacheHelpers.cacheModuleConfig(tenantId, moduleName, moduleConfig);

    return moduleConfig;
  }

  // Get all modules for a tenant
  static async getAllModules(tenantId: string) {
    const configs = await prisma.moduleConfiguration.findMany({
      where: {
        tenantId,
        status: 'active',
      },
      orderBy: { displayName: 'asc' },
    });

    return configs.map(config => ({
      moduleName: config.moduleName,
      displayName: config.displayName,
      icon: config.icon,
      description: config.description,
      version: config.version,
    }));
  }

  // Create or update module configuration
  static async saveModuleConfig(
    tenantId: string,
    moduleConfig: ModuleConfig,
    userId: string,
    options?: { hotUpdate?: boolean }
  ) {
    // Validate all fields
    for (const field of moduleConfig.fields) {
      const validation = await MetadataService.validateFieldDefinition(field);
      if (!validation.valid) {
        throw new Error(`Field validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Get current version
    const latestConfig = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId,
        moduleName: moduleConfig.moduleName,
      },
      orderBy: { version: 'desc' },
    });

    // Week 3: Hot update mode - directly update active config without versioning
    if (options?.hotUpdate && latestConfig && latestConfig.status === 'active') {
      const updated = await prisma.moduleConfiguration.update({
        where: { id: latestConfig.id },
        data: {
          fields: JSON.stringify(moduleConfig.fields),
          layouts: moduleConfig.layouts ? JSON.stringify(moduleConfig.layouts) : null,
          validations: moduleConfig.validations ? JSON.stringify(moduleConfig.validations) : null,
          updatedAt: new Date(),
        },
      });

      // Week 3: Invalidate cache immediately
      ModuleCacheHelpers.invalidateModuleCache(tenantId, moduleConfig.moduleName);
      
      return updated;
    }

    const nextVersion = latestConfig ? latestConfig.version + 1 : 1;

    // Create new version (traditional approach)
    return prisma.moduleConfiguration.create({
      data: {
        tenantId,
        moduleName: moduleConfig.moduleName,
        displayName: moduleConfig.displayName,
        icon: moduleConfig.icon,
        description: moduleConfig.description,
        fields: JSON.stringify(moduleConfig.fields),
        layouts: moduleConfig.layouts ? JSON.stringify(moduleConfig.layouts) : null,
        validations: moduleConfig.validations ? JSON.stringify(moduleConfig.validations) : null,
        status: 'draft',
        version: nextVersion,
        createdBy: userId,
        allowHotUpdates: false, // New versions default to false
      },
    });
  }

  // Week 3: Enable/disable hot updates for a module
  static async toggleHotUpdates(tenantId: string, moduleName: string, enabled: boolean) {
    const config = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId,
        moduleName,
        status: 'active',
      },
    });

    if (!config) {
      throw new Error('Module configuration not found');
    }

    return prisma.moduleConfiguration.update({
      where: { id: config.id },
      data: { allowHotUpdates: enabled },
    });
  }

  // Activate module configuration
  static async activateConfig(tenantId: string, configId: string, approverId: string) {
    // Get the config to be activated
    const configToActivate = await prisma.moduleConfiguration.findUnique({
      where: { id: configId },
    });

    if (!configToActivate || configToActivate.tenantId !== tenantId) {
      throw new Error('Configuration not found or unauthorized');
    }

    // Deactivate other versions
    await prisma.moduleConfiguration.updateMany({
      where: {
        tenantId,
        moduleName: configToActivate.moduleName,
        status: 'active',
      },
      data: { status: 'archived' },
    });

    // Activate this version
    const activated = await prisma.moduleConfiguration.update({
      where: { id: configId },
      data: {
        status: 'active',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    // Week 3: Invalidate cache for this module
    ModuleCacheHelpers.invalidateModuleCache(tenantId, configToActivate.moduleName);

    return activated;
  }

  // Get field definition by name
  static async getField(tenantId: string, moduleName: string, fieldName: string): Promise<FieldDefinition | null> {
    const config = await this.getModuleConfig(tenantId, moduleName);
    if (!config) return null;

    return config.fields.find(f => f.name === fieldName) || null;
  }
}
