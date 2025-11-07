'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Select,
  Button,
  Divider,
  Text,
  IconButton,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import ValidationRuleBuilder, { ValidationRule as ValidationRuleType } from './ValidationRuleBuilder';
import ValidationRuleTester from './ValidationRuleTester';
import DependencyConfigurator, { DependencyRule } from './DependencyConfigurator';

interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  dataType: string;
  uiType: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  config?: {
    maxLength?: number;
    minLength?: number;
    min?: number;
    max?: number;
    options?: OptionItem[];
    targetModule?: string;
    displayField?: string;
    searchFields?: string[];
    cascadeFields?: Record<string, string>;
    columns?: any[];
    [key: string]: any;
  };
  options?: OptionItem[]; // Deprecated - keep for backward compatibility
  lookupConfig?: LookupConfig;
  tableConfig?: TableConfig;
  dependencies?: DependencyRule[];
}

interface ValidationRule {
  id?: string;
  type: string;
  value?: any;
  message?: string;
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
}

interface OptionItem {
  label: string;
  value: string;
}

interface LookupConfig {
  targetModule: string;
  displayField: string;
  valueField?: string;
}

interface TableConfig {
  columns: any[];
}

interface FieldPropertyPanelProps {
  field: FieldDefinition | null;
  onFieldUpdate: (field: FieldDefinition) => void;
  onClose: () => void;
  availableFields?: string[];
}

