import { prisma } from '@/lib/prisma';
import { MetadataLibraryItem, FieldDefinition } from '@/types/metadata';

export class MetadataService {
  // Get all metadata library items by category
  static async getLibraryByCategory(category: string): Promise<MetadataLibraryItem[]> {
    const items = await prisma.metadataLibrary.findMany({
      where: { category, status: 'active' },
      orderBy: { label: 'asc' },
    });

    return items.map(item => ({
      id: item.id,
      category: item.category as 'field_types' | 'ui_components' | 'validation_types' | 'data_sources' | 'layout_templates',
      name: item.name,
      label: item.label,
      description: item.description || undefined,
      config: JSON.parse(item.config),
      isSystem: item.isSystem,
      status: item.status,
    }));
  }

  // Get available field types
  static async getFieldTypes() {
    return this.getLibraryByCategory('field_types');
  }

  // Get available UI components
  static async getUIComponents() {
    return this.getLibraryByCategory('ui_components');
  }

  // Get available validation types
  static async getValidationTypes() {
    return this.getLibraryByCategory('validation_types');
  }

  // Get available layout templates
  static async getLayoutTemplates() {
    return this.getLibraryByCategory('layout_templates');
  }

  // Validate field definition against metadata library
  static async validateFieldDefinition(field: FieldDefinition): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if data type exists
    const fieldTypes = await this.getFieldTypes();
    const dataTypeExists = fieldTypes.some(ft => ft.name === field.dataType);
    if (!dataTypeExists) {
      errors.push(`Invalid data type: ${field.dataType}`);
    }

    // Check if UI type exists
    const uiComponents = await this.getUIComponents();
    const uiTypeExists = uiComponents.some(ui => ui.name === field.uiType);
    if (!uiTypeExists) {
      errors.push(`Invalid UI type: ${field.uiType}`);
    }

    // Validate validations
    if (field.validation && field.validation.length > 0) {
      const validationTypes = await this.getValidationTypes();
      for (const validation of field.validation) {
        const validationExists = validationTypes.some(vt => vt.name === validation.type);
        if (!validationExists) {
          errors.push(`Invalid validation type: ${validation.type}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Add custom metadata item (requires SaaS Provider approval)
  static async requestCustomMetadata(
    category: string,
    name: string,
    label: string,
    description: string,
    config: any
  ) {
    return prisma.metadataLibrary.create({
      data: {
        category,
        name,
        label,
        description,
        config: JSON.stringify(config),
        isSystem: false,
        status: 'review', // Requires approval
      },
    });
  }
}
