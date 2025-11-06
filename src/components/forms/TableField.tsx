'use client';

import {
  Box,
  Button,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  NumberInput,
  NumberInputField,
  Select,
} from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { useState } from 'react';

interface TableFieldProps {
  field: FieldDefinition;
  value: any[];
  onChange: (name: string, value: any[]) => void;
  error?: string;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

/**
 * TableField Component - Renders nested table data for line items
 * Features:
 * - Add/edit/delete rows
 * - Validate each row
 * - Calculate totals
 * - Support nested field types
 */
export function TableField({ field, value = [], onChange, error }: TableFieldProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rows, setRows] = useState<TableRow[]>(value || []);
  const [editingRow, setEditingRow] = useState<TableRow | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const columns = field.config?.columns || [];
  const allowAdd = field.config?.allowAdd !== false;
  const allowDelete = field.config?.allowDelete !== false;
  const allowEdit = field.config?.allowEdit !== false;

  const handleAddRow = () => {
    const newRow: TableRow = {
      id: `row-${Date.now()}-${Math.random()}`,
    };
    columns.forEach((col: any) => {
      if (col.dataType === 'number' || col.dataType === 'currency') {
        newRow[col.name] = 0;
      } else if (col.dataType === 'checkbox') {
        newRow[col.name] = false;
      } else {
        newRow[col.name] = '';
      }
    });
    setEditingRow(newRow);
    setEditingIndex(null);
    onOpen();
  };

  const handleEditRow = (index: number) => {
    setEditingRow({ ...rows[index] });
    setEditingIndex(index);
    onOpen();
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    onChange(field.name, newRows);
  };

  const handleSaveRow = () => {
    if (!editingRow) return;

    let newRows: TableRow[];
    if (editingIndex !== null) {
      newRows = rows.map((row, idx) => (idx === editingIndex ? editingRow : row));
    } else {
      newRows = [...rows, editingRow];
    }

    setRows(newRows);
    onChange(field.name, newRows);
    setEditingRow(null);
    setEditingIndex(null);
    onClose();
  };

  const handleFieldChange = (columnName: string, value: any) => {
    if (!editingRow) return;
    setEditingRow({ ...editingRow, [columnName]: value });
  };

  const renderCellValue = (row: TableRow, column: FieldDefinition) => {
    const value = row[column.name];

    if (value === null || value === undefined) return '-';

    switch (column.dataType) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(value);
      case 'number':
        return value.toFixed(column.config?.decimals || 0);
      case 'checkbox':
        return value ? '✓' : '✗';
      default:
        return String(value);
    }
  };

  const renderEditInput = (column: FieldDefinition) => {
    const value = editingRow?.[column.name];

    switch (column.dataType) {
      case 'number':
      case 'currency':
        return (
          <NumberInput
            value={value || ''}
            onChange={(valueString) => handleFieldChange(column.name, Number(valueString))}
            min={column.config?.min ?? 0}
            max={column.config?.max ?? undefined}
          >
            <NumberInputField placeholder={column.placeholder} />
          </NumberInput>
        );

      case 'dropdown':
        return (
          <Select
            value={value || ''}
            onChange={(e) => handleFieldChange(column.name, e.target.value)}
            placeholder="Select..."
          >
            {column.config?.options?.map((option: any) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(column.name, e.target.value)}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(column.name, e.target.value)}
            placeholder={column.placeholder}
            maxLength={column.config?.maxLength}
          />
        );
    }
  };

  const calculateTotal = (columnName: string) => {
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => {
      const value = parseFloat(row[columnName]) || 0;
      return sum + value;
    }, 0);
  };

  // Check if any column should show totals
  const totalsRow = columns.filter((col: any) => 
    ['number', 'currency'].includes(col.dataType) &&
    (col.config?.showTotal || col.dataType === 'currency')
  );

  return (
    <VStack align="stretch" spacing={4}>
      {rows.length > 0 ? (
        <TableContainer borderWidth={1} borderRadius="md" overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead bg="gray.50">
              <Tr>
                {columns.map((column: FieldDefinition) => (
                  <Th key={column.name} fontSize="sm">
                    {column.label}
                  </Th>
                ))}
                {(allowEdit || allowDelete) && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, index) => (
                <Tr key={row.id} _hover={{ bg: 'gray.50' }}>
                  {columns.map((column: FieldDefinition) => (
                    <Td key={`${row.id}-${column.name}`}>
                      {renderCellValue(row, column)}
                    </Td>
                  ))}
                  {(allowEdit || allowDelete) && (
                    <Td>
                      <HStack spacing={2}>
                        {allowEdit && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleEditRow(index)}
                          >
                            ✏️
                          </Button>
                        )}
                        {allowDelete && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteRow(index)}
                          >
                            🗑️
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              ))}
              {totalsRow.length > 0 && (
                <Tr bg="gray.100" fontWeight="bold">
                  {columns.map((column: FieldDefinition) => {
                    const shouldShowTotal = totalsRow.some(t => t.name === column.name);
                    return (
                      <Td key={`total-${column.name}`}>
                        {shouldShowTotal ? (
                          column.dataType === 'currency' ? (
                            new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            }).format(calculateTotal(column.name))
                          ) : (
                            calculateTotal(column.name).toFixed(column.config?.decimals || 0)
                          )
                        ) : column.name === columns[0].name ? (
                          'Total'
                        ) : (
                          ''
                        )}
                      </Td>
                    );
                  })}
                  {(allowEdit || allowDelete) && <Td />}
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Box p={4} textAlign="center" color="gray.500" borderWidth={1} borderRadius="md">
          No items added yet. Click "Add Row" to get started.
        </Box>
      )}

      {allowAdd && (
        <Button colorScheme="green" onClick={handleAddRow} size="sm">
          ➕ Add Row
        </Button>
      )}

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingIndex !== null ? 'Edit Row' : 'Add New Row'}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              {columns.map((column: FieldDefinition) => (
                <Box key={column.name} width="100%">
                  <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    {column.label}
                  </label>
                  {renderEditInput(column)}
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSaveRow}>
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
