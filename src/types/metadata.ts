export interface FieldConfig {
  maxLength?: number;
  minLength?: number;
  min?: number | null;
  max?: number | null;
  currency?: string;
  decimals?: number;
  options?: string[] | { label: string; value: string }[];
  pattern?: string;
  maxSize?: number;
  accept?: string;
  expression?: string;
  [key: string]: any;
}

export interface FieldDefinition {
  name: string;
  label: string;
  dataType: string;
  uiType: string;
  config?: FieldConfig;
  validation?: ValidationRule[];
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
  helpText?: string;
  placeholder?: string;
}

export interface ValidationRule {
  type: string;
  message?: string;
  config?: Record<string, any>;
}

export interface LayoutConfig {
  type: 'single_column' | 'two_column' | 'tabbed' | 'wizard';
  sections?: LayoutSection[];
  tabs?: LayoutTab[];
  steps?: LayoutStep[];
}

export interface LayoutSection {
  title?: string;
  fields: string[];
  columns?: number;
}

export interface LayoutTab {
  name: string;
  label: string;
  sections: LayoutSection[];
}

export interface LayoutStep {
  name: string;
  label: string;
  sections: LayoutSection[];
}

export interface ModuleConfig {
  moduleName: string;
  displayName: string;
  icon?: string;
  description?: string;
  fields: FieldDefinition[];
  layouts?: LayoutConfig;
  validations?: ValidationRule[];
  status: 'draft' | 'review' | 'active' | 'archived';
  version: number;
}

export interface MetadataLibraryItem {
  id: string;
  category: 'field_types' | 'ui_components' | 'validation_types' | 'data_sources' | 'layout_templates';
  name: string;
  label: string;
  description?: string;
  config: FieldConfig;
  isSystem: boolean;
  status: string;
}
