/**
 * Simple Table Wrapper for Module List View
 * Adapts DynamicTable to work with module records
 */

'use client';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  HStack,
  Badge,
  Box,
} from '@chakra-ui/react';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { ModuleConfig } from '@/types/metadata';
import { format } from 'date-fns';

interface ModuleRecord {
  id: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
  [key: string]: any;
}

interface SimpleTableViewProps {
  config: ModuleConfig;
  records: ModuleRecord[];
  onView: (record: ModuleRecord) => void;
  onEdit: (recordId: string) => void;
  onDelete: (recordId: string) => void;
}

export function SimpleTableView({
  config,
  records,
  onView,
  onEdit,
  onDelete,
}: SimpleTableViewProps) {
  const getFieldValue = (record: ModuleRecord, fieldName: string): any => {
    if (record.data && record.data[fieldName] !== undefined) {
      return record.data[fieldName];
    }
    return record[fieldName];
  };

  const formatValue = (value: any, dataType: string) => {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'object') {
      return value.label || value.value || value.name || '-';
    }

    if (dataType === 'date' && value) {
      try {
        return format(new Date(value), 'dd MMM yyyy');
      } catch {
        return String(value);
      }
    }

    if (dataType === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  // Show first 5 important fields
  const visibleFields = config.fields.slice(0, 5);

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr bg="gray.50">
            {visibleFields.map((field) => (
              <Th key={field.name}>{field.label}</Th>
            ))}
            <Th>Status</Th>
            <Th textAlign="center">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {records.map((record) => (
            <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
              {visibleFields.map((field) => (
                <Td key={field.name}>
                  {formatValue(getFieldValue(record, field.name), field.dataType)}
                </Td>
              ))}
              <Td>
                <Badge
                  colorScheme={
                    record.status === 'active' ? 'green' : 'gray'
                  }
                  size="sm"
                >
                  {record.status}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={1} justify="center">
                  <IconButton
                    aria-label="View"
                    icon={<FiEye />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onView(record)}
                  />
                  <IconButton
                    aria-label="Edit"
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => onEdit(record.id)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onDelete(record.id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
