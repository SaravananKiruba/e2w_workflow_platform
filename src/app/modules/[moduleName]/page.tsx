'use client';

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
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
  Spinner,
  useToast,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { ModuleConfig, FieldDefinition } from '@/types/metadata';

interface ModuleRecord {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
}

/**
 * Generic Module CRUD Page
 * 
 * This is a single, reusable page component that works for ANY module:
 * - Leads, Clients, Quotations, Orders, Invoices, Payments
 * - List records in a sortable, filterable table
 * - Create new records with dynamic form
 * - Edit existing records
 * - View record details
 * - Delete records
 * 
 * URL: /app/modules/[moduleName]
 * Examples:
 *  - /app/modules/Leads
 *  - /app/modules/Clients
 *  - /app/modules/Quotations
 *  - /app/modules/Orders
 *  - /app/modules/Invoices
 *  - /app/modules/Payments
 */
export default function ModulePage() {
  const params = useParams();
  const { data: session } = useSession();
  const toast = useToast();

  const moduleName = params.moduleName as string;
  const tenantId = session?.user?.tenantId;

  // State
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ModuleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  // Load module configuration
  useEffect(() => {
    if (!moduleName || !tenantId) return;
    loadModuleConfig();
    loadRecords();
  }, [moduleName, tenantId]);

  const loadModuleConfig = async () => {
    try {
      const response = await fetch(
        `/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`
      );

      if (!response.ok) {
        throw new Error('Failed to load module configuration');
      }

      const config = await response.json();
      setModuleConfig(config);
    } catch (error) {
      console.error('Error loading module config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module configuration',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/modules/${moduleName}/records?tenantId=${tenantId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load records');
      }

      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load records',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    onOpen();
  };

  const handleEdit = (record: ModuleRecord) => {
    setSelectedRecord(record);
    onOpen();
  };

  const handleView = (record: ModuleRecord) => {
    setSelectedRecord(record);
    onDetailOpen();
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(
        `/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      toast({
        title: 'Success',
        description: 'Record deleted successfully',
        status: 'success',
        isClosable: true,
      });

      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const handleConvertLeadToClient = async (recordId: string) => {
    try {
      setIsConverting(true);

      const response = await fetch('/api/conversions/lead-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: recordId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Lead converted to Client: ${result.clientRecord.clientName}`,
        status: 'success',
        isClosable: true,
      });

      loadRecords();
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Conversion failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertQuotationToOrder = async (recordId: string) => {
    try {
      setIsConverting(true);

      const response = await fetch('/api/conversions/quotation-to-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId: recordId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Quotation converted to Order successfully!`,
        status: 'success',
        isClosable: true,
      });

      loadRecords();
    } catch (error) {
      console.error('Error converting quotation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Conversion failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertOrderToInvoice = async (recordId: string) => {
    try {
      setIsConverting(true);

      const response = await fetch('/api/conversions/order-to-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: recordId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Order converted to Invoice successfully!`,
        status: 'success',
        isClosable: true,
      });

      loadRecords();
    } catch (error) {
      console.error('Error converting order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Conversion failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (!moduleConfig) return;

    try {
      setIsSubmitting(true);

      const url = selectedRecord
        ? `/api/modules/${moduleName}/records/${selectedRecord.id}?tenantId=${tenantId}`
        : `/api/modules/${moduleName}/records?tenantId=${tenantId}`;

      const method = selectedRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save record');
      }

      toast({
        title: 'Success',
        description: `Record ${selectedRecord ? 'updated' : 'created'} successfully`,
        status: 'success',
        isClosable: true,
      });

      onClose();
      loadRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save record',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined) return '-';

    switch (field.dataType) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(value);
      case 'date':
      case 'datetime':
        return new Date(value).toLocaleDateString('en-IN');
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'table':
        return `${Array.isArray(value) ? value.length : 0} items`;
      default:
        return String(value).substring(0, 50);
    }
  };

  if (loading || !moduleConfig) {
    return (
      <Container maxW="full" centerContent py={10}>
        <Spinner />
      </Container>
    );
  }

  // Get primary display fields (first 3-4 text/lookup fields for table view)
  const displayFields = moduleConfig.fields.filter(
    (f) =>
      ['text', 'email', 'lookup', 'phone', 'currency', 'date'].includes(
        f.dataType
      )
  ).slice(0, 4);

  return (
    <Container maxW="full" py={6}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">{moduleConfig.displayName}</Heading>
            <Text color="gray.600" fontSize="sm">
              {moduleConfig.description || `Manage ${moduleConfig.displayName}`}
            </Text>
          </VStack>
          <Button colorScheme="blue" onClick={handleCreateNew}>
            ➕ New {moduleConfig.displayName}
          </Button>
        </HStack>

        {/* Records Table */}
        {records.length > 0 ? (
          <TableContainer borderWidth={1} borderRadius="md">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  {displayFields.map((field) => (
                    <Th key={field.name}>{field.label}</Th>
                  ))}
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.map((record) => (
                  <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
                    {displayFields.map((field) => (
                      <Td key={`${record.id}-${field.name}`}>
                        {getDisplayValue(field, record.data[field.name])}
                      </Td>
                    ))}
                    <Td fontSize="sm">
                      {new Date(record.createdAt).toLocaleDateString('en-IN')}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleView(record)}
                        >
                          👁️
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleEdit(record)}
                        >
                          ✏️
                        </Button>
                        {moduleName === 'Leads' && record.data.status !== 'Converted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            isLoading={isConverting}
                            title="Convert Lead to Client"
                            onClick={() => handleConvertLeadToClient(record.id)}
                          >
                            ↩️
                          </Button>
                        )}
                        {moduleName === 'Quotations' && record.data.status !== 'Converted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            isLoading={isConverting}
                            title="Convert Quotation to Order"
                            onClick={() => handleConvertQuotationToOrder(record.id)}
                          >
                            📋
                          </Button>
                        )}
                        {moduleName === 'Orders' && record.data.status !== 'Invoiced' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            isLoading={isConverting}
                            title="Convert Order to Invoice"
                            onClick={() => handleConvertOrderToInvoice(record.id)}
                          >
                            🧾
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(record.id)}
                        >
                          🗑️
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            p={8}
            textAlign="center"
            borderWidth={1}
            borderRadius="md"
            color="gray.500"
          >
            <Text>No records found. Create your first {moduleConfig.displayName.toLowerCase()}!</Text>
          </Box>
        )}

        {/* Stats */}
        <HStack spacing={4} fontSize="sm" color="gray.600">
          <Text>Total Records: <strong>{records.length}</strong></Text>
          <Text>Last Updated: <strong>{records.length > 0 ? new Date(records[0].updatedAt).toLocaleString('en-IN') : 'N/A'}</strong></Text>
        </HStack>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedRecord ? `Edit ${moduleConfig.displayName}` : `New ${moduleConfig.displayName}`}
          </ModalHeader>
          <ModalBody>
            <DynamicForm
              config={moduleConfig}
              initialData={selectedRecord?.data || {}}
              onSubmit={handleFormSubmit}
            />
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                isLoading={isSubmitting}
                onClick={() => {
                  // Trigger form submission via ref
                  const formSubmitBtn = document.querySelector(
                    'form button[type="submit"]'
                  ) as HTMLButtonElement;
                  formSubmitBtn?.click();
                }}
              >
                {selectedRecord ? 'Update' : 'Create'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{moduleConfig.displayName} Details</ModalHeader>
          <ModalBody>
            {selectedRecord && (
              <VStack align="stretch" spacing={4}>
                {moduleConfig.fields.map((field) => {
                  const value = selectedRecord.data[field.name];
                  return (
                    <Box key={field.name}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.600">
                        {field.label}
                      </Text>
                      <Text fontSize="md">
                        {getDisplayValue(field, value)}
                      </Text>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                colorScheme="blue"
                onClick={() => {
                  handleEdit(selectedRecord!);
                  onDetailClose();
                }}
              >
                Edit
              </Button>
              <Button variant="ghost" onClick={onDetailClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
