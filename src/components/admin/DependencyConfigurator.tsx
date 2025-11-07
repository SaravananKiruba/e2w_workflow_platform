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
  Badge,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  SimpleGrid,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiAlertTriangle,
  FiGitBranch,
} from 'react-icons/fi';

export interface DependencyCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: string;
}

export interface DependencyRule {
  id: string;
  targetField: string;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional' | 'populate';
  conditions: DependencyCondition[];
  conditionLogic: 'AND' | 'OR';
  populateValue?: string; // For 'populate' action
}

interface DependencyConfiguratorProps {
  dependencies: DependencyRule[];
  onChange: (dependencies: DependencyRule[]) => void;
  availableFields: string[];
  currentFieldName?: string;
}

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals', symbol: '=' },
  { value: 'notEquals', label: 'Not Equals', symbol: '≠' },
  { value: 'contains', label: 'Contains', symbol: '⊃' },
  { value: 'greaterThan', label: 'Greater Than', symbol: '>' },
  { value: 'lessThan', label: 'Less Than', symbol: '<' },
  { value: 'isEmpty', label: 'Is Empty', symbol: '∅' },
  { value: 'isNotEmpty', label: 'Is Not Empty', symbol: '≠∅' },
];

const DEPENDENCY_ACTIONS = [
  { value: 'show', label: 'Show Field', icon: FiEye, color: 'green' },
  { value: 'hide', label: 'Hide Field', icon: FiEyeOff, color: 'red' },
  { value: 'enable', label: 'Enable Field', icon: FiUnlock, color: 'blue' },
  { value: 'disable', label: 'Disable Field', icon: FiLock, color: 'orange' },
  { value: 'require', label: 'Make Required', icon: FiAlertTriangle, color: 'purple' },
  { value: 'optional', label: 'Make Optional', icon: FiAlertTriangle, color: 'gray' },
  { value: 'populate', label: 'Auto-Populate Value', icon: FiGitBranch, color: 'teal' },
];

