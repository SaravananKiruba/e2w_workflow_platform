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
  Textarea,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiBell, FiMail, FiEdit, FiFileText, FiLink } from 'react-icons/fi';

interface ActionNodeProps {
  data: {
    label: string;
    config: any;
    moduleName: string;
  };
  id: string;
}

const ActionNode = memo(({ data, id }: ActionNodeProps) => {
  const [actionType, setActionType] = useState(data.config?.type || 'notification');
  const [actionConfig, setActionConfig] = useState(data.config || {});

  const updateConfig = (key: string, value: any) => {
    const newConfig = {
      ...actionConfig,
      type: actionType,
      [key]: value,
    };
    setActionConfig(newConfig);
    data.config = newConfig;
  };

  const handleTypeChange = (type: string) => {
    setActionType(type);
    const newConfig = { type };
    setActionConfig(newConfig);
    data.config = newConfig;
  };

  const getIcon = () => {
    switch (actionType) {
      case 'sendEmail':
        return FiMail;
      case 'updateRecord':
        return FiEdit;
      case 'createRecord':
        return FiFileText;
      case 'webhook':
        return FiLink;
      default:
        return FiBell;
    }
  };

  const getColor = () => {
    switch (actionType) {
      case 'sendEmail':
        return 'blue';
      case 'updateRecord':
        return 'orange';
      case 'createRecord':
        return 'green';
      case 'webhook':
        return 'cyan';
      default:
        return 'purple';
    }
  };

  const color = getColor();

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#805AD5', width: 12, height: 12 }}
      />

      <Box
        bg={`${color}.50`}
        border="2px"
        borderColor={`${color}.500`}
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
              <Icon as={getIcon()} color={`${color}.600`} boxSize={5} />
              <Text fontWeight="bold" color={`${color}.700`}>
                Action
              </Text>
            </HStack>
            <Badge colorScheme={color}>THEN</Badge>
          </HStack>

          {/* Action Type */}
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>
              Action Type
            </FormLabel>
            <Select
              size="sm"
              value={actionType}
              onChange={(e) => handleTypeChange(e.target.value)}
              bg="white"
            >
              <option value="notification">Send Notification</option>
              <option value="sendEmail">Send Email</option>
              <option value="updateRecord">Update Record</option>
              <option value="createRecord">Create Record</option>
              <option value="webhook">Call Webhook</option>
            </Select>
          </FormControl>

          {/* Action-specific Configuration */}
          {actionType === 'sendEmail' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  To Email
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="recipient@example.com"
                  value={actionConfig.to || ''}
                  onChange={(e) => updateConfig('to', e.target.value)}
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Subject
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="Email subject"
                  value={actionConfig.subject || ''}
                  onChange={(e) => updateConfig('subject', e.target.value)}
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Body Template
                </FormLabel>
                <Textarea
                  size="sm"
                  placeholder="Use {fieldName} for dynamic values"
                  value={actionConfig.body || ''}
                  onChange={(e) => updateConfig('body', e.target.value)}
                  bg="white"
                  rows={3}
                />
              </FormControl>
            </>
          )}

          {actionType === 'updateRecord' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Field to Update
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g., status"
                  value={actionConfig.field || ''}
                  onChange={(e) => updateConfig('field', e.target.value)}
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  New Value
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="New field value"
                  value={actionConfig.value || ''}
                  onChange={(e) => updateConfig('value', e.target.value)}
                  bg="white"
                />
              </FormControl>
            </>
          )}

          {actionType === 'createRecord' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Target Module
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="e.g., Tasks"
                  value={actionConfig.targetModule || ''}
                  onChange={(e) => updateConfig('targetModule', e.target.value)}
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Field Mapping (JSON)
                </FormLabel>
                <Textarea
                  size="sm"
                  placeholder='{"title": "{name}", "status": "new"}'
                  value={actionConfig.mapping || ''}
                  onChange={(e) => updateConfig('mapping', e.target.value)}
                  bg="white"
                  rows={3}
                />
              </FormControl>
            </>
          )}

          {actionType === 'webhook' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Webhook URL
                </FormLabel>
                <Input
                  size="sm"
                  placeholder="https://api.example.com/webhook"
                  value={actionConfig.url || ''}
                  onChange={(e) => updateConfig('url', e.target.value)}
                  bg="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Method
                </FormLabel>
                <Select
                  size="sm"
                  value={actionConfig.method || 'POST'}
                  onChange={(e) => updateConfig('method', e.target.value)}
                  bg="white"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Headers (JSON)
                </FormLabel>
                <Textarea
                  size="sm"
                  placeholder='{"Authorization": "Bearer token"}'
                  value={actionConfig.headers || ''}
                  onChange={(e) => updateConfig('headers', e.target.value)}
                  bg="white"
                  rows={2}
                />
              </FormControl>
            </>
          )}

          {actionType === 'notification' && (
            <>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Message
                </FormLabel>
                <Textarea
                  size="sm"
                  placeholder="Notification message"
                  value={actionConfig.message || ''}
                  onChange={(e) => updateConfig('message', e.target.value)}
                  bg="white"
                  rows={2}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>
                  Recipient Role
                </FormLabel>
                <Select
                  size="sm"
                  value={actionConfig.recipientRole || 'admin'}
                  onChange={(e) => updateConfig('recipientRole', e.target.value)}
                  bg="white"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="all">All Users</option>
                </Select>
              </FormControl>
            </>
          )}
        </VStack>
      </Box>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#805AD5', width: 12, height: 12 }}
      />
    </>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;
