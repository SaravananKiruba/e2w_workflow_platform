'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  Text,
  Divider,
  Badge,
  useColorModeValue,
  Collapse,
  Textarea,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export interface ValidationRule {
  id: string;
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'email' | 'url' | 'pattern' | 'phone' | 'custom';
  value?: string | number;
  message?: string;
  condition?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string;
  };
}

interface ValidationRuleBuilderProps {
  rules: ValidationRule[];
  onChange: (rules: ValidationRule[]) => void;
  availableFields?: string[];
  dataType?: string;
}

const VALIDATION_TYPES = [
  { value: 'required', label: 'Required Field', description: 'Field must have a value' },
  { value: 'minLength', label: 'Minimum Length', description: 'Minimum number of characters', applicableTo: ['text', 'email', 'url'] },
  { value: 'maxLength', label: 'Maximum Length', description: 'Maximum number of characters', applicableTo: ['text', 'email', 'url'] },
  { value: 'min', label: 'Minimum Value', description: 'Minimum numeric value', applicableTo: ['number'] },
  { value: 'max', label: 'Maximum Value', description: 'Maximum numeric value', applicableTo: ['number'] },
  { value: 'email', label: 'Email Format', description: 'Must be valid email address', applicableTo: ['text', 'email'] },
  { value: 'url', label: 'URL Format', description: 'Must be valid URL', applicableTo: ['text', 'url'] },
  { value: 'phone', label: 'Phone Format', description: 'Must be valid phone number', applicableTo: ['text'] },
  { value: 'pattern', label: 'Regex Pattern', description: 'Custom regex validation', applicableTo: ['text', 'email', 'url'] },
  { value: 'custom', label: 'Custom Formula', description: 'Custom validation formula', applicableTo: ['all'] },
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
];

