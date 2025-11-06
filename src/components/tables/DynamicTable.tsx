'use client';

import { Table, Thead, Tbody, Tr, Th, Td, Badge, Text } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { format } from 'date-fns';

interface DynamicTableProps {
  fields: FieldDefinition[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
}

export function DynamicTable({ fields, data, onRowClick }: DynamicTableProps) {
  const renderCellValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined) {
      return <Text color="gray.400">-</Text>;
    }

    switch (field.uiType) {
      case 'badge':
        return <Badge colorScheme="blue">{value}</Badge>;

      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy');
        } catch {
          return value;
        }

      case 'datetime':
        try {
          return format(new Date(value), 'dd/MM/yyyy HH:mm');
        } catch {
          return value;
        }

      case 'currency':
        const currency = field.config?.currency || 'INR';
        const decimals = field.config?.decimals || 2;
        return `${currency} ${Number(value).toFixed(decimals)}`;

      case 'checkbox':
        return <Badge colorScheme={value ? 'green' : 'gray'}>{value ? 'Yes' : 'No'}</Badge>;

      default:
        return String(value);
    }
  };

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          {fields.map(field => (
            <Th key={field.name}>{field.label}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {data.map((row, idx) => (
          <Tr
            key={idx}
            onClick={() => onRowClick?.(row)}
            cursor={onRowClick ? 'pointer' : 'default'}
            _hover={onRowClick ? { bg: 'gray.50' } : {}}
          >
            {fields.map(field => (
              <Td key={field.name}>{renderCellValue(field, row[field.name])}</Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
