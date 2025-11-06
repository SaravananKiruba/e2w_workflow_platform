import { prisma } from '@/lib/prisma';
import { DynamicRecordService } from '@/lib/modules/dynamic-record-service';

/**
 * Service for handling lookup/reference field operations
 * - Fetch records from target modules
 * - Filter and search across records
 * - Handle cascading population of related fields
 */
export class LookupService {
  /**
   * Get lookup options for a field
   * Fetches records from target module with search capability
   */
  static async getLookupOptions(
    tenantId: string,
    targetModule: string,
    searchTerm?: string,
    displayField?: string,
    searchFields?: string[],
    limit: number = 50
  ) {
    try {
      // Get module configuration to understand the data structure
      const moduleConfig = await prisma.moduleConfiguration.findFirst({
        where: { tenantId, moduleName: targetModule, status: 'active' },
      });

      if (!moduleConfig) {
        throw new Error(`Module ${targetModule} not found`);
      }

      const fields = JSON.parse(moduleConfig.fields);
      const display = displayField || fields.find((f: any) => f.name === 'name' || f.name === 'title' || f.name === `${targetModule.toLowerCase()}Name`)?.name;

      // Build query for DynamicRecord
      let where: any = {
        tenantId,
        moduleName: targetModule,
        status: 'active',
      };

      // Add search filter if provided
      if (searchTerm && searchFields && searchFields.length > 0) {
        // For simple search, we'll filter in memory since SQLite limitations
        // In production, consider full-text search solutions
        where._or = searchFields.map((field: string) => ({
          data: { contains: searchTerm, mode: 'insensitive' },
        }));
      }

      const records = await prisma.dynamicRecord.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Transform records to options
      return records.map((record) => {
        const data = JSON.parse(record.data);
        const label = display ? data[display] : `Record ${record.id.substring(0, 8)}`;

        return {
          value: record.id,
          label: String(label),
          record: data, // Include full record for cascading
        };
      });
    } catch (error) {
      console.error('Error fetching lookup options:', error);
      throw error;
    }
  }

  /**
   * Search lookup options with filtering
   * Useful for typeahead/autocomplete scenarios
   */
  static async searchLookupOptions(
    tenantId: string,
    targetModule: string,
    searchTerm: string,
    displayField?: string,
    searchFields?: string[]
  ) {
    const options = await this.getLookupOptions(
      tenantId,
      targetModule,
      searchTerm,
      displayField,
      searchFields || [displayField || 'name'],
      100
    );

    // Client-side filtering for better search experience
    if (searchTerm) {
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return options;
  }

  /**
   * Get full record details for cascading population
   * When a lookup value is selected, auto-populate related fields
   */
  static async getRecordDetails(tenantId: string, recordId: string) {
    try {
      const record = await prisma.dynamicRecord.findUnique({
        where: { id: recordId },
      });

      if (!record || record.tenantId !== tenantId) {
        throw new Error('Record not found');
      }

      return JSON.parse(record.data);
    } catch (error) {
      console.error('Error fetching record details:', error);
      throw error;
    }
  }

  /**
   * Validate lookup reference exists
   * Used during form validation to ensure referenced record exists
   */
  static async validateLookupReference(
    tenantId: string,
    targetModule: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const record = await prisma.dynamicRecord.findFirst({
        where: {
          id: recordId,
          tenantId,
          moduleName: targetModule,
          status: 'active',
        },
      });

      return !!record;
    } catch (error) {
      console.error('Error validating lookup reference:', error);
      return false;
    }
  }

  /**
   * Get cascade mappings - which fields should auto-populate when lookup selected
   * Example: When clientId is selected, auto-populate clientName, clientEmail, etc.
   */
  static getCascadeMappings(fieldConfig: any): Record<string, string> {
    // cascadeFields: { sourceField: 'targetFieldName' }
    // Example: { 'name': 'clientName', 'email': 'clientEmail', 'phone': 'clientPhone' }
    return fieldConfig.cascadeFields || {};
  }

  /**
   * Auto-populate fields based on lookup selection
   * Used in forms to cascade field population
   */
  static cascadePopulation(
    sourceRecord: any,
    cascadeMappings: Record<string, string>
  ): Record<string, any> {
    const populatedFields: Record<string, any> = {};

    Object.entries(cascadeMappings).forEach(([sourceField, targetField]) => {
      if (sourceRecord[sourceField] !== undefined) {
        populatedFields[targetField] = sourceRecord[sourceField];
      }
    });

    return populatedFields;
  }

  /**
   * Get module references - which modules reference this module
   * Useful for understanding data relationships
   */
  static async getModuleReferences(tenantId: string, moduleName: string) {
    try {
      const configurations = await prisma.moduleConfiguration.findMany({
        where: { tenantId, status: 'active' },
      });

      const references: Record<string, string[]> = {};

      configurations.forEach((config) => {
        const fields = JSON.parse(config.fields);
        const lookupFields = fields.filter(
          (f: any) =>
            f.dataType === 'lookup' &&
            f.config?.targetModule === moduleName
        );

        if (lookupFields.length > 0) {
          references[config.moduleName] = lookupFields.map((f: any) => f.name);
        }
      });

      return references;
    } catch (error) {
      console.error('Error getting module references:', error);
      throw error;
    }
  }
}