export default function ValidationRuleBuilder({
  rules,
  onChange,
  availableFields = [],
  dataType = 'text',
}: ValidationRuleBuilderProps) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const addRule = () => {
    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      type: 'required',
      message: '',
    };
    onChange([...rules, newRule]);
    setExpandedRules(new Set([...expandedRules, newRule.id]));
  };

  const removeRule = (ruleId: string) => {
    onChange(rules.filter(rule => rule.id !== ruleId));
    const newExpanded = new Set(expandedRules);
    newExpanded.delete(ruleId);
    setExpandedRules(newExpanded);
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    onChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const getApplicableValidations = () => {
    return VALIDATION_TYPES.filter(vt => 
      !vt.applicableTo || 
      vt.applicableTo.includes(dataType) || 
      vt.applicableTo.includes('all')
    );
  };

  const getDefaultMessage = (type: string, value?: string | number): string => {
    const messages: Record<string, string> = {
      required: 'This field is required',
      minLength: `Minimum ${value || 0} characters required`,
      maxLength: `Maximum ${value || 0} characters allowed`,
      min: `Value must be at least ${value || 0}`,
      max: `Value must be at most ${value || 0}`,
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      phone: 'Please enter a valid phone number',
      pattern: 'Invalid format',
      custom: 'Validation failed',
    };
    return messages[type] || 'Validation error';
  };

  const needsValue = (type: string): boolean => {
    return ['minLength', 'maxLength', 'min', 'max', 'pattern', 'custom'].includes(type);
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium">
          Validation Rules ({rules.length})
        </Text>
        <Button
          size="sm"
          leftIcon={<FiPlus />}
          colorScheme="blue"
          variant="ghost"
          onClick={addRule}
        >
          Add Rule
        </Button>
      </HStack>

      {rules.length === 0 && (
        <Box
          p={6}
          textAlign="center"
          borderWidth={1}
          borderStyle="dashed"
          borderColor={borderColor}
          borderRadius="md"
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <Text color="gray.500" fontSize="sm">
            No validation rules configured
          </Text>
          <Text color="gray.400" fontSize="xs" mt={1}>
            Click "Add Rule" to create your first validation
          </Text>
        </Box>
      )}

      <VStack spacing={2} align="stretch">
        {rules.map((rule, index) => {
          const isExpanded = expandedRules.has(rule.id);
          const validationType = VALIDATION_TYPES.find(vt => vt.value === rule.type);

          return (
            <Box
              key={rule.id}
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="md"
              bg={bgColor}
              overflow="hidden"
            >
              {/* Rule Header */}
              <HStack
                p={3}
                cursor="pointer"
                onClick={() => toggleExpanded(rule.id)}
                _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
              >
                <Badge colorScheme="blue" fontSize="xs">
                  {index + 1}
                </Badge>
                <Text fontSize="sm" fontWeight="medium" flex={1}>
                  {validationType?.label || rule.type}
                </Text>
                {rule.condition && (
                  <Badge colorScheme="purple" fontSize="xs">
                    Conditional
                  </Badge>
                )}
                <IconButton
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  size="xs"
                  variant="ghost"
                />
                <IconButton
                  aria-label="Delete rule"
                  icon={<FiTrash2 />}
                  size="xs"
                  colorScheme="red"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRule(rule.id);
                  }}
                />
              </HStack>

              {/* Rule Details */}
              <Collapse in={isExpanded}>
                <VStack spacing={3} p={3} pt={0} align="stretch">
                  <Divider />

                  {/* Validation Type */}
                  <FormControl>
                    <FormLabel fontSize="xs">Validation Type</FormLabel>
                    <Select
                      size="sm"
                      value={rule.type}
                      onChange={(e) => {
                        const newType = e.target.value as ValidationRule['type'];
                        updateRule(rule.id, {
                          type: newType,
                          message: getDefaultMessage(newType, rule.value),
                          value: needsValue(newType) ? rule.value : undefined,
                        });
                      }}
                    >
                      {getApplicableValidations().map(vt => (
                        <option key={vt.value} value={vt.value}>
                          {vt.label}
                        </option>
                      ))}
                    </Select>
                    {validationType?.description && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {validationType.description}
                      </Text>
                    )}
                  </FormControl>

                  {/* Value Input (for rules that need it) */}
                  {needsValue(rule.type) && (
                    <FormControl>
                      <FormLabel fontSize="xs">
                        {rule.type === 'pattern' ? 'Regex Pattern' : 
                         rule.type === 'custom' ? 'Formula' : 'Value'}
                      </FormLabel>
                      {rule.type === 'custom' ? (
                        <Textarea
                          size="sm"
                          value={rule.value || ''}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder="e.g., field1 + field2 > 100"
                          rows={2}
                          fontFamily="monospace"
                        />
                      ) : (
                        <Input
                          size="sm"
                          type={['min', 'max', 'minLength', 'maxLength'].includes(rule.type) ? 'number' : 'text'}
                          value={rule.value || ''}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder={
                            rule.type === 'pattern' ? '^[A-Z]{3}-\\d{3}$' : 
                            ['minLength', 'maxLength'].includes(rule.type) ? '10' : 
                            ['min', 'max'].includes(rule.type) ? '0' : ''
                          }
                          fontFamily={rule.type === 'pattern' ? 'monospace' : undefined}
                        />
                      )}
                    </FormControl>
                  )}

                  {/* Custom Error Message */}
                  <FormControl>
                    <FormLabel fontSize="xs">Error Message</FormLabel>
                    <Input
                      size="sm"
                      value={rule.message || ''}
                      onChange={(e) => updateRule(rule.id, { message: e.target.value })}
                      placeholder={getDefaultMessage(rule.type, rule.value)}
                    />
                  </FormControl>

                  {/* Conditional Validation */}
                  {availableFields.length > 0 && (
                    <FormControl>
                      <FormLabel fontSize="xs">
                        Conditional Validation (Optional)
                      </FormLabel>
                      {rule.condition ? (
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Text fontSize="xs">When</Text>
                            <Select
                              size="xs"
                              value={rule.condition.field}
                              onChange={(e) => updateRule(rule.id, {
                                condition: { ...rule.condition!, field: e.target.value }
                              })}
                            >
                              {availableFields.map(field => (
                                <option key={field} value={field}>{field}</option>
                              ))}
                            </Select>
                            <Select
                              size="xs"
                              value={rule.condition.operator}
                              onChange={(e) => updateRule(rule.id, {
                                condition: { ...rule.condition!, operator: e.target.value as any }
                              })}
                            >
                              {CONDITION_OPERATORS.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </Select>
                            <Input
                              size="xs"
                              value={rule.condition.value}
                              onChange={(e) => updateRule(rule.id, {
                                condition: { ...rule.condition!, value: e.target.value }
                              })}
                              placeholder="value"
                            />
                            <IconButton
                              aria-label="Remove condition"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              onClick={() => updateRule(rule.id, { condition: undefined })}
                            />
                          </HStack>
                        </VStack>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => updateRule(rule.id, {
                            condition: {
                              field: availableFields[0] || '',
                              operator: 'equals',
                              value: '',
                            }
                          })}
                        >
                          Add Condition
                        </Button>
                      )}
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Only validate when the condition is met
                      </Text>
                    </FormControl>
                  )}
                </VStack>
              </Collapse>
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
}