export default function FieldPropertyPanel({
  field,
  onFieldUpdate,
  onClose,
  availableFields = [],
}: FieldPropertyPanelProps) {
  const [localField, setLocalField] = useState<FieldDefinition | null>(field);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  if (!localField) {
    return (
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        p={6}
        h="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500">Select a field to configure</Text>
      </Box>
    );
  }

  const handleChange = (key: keyof FieldDefinition, value: any) => {
    const updatedField = { ...localField, [key]: value };
    setLocalField(updatedField);
  };

  const handleSave = () => {
    if (localField) {
      onFieldUpdate(localField);
    }
  };

  const addValidation = () => {
    const validations = localField.validation || [];
    handleChange('validation', [
      ...validations,
      { type: 'required', message: 'This field is required' },
    ]);
  };

  const updateValidation = (index: number, key: string, value: any) => {
    const validations = [...(localField.validation || [])];
    validations[index] = { ...validations[index], [key]: value };
    handleChange('validation', validations);
  };

  const removeValidation = (index: number) => {
    const validations = [...(localField.validation || [])];
    validations.splice(index, 1);
    handleChange('validation', validations);
  };

  const addOption = () => {
    const currentOptions = localField.config?.options || [];
    handleChange('config', { 
      ...localField.config, 
      options: [...currentOptions, { label: '', value: '' }] 
    });
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    const currentOptions = [...(localField.config?.options || [])];
    currentOptions[index] = { ...currentOptions[index], [key]: value };
    handleChange('config', { 
      ...localField.config, 
      options: currentOptions 
    });
  };

  const removeOption = (index: number) => {
    const currentOptions = [...(localField.config?.options || [])];
    currentOptions.splice(index, 1);
    handleChange('config', { 
      ...localField.config, 
      options: currentOptions 
    });
  };

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <HStack p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Heading size="md" flex={1}>
          Field Properties
        </Heading>
        <IconButton
          aria-label="Close panel"
          icon={<FiX />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </HStack>

      {/* Content */}
      <Box flex={1} overflowY="auto" p={4}>
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>Basic</Tab>
            <Tab>
              Validation
              {localField.validation && localField.validation.length > 0 && (
                <Badge ml={2} colorScheme="blue">
                  {localField.validation.length}
                </Badge>
              )}
            </Tab>
            <Tab>
              Dependencies
              {localField.dependencies && localField.dependencies.length > 0 && (
                <Badge ml={2} colorScheme="purple">
                  {localField.dependencies.length}
                </Badge>
              )}
            </Tab>
            <Tab>Advanced</Tab>
          </TabList>

          <TabPanels>
            {/* Basic Properties */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Field Name</FormLabel>
                  <Input
                    value={localField.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., firstName"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Internal field identifier (camelCase, no spaces)
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Field Label</FormLabel>
                  <Input
                    value={localField.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    placeholder="e.g., First Name"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Display label shown to users
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Data Type</FormLabel>
                  <Select
                    value={localField.dataType}
                    onChange={(e) => handleChange('dataType', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Text Area</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="date">Date</option>
                    <option value="datetime">Date & Time</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="radio">Radio Button</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-Select</option>
                    <option value="lookup">Lookup</option>
                    <option value="table">Table</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Placeholder</FormLabel>
                  <Input
                    value={localField.placeholder || ''}
                    onChange={(e) => handleChange('placeholder', e.target.value)}
                    placeholder="e.g., Enter your first name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Help Text</FormLabel>
                  <Textarea
                    value={localField.helpText || ''}
                    onChange={(e) => handleChange('helpText', e.target.value)}
                    placeholder="Additional guidance for users"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Default Value</FormLabel>
                  <Input
                    value={localField.defaultValue || ''}
                    onChange={(e) => handleChange('defaultValue', e.target.value)}
                    placeholder="Default value (optional)"
                  />
                </FormControl>

                <Divider />

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Required Field</FormLabel>
                  <Switch
                    isChecked={localField.required || false}
                    onChange={(e) => handleChange('required', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Read Only</FormLabel>
                  <Switch
                    isChecked={localField.readOnly || false}
                    onChange={(e) => handleChange('readOnly', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Hidden</FormLabel>
                  <Switch
                    isChecked={localField.hidden || false}
                    onChange={(e) => handleChange('hidden', e.target.checked)}
                  />
                </FormControl>

                {/* Options for Select/MultiSelect/Dropdown/Radio */}
                {(localField.dataType === 'select' || 
                  localField.dataType === 'multiselect' || 
                  localField.dataType === 'dropdown' ||
                  localField.dataType === 'radio') && (
                  <Box>
                    <HStack mb={2}>
                      <FormLabel mb={0}>Options</FormLabel>
                      <Button
                        size="sm"
                        leftIcon={<FiPlus />}
                        onClick={addOption}
                        colorScheme="blue"
                        variant="ghost"
                      >
                        Add Option
                      </Button>
                    </HStack>
                    <VStack spacing={2} align="stretch">
                      {(localField.config?.options || []).map((option, index) => (
                        <HStack key={index}>
                          <Input
                            placeholder="Label"
                            value={option.label}
                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                            size="sm"
                          />
                          <Input
                            placeholder="Value"
                            value={option.value}
                            onChange={(e) => updateOption(index, 'value', e.target.value)}
                            size="sm"
                          />
                          <IconButton
                            aria-label="Remove option"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeOption(index)}
                          />
                        </HStack>
                      ))}
                      {(!localField.config?.options || localField.config.options.length === 0) && (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                          No options added yet. Click &quot;Add Option&quot; to get started.
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Lookup Configuration */}
                {localField.dataType === 'lookup' && (
                  <Box>
                    <FormLabel>Lookup Configuration</FormLabel>
                    <VStack spacing={3} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="sm">Target Module</FormLabel>
                        <Select
                          value={localField.config?.targetModule || ''}
                          onChange={(e) =>
                            handleChange('config', {
                              ...localField.config,
                              targetModule: e.target.value,
                            })
                          }
                          size="sm"
                        >
                          <option value="">Select module...</option>
                          <option value="Leads">Leads</option>
                          <option value="Clients">Clients</option>
                          <option value="Quotations">Quotations</option>
                          <option value="Orders">Orders</option>
                          <option value="Invoices">Invoices</option>
                          <option value="Payments">Payments</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Display Field</FormLabel>
                        <Input
                          value={localField.config?.displayField || ''}
                          onChange={(e) =>
                            handleChange('config', {
                              ...localField.config,
                              displayField: e.target.value,
                            })
                          }
                          size="sm"
                          placeholder="e.g., name"
                        />
                      </FormControl>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </TabPanel>

            {/* Validation Rules */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <ValidationRuleBuilder
                  rules={
                    (localField.validation || []).map((v, idx) => ({
                      id: v.id || `rule-${idx}`,
                      type: v.type as ValidationRuleType['type'],
                      value: v.value,
                      message: v.message,
                      condition: v.condition as ValidationRuleType['condition'],
                    }))
                  }
                  onChange={(rules) => {
                    handleChange('validation', rules);
                  }}
                  availableFields={availableFields}
                  dataType={localField.dataType}
                />

                <Divider />

                <ValidationRuleTester
                  rules={
                    (localField.validation || []).map((v, idx) => ({
                      id: v.id || `rule-${idx}`,
                      type: v.type as ValidationRuleType['type'],
                      value: v.value,
                      message: v.message,
                      condition: v.condition as ValidationRuleType['condition'],
                    }))
                  }
                  fieldName={localField.name}
                  dataType={localField.dataType}
                />
              </VStack>
            </TabPanel>

            {/* Dependencies */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <DependencyConfigurator
                  dependencies={localField.dependencies || []}
                  onChange={(deps) => handleChange('dependencies', deps)}
                  availableFields={availableFields}
                  currentFieldName={localField.name}
                />
              </VStack>
            </TabPanel>

            {/* Advanced Settings */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.500">
                  Advanced field configuration options will be available here.
                </Text>
                <FormControl>
                  <FormLabel>Field Group</FormLabel>
                  <Input placeholder="e.g., Personal Information" size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel>Display Order</FormLabel>
                  <Input type="number" placeholder="e.g., 1" size="sm" />
                </FormControl>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Footer */}
      <HStack p={4} borderTop="1px solid" borderColor={borderColor} spacing={3}>
        <Button flex={1} variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button flex={1} colorScheme="blue" onClick={handleSave}>
          Save Changes
        </Button>
      </HStack>
    </Box>
  );
}
