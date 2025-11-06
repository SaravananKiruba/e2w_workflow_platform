import { prisma } from '@/lib/prisma';
import { ModuleConfig, FieldDefinition } from '@/types/metadata';
import { MetadataService } from './metadata-service';

export class ModuleConfigService {
  // Get module configuration for a tenant
  static async getModuleConfig(tenantId: string, moduleName: string): Promise<ModuleConfig | null> {
    const config = await prisma.moduleConfiguration.findFirst({
      where: {
        tenantId,
        moduleName,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (!config) return null;

    return {
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
    userId: string
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

    const nextVersion = latestConfig ? latestConfig.version + 1 : 1;

    // Create new version
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
      },
    });
  }

  // Activate module configuration
  static async activateConfig(tenantId: string, configId: string, approverId: string) {
    // Deactivate other versions
    await prisma.moduleConfiguration.updateMany({
      where: {
        tenantId,
        status: 'active',
      },
      data: { status: 'archived' },
    });

    // Activate this version
    return prisma.moduleConfiguration.update({
      where: { id: configId },
      data: {
        status: 'active',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });
  }

  // Get field definition by name
  static async getField(tenantId: string, moduleName: string, fieldName: string): Promise<FieldDefinition | null> {
    const config = await this.getModuleConfig(tenantId, moduleName);
    if (!config) return null;

    return config.fields.find(f => f.name === fieldName) || null;
  }
}
