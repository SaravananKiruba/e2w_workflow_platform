'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  Input,
  Icon,
  Badge,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { FiFilter, FiPlus, FiX } from 'react-icons/fi';

interface ConditionRule {
  field: string;
  operator: string;
  value: string;
}

interface ConditionNodeProps {
  data: {
    label: string;
    config: any;
    moduleName: string;
  };
  id: string;
}

const ConditionNode = memo(({ data, id }: ConditionNodeProps) => {
  const initialRules: ConditionRule[] = data.config?.rules || [
    { field: '', operator: 'equals', value: '' },
  ];
  
  const [logicOperator, setLogicOperator] = useState(data.config?.operator || 'AND');
  const [rules, setRules] = useState<ConditionRule[]>(initialRules);

  const updateConfig = (newRules: ConditionRule[], newOperator?: string) => {
    data.config = {
      operator: newOperator || logicOperator,
      rules: newRules,
    };
  };

  const addRule = () => {
    const newRules = [...rules, { field: '', operator: 'equals', value: '' }];
    setRules(newRules);
    updateConfig(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    updateConfig(newRules);
  };

  const updateRule = (index: number, key: keyof ConditionRule, value: string) => {
    const newRules = rules.map((rule, i) =>
      i === index ? { ...rule, [key]: value } : rule
    );
    setRules(newRules);
    updateConfig(newRules);
  };

  const handleOperatorChange = (operator: string) => {
    setLogicOperator(operator);
    updateConfig(rules, operator);
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#ECC94B', width: 12, height: 12 }}
      />

      <Box
        bg="yellow.50"
        border="2px"
        borderColor="yellow.500"
        borderRadius="md"
        p={4}
        minW="350px"
        maxW="450px"
        boxShadow="md"
      >
        <VStack spacing={3} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiFilter} color="yellow.700" boxSize={5} />
              <Text fontWeight="bold" color="yellow.700">
                Condition
              </Text>
            </HStack>
            <Badge colorScheme="yellow">IF</Badge>
          </HStack>

          {/* Logic Operator */}
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>
              Logic
            </FormLabel>
            <Select
              size="sm"
              value={logicOperator}
              onChange={(e) => handleOperatorChange(e.target.value)}
              bg="white"
            >
              <option value="AND">ALL conditions must match (AND)</option>
              <option value="OR">ANY condition can match (OR)</option>
            </Select>
          </FormControl>

          {/* Rules */}
          <VStack spacing={2} align="stretch">
            {rules.map((rule, index) => (
              <Box key={index} p={2} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      Rule {index + 1}
                    </Text>
                    {rules.length > 1 && (
                      <IconButton
                        aria-label="Remove rule"
                        icon={<FiX />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeRule(index)}
                      />
                    )}
                  </HStack>

                  <Input
                    size="sm"
                    placeholder="Field name"
                    value={rule.field}
                    onChange={(e) => updateRule(index, 'field', e.target.value)}
                  />

                  <Select
                    size="sm"
                    value={rule.operator}
                    onChange={(e) => updateRule(index, 'operator', e.target.value)}
                  >
                    <option value="equals">Equals</option>
                    <option value="notEquals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="lessThan">Less Than</option>
                    <option value="in">In List</option>
                    <option value="notIn">Not In List</option>
                  </Select>

                  <Input
                    size="sm"
                    placeholder="Value"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                  />
                </VStack>
              </Box>
            ))}

            <Button
              size="sm"
              leftIcon={<FiPlus />}
              onClick={addRule}
              variant="outline"
              colorScheme="yellow"
            >
              Add Rule
            </Button>
          </VStack>
        </VStack>
      </Box>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#ECC94B', width: 12, height: 12 }}
      />
    </>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;