export default function DependencyConfigurator({
  dependencies,
  onChange,
  availableFields,
  currentFieldName,
}: DependencyConfiguratorProps) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [circularDepsDetected, setCircularDepsDetected] = useState<string[]>([]);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const addDependencyRule = () => {
    const newRule: DependencyRule = {
      id: `dep-${Date.now()}`,
      targetField: availableFields[0] || '',
      action: 'show',
      conditions: [{
        field: availableFields[0] || '',
        operator: 'equals',
        value: '',
      }],
      conditionLogic: 'AND',
    };
    onChange([...dependencies, newRule]);
    const newExpanded = new Set(expandedRules);
    newExpanded.add(newRule.id);
    setExpandedRules(newExpanded);
  };

  const removeDependencyRule = (ruleId: string) => {
    onChange(dependencies.filter(rule => rule.id !== ruleId));
    const newExpanded = new Set(expandedRules);
    newExpanded.delete(ruleId);
    setExpandedRules(newExpanded);
    detectCircularDependencies(dependencies.filter(rule => rule.id !== ruleId));
  };

  const updateDependencyRule = (ruleId: string, updates: Partial<DependencyRule>) => {
    const updatedDeps = dependencies.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    onChange(updatedDeps);
    detectCircularDependencies(updatedDeps);
  };

  const addCondition = (ruleId: string) => {
    const rule = dependencies.find(r => r.id === ruleId);
    if (!rule) return;

    const newCondition: DependencyCondition = {
      field: availableFields[0] || '',
      operator: 'equals',
      value: '',
    };

    updateDependencyRule(ruleId, {
      conditions: [...rule.conditions, newCondition],
    });
  };

  const removeCondition = (ruleId: string, conditionIndex: number) => {
    const rule = dependencies.find(r => r.id === ruleId);
    if (!rule) return;

    updateDependencyRule(ruleId, {
      conditions: rule.conditions.filter((_, idx) => idx !== conditionIndex),
    });
  };

  const updateCondition = (
    ruleId: string,
    conditionIndex: number,
    updates: Partial<DependencyCondition>
  ) => {
    const rule = dependencies.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedConditions = rule.conditions.map((cond, idx) =>
      idx === conditionIndex ? { ...cond, ...updates } : cond
    );

    updateDependencyRule(ruleId, { conditions: updatedConditions });
  };

  const detectCircularDependencies = (deps: DependencyRule[]) => {
    // Simple circular dependency detection
    const circularFields: string[] = [];
    const graph = new Map<string, Set<string>>();

    // Build dependency graph
    deps.forEach(rule => {
      rule.conditions.forEach(cond => {
        if (!graph.has(rule.targetField)) {
          graph.set(rule.targetField, new Set());
        }
        graph.get(rule.targetField)!.add(cond.field);
      });
    });

    // Check for cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (field: string): boolean => {
      visited.add(field);
      recStack.add(field);

      const neighbors = graph.get(field) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          circularFields.push(field);
          return true;
        }
      }

      recStack.delete(field);
      return false;
    };

    for (const field of graph.keys()) {
      if (!visited.has(field)) {
        hasCycle(field);
      }
    }

    setCircularDepsDetected(circularFields);
  };

  const getActionConfig = (action: string) => {
    return DEPENDENCY_ACTIONS.find(a => a.value === action) || DEPENDENCY_ACTIONS[0];
  };

  const getOperatorConfig = (operator: string) => {
    return CONDITION_OPERATORS.find(o => o.value === operator) || CONDITION_OPERATORS[0];
  };

  const needsValue = (operator: string): boolean => {
    return !['isEmpty', 'isNotEmpty'].includes(operator);
  };

  const filterAvailableFields = (excludeField?: string) => {
    return availableFields.filter(f => f !== excludeField && f !== currentFieldName);
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium">
          Field Dependencies ({dependencies.length})
        </Text>
        <Button
          size="sm"
          leftIcon={<FiPlus />}
          colorScheme="blue"
          variant="ghost"
          onClick={addDependencyRule}
          isDisabled={availableFields.length === 0}
        >
          Add Dependency
        </Button>
      </HStack>

      {circularDepsDetected.length > 0 && (
        <Alert status="warning" fontSize="sm">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Circular Dependencies Detected!</Text>
            <Text fontSize="xs">
              Fields with circular dependencies: {circularDepsDetected.join(', ')}
            </Text>
          </Box>
        </Alert>
      )}

      {dependencies.length === 0 && (
        <Box
          p={6}
          textAlign="center"
          borderWidth={1}
          borderStyle="dashed"
          borderColor={borderColor}
          borderRadius="md"
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <FiGitBranch size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <Text color="gray.500" fontSize="sm">
            No field dependencies configured
          </Text>
          <Text color="gray.400" fontSize="xs" mt={1}>
            Create rules to show/hide or enable/disable fields based on conditions
          </Text>
        </Box>
      )}

      <VStack spacing={3} align="stretch">
        {dependencies.map((rule, ruleIndex) => {
          const actionConfig = getActionConfig(rule.action);
          const ActionIcon = actionConfig.icon;
          const isCircular = circularDepsDetected.includes(rule.targetField);

          return (
            <Box
              key={rule.id}
              borderWidth={2}
              borderColor={isCircular ? 'red.500' : borderColor}
              borderRadius="md"
              bg={bgColor}
              overflow="hidden"
            >
              {/* Rule Header */}
              <HStack p={3} bg={useColorModeValue('gray.50', 'gray.600')}>
                <Badge colorScheme="blue" fontSize="xs">
                  #{ruleIndex + 1}
                </Badge>
                <ActionIcon size={14} />
                <Text fontSize="sm" fontWeight="medium" flex={1}>
                  {actionConfig.label}: <Badge colorScheme={actionConfig.color as any}>{rule.targetField}</Badge>
                </Text>
                <Badge colorScheme="purple" fontSize="xs">
                  {rule.conditionLogic}
                </Badge>
                <IconButton
                  aria-label="Delete rule"
                  icon={<FiTrash2 />}
                  size="xs"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => removeDependencyRule(rule.id)}
                />
              </HStack>

              <VStack spacing={3} p={3} align="stretch">
                {/* Action & Target Field */}
                <SimpleGrid columns={2} spacing={2}>
                  <FormControl>
                    <FormLabel fontSize="xs">Action</FormLabel>
                    <Select
                      size="sm"
                      value={rule.action}
                      onChange={(e) => updateDependencyRule(rule.id, {
                        action: e.target.value as DependencyRule['action'],
                      })}
                    >
                      {DEPENDENCY_ACTIONS.map(action => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Target Field</FormLabel>
                    <Select
                      size="sm"
                      value={rule.targetField}
                      onChange={(e) => updateDependencyRule(rule.id, {
                        targetField: e.target.value,
                      })}
                    >
                      {filterAvailableFields().map(field => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Auto-populate value */}
                {rule.action === 'populate' && (
                  <FormControl>
                    <FormLabel fontSize="xs">Value to Populate</FormLabel>
                    <Input
                      size="sm"
                      value={rule.populateValue || ''}
                      onChange={(e) => updateDependencyRule(rule.id, {
                        populateValue: e.target.value,
                      })}
                      placeholder="Enter value or formula"
                    />
                  </FormControl>
                )}

                <Divider />

                {/* Conditions */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="medium">
                      When (Conditions):
                    </Text>
                    <HStack spacing={2}>
                      <Select
                        size="xs"
                        value={rule.conditionLogic}
                        onChange={(e) => updateDependencyRule(rule.id, {
                          conditionLogic: e.target.value as 'AND' | 'OR',
                        })}
                        w="80px"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </Select>
                      <Button
                        size="xs"
                        leftIcon={<FiPlus />}
                        onClick={() => addCondition(rule.id)}
                      >
                        Add
                      </Button>
                    </HStack>
                  </HStack>

                  <VStack spacing={2} align="stretch">
                    {rule.conditions.map((condition, condIndex) => {
                      const operatorConfig = getOperatorConfig(condition.operator);
                      
                      return (
                        <Box key={condIndex}>
                          {condIndex > 0 && (
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color="purple.500"
                              textAlign="center"
                              my={1}
                            >
                              {rule.conditionLogic}
                            </Text>
                          )}
                          <HStack
                            p={2}
                            bg={useColorModeValue('gray.50', 'gray.700')}
                            borderRadius="md"
                            spacing={2}
                          >
                            <FormControl flex={1}>
                              <Select
                                size="xs"
                                value={condition.field}
                                onChange={(e) => updateCondition(rule.id, condIndex, {
                                  field: e.target.value,
                                })}
                              >
                                {filterAvailableFields(rule.targetField).map(field => (
                                  <option key={field} value={field}>
                                    {field}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>

                            <FormControl flex={1}>
                              <Select
                                size="xs"
                                value={condition.operator}
                                onChange={(e) => updateCondition(rule.id, condIndex, {
                                  operator: e.target.value as DependencyCondition['operator'],
                                })}
                              >
                                {CONDITION_OPERATORS.map(op => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>

                            {needsValue(condition.operator) && (
                              <FormControl flex={1}>
                                <Input
                                  size="xs"
                                  value={condition.value}
                                  onChange={(e) => updateCondition(rule.id, condIndex, {
                                    value: e.target.value,
                                  })}
                                  placeholder="value"
                                />
                              </FormControl>
                            )}

                            <IconButton
                              aria-label="Remove condition"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeCondition(rule.id, condIndex)}
                              isDisabled={rule.conditions.length === 1}
                            />
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Rule Summary */}
                <Box
                  p={2}
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderRadius="md"
                  fontSize="xs"
                >
                  <Text fontWeight="bold" mb={1}>Rule Summary:</Text>
                  <Text>
                    {actionConfig.label} "<strong>{rule.targetField}</strong>" when{' '}
                    {rule.conditions.map((cond, idx) => (
                      <span key={idx}>
                        {idx > 0 && ` ${rule.conditionLogic} `}
                        <strong>{cond.field}</strong> {getOperatorConfig(cond.operator).symbol}{' '}
                        {needsValue(cond.operator) && `"${cond.value}"`}
                      </span>
                    ))}
                    {rule.action === 'populate' && ` → set to "${rule.populateValue}"`}
                  </Text>
                </Box>
              </VStack>
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
}
