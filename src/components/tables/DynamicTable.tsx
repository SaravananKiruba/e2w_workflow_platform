'use client';

import { useState } from 'react';
import { 
  Table, Thead, Tbody, Tr, Th, Td, Badge, Text, Box, Input, 
  InputGroup, InputLeftElement, Icon, HStack, Button, Menu,
  MenuButton, MenuList, MenuItem, Tag, TagLabel, TagCloseButton,
  Checkbox
} from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { format } from 'date-fns';
import { FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';

interface DynamicTableProps {
  fields: FieldDefinition[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  onFilterChange?: (filters: any[]) => void;
  onSearchChange?: (search: string) => void;
  enableFilters?: boolean;
  enableSearch?: boolean;
}

export function DynamicTable({ 
  fields, 
  data, 
  onRowClick, 
  onFilterChange,
  onSearchChange,
  enableFilters = false,
  enableSearch = false
}: DynamicTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(fields.map(f => f.name))
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const toggleColumnVisibility = (fieldName: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(fieldName)) {
      newVisible.delete(fieldName);
    } else {
      newVisible.add(fieldName);
    }
    setVisibleColumns(newVisible);
  };

  const removeFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    onFilterChange?.([]);
    onSearchChange?.('');
  };

  const visibleFields = fields.filter(f => visibleColumns.has(f.name));

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
    <Box>
      {/* Filter Bar */}
      {(enableSearch || enableFilters) && (
        <Box mb={4} p={4} bg="white" borderRadius="md" shadow="sm">
          <HStack spacing={4} mb={activeFilters.length > 0 ? 3 : 0}>
            {/* Search Input */}
            {enableSearch && (
              <InputGroup maxW="400px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            )}

            {/* Column Visibility Toggle */}
            {enableFilters && (
              <Menu closeOnSelect={false}>
                <MenuButton as={Button} rightIcon={<Icon as={FiChevronDown} />} size="sm">
                  Columns
                </MenuButton>
                <MenuList>
                  {fields.map(field => (
                    <MenuItem key={field.name} onClick={() => toggleColumnVisibility(field.name)}>
                      <Checkbox 
                        isChecked={visibleColumns.has(field.name)}
                        mr={2}
                      >
                        {field.label}
                      </Checkbox>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            )}

            {/* Clear Filters Button */}
            {(activeFilters.length > 0 || searchTerm) && (
              <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </HStack>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <HStack spacing={2} flexWrap="wrap">
              {activeFilters.map((filter, index) => (
                <Tag key={index} size="md" colorScheme="blue" borderRadius="full">
                  <TagLabel>{filter.field}: {filter.operator}</TagLabel>
                  <TagCloseButton onClick={() => removeFilter(index)} />
                </Tag>
              ))}
            </HStack>
          )}
        </Box>
      )}

      {/* Table */}
      <Table variant="simple">
        <Thead>
          <Tr>
            {visibleFields.map(field => (
              <Th key={field.name}>{field.label}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.length === 0 ? (
            <Tr>
              <Td colSpan={visibleFields.length} textAlign="center" py={8}>
                <Text color="gray.500">No data available</Text>
              </Td>
            </Tr>
          ) : (
            data.map((row, idx) => (
              <Tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                cursor={onRowClick ? 'pointer' : 'default'}
                _hover={onRowClick ? { bg: 'gray.50' } : {}}
              >
                {visibleFields.map(field => (
                  <Td key={field.name}>{renderCellValue(field, row[field.name])}</Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
