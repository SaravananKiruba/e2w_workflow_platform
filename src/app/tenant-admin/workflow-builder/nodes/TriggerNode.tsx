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
} from '@chakra-ui/react';
import { FiZap } from 'react-icons/fi';

interface TriggerNodeProps {
  data: {
    label: string;
    config: any;
    moduleName: string;
  };
  id: string;
}

const TriggerNode = memo(({ data, id }: TriggerNodeProps) => {
  const [triggerType, setTriggerType] = useState(data.config?.type || 'onCreate');
  const [targetField, setTargetField] = useState(data.config?.field || '');
  const [cronExpression, setCronExpression] = useState(data.config?.schedule || '');

  const handleTypeChange = (type: string) => {
    setTriggerType(type);
    data.config = {
      ...data.config,
      type,
      ...(type === 'onFieldChange' && targetField && { field: targetField }),
      ...(type === 'scheduled' && cronExpression && { schedule: cronExpression }),
    };
  };

  const handleFieldChange = (field: string) => {
    setTargetField(field);
    data.config = {
      ...data.config,
      field,
    };
  };

  const handleCronChange = (schedule: string) => {
    setCronExpression(schedule);
    data.config = {
      ...data.config,
      schedule,
    };
  };

  return (
    <Box
      bg="green.50"
      border="2px"
      borderColor="green.500"
      borderRadius="md"
      p={4}
      minW="300px"
      boxShadow="md"
    >
      <VStack spacing={3} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiZap} color="green.600" boxSize={5} />
            <Text fontWeight="bold" color="green.700">
              Trigger
            </Text>
          </HStack>
          <Badge colorScheme="green">START</Badge>
        </HStack>

        {/* Trigger Type */}
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            Trigger Type
          </FormLabel>
          <Select
            size="sm"
            value={triggerType}
            onChange={(e) => handleTypeChange(e.target.value)}
            bg="white"
          >
            <option value="onCreate">On Create</option>
            <option value="onUpdate">On Update</option>
            <option value="onDelete">On Delete</option>
            <option value="onStatusChange">On Status Change</option>
            <option value="onFieldChange">On Field Change</option>
            <option value="scheduled">Scheduled (Cron)</option>
          </Select>
        </FormControl>

        {/* Conditional Fields */}
        {triggerType === 'onFieldChange' && (
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>
              Field Name
            </FormLabel>
            <Input
              size="sm"
              placeholder="e.g., status, amount"
              value={targetField}
              onChange={(e) => handleFieldChange(e.target.value)}
              bg="white"
            />
          </FormControl>
        )}

        {triggerType === 'scheduled' && (
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>
              Cron Expression
            </FormLabel>
            <Input
              size="sm"
              placeholder="e.g., 0 9 * * 1-5"
              value={cronExpression}
              onChange={(e) => handleCronChange(e.target.value)}
              bg="white"
            />
            <Text fontSize="xs" color="gray.600" mt={1}>
              Example: "0 9 * * 1-5" = 9 AM weekdays
            </Text>
          </FormControl>
        )}

        {/* Module Info */}
        <Text fontSize="xs" color="gray.600">
          Module: <strong>{data.moduleName || 'Not selected'}</strong>
        </Text>
      </VStack>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#38A169', width: 12, height: 12 }}
      />
    </Box>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;
