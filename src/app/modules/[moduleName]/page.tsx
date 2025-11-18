'use client';

import {
  Box,
  Button,
  Container,
  Heading,
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
  Spinner,
  useToast,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  useColorModeValue,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ModuleConfig, FieldDefinition } from '@/types/metadata';
import AppLayout from '@/components/layout/AppLayout';
import ModuleTilesView from '@/components/tables/ModuleTilesView';

interface ModuleRecord {
  id: string;
  data?: Record<string, any>; // Optional: nested structure (from API POST/PUT response)
  createdAt: string;
  updatedAt: string;
  status: string;
  [key: string]: any; // Allow dynamic fields (from GET response where data is spread)
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
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const moduleName = params.moduleName as string;
  const tenantId = session?.user?.tenantId;

  // State
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ModuleRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ModuleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState(0);

  // View mode state - default based on user role
  const userRole = session?.user?.role || 'staff';
  const defaultViewMode = (userRole === 'manager' || userRole === 'staff') ? 'tiles' : 'table';
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>(defaultViewMode);

  // Only need view detail modal now (create/edit use page view)
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

  // Apply filters whenever records or filters change
  useEffect(() => {
    if (!moduleConfig) return;
    
    let filtered = [...records];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => getStringValue(getFieldValue(r, 'status')) === statusFilter);
    }

    // Tab-based filtering (for Leads: New, Contacted, Qualified, etc.)
    if (moduleName === 'Leads') {
      if (activeTab === 1) filtered = filtered.filter((r) => getStringValue(getFieldValue(r, 'status')) === 'New');
      else if (activeTab === 2) filtered = filtered.filter((r) => getStringValue(getFieldValue(r, 'status')) === 'Contacted');
      else if (activeTab === 3) filtered = filtered.filter((r) => getStringValue(getFieldValue(r, 'status')) === 'Qualified');
      else if (activeTab === 4) filtered = filtered.filter((r) => ['Converted', 'Lost'].includes(getStringValue(getFieldValue(r, 'status'))));
    }

    // Search filter (searches across all text/email/phone fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        return moduleConfig.fields.some((field) => {
          if (['text', 'email', 'phone'].includes(field.dataType)) {
            const value = getFieldValue(r, field.name);
            const stringValue = getStringValue(value);
            return stringValue && stringValue.toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, statusFilter, activeTab, moduleConfig]);

  const loadModuleConfig = async () => {
    console.log('[CONFIG SYNC] Loading config for:', moduleName);
    console.log('[CONFIG SYNC] Tenant ID:', tenantId);
    
    try {
      const url = `/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`;
      console.log('[CONFIG SYNC] Fetching from:', url);
      
      const response = await fetch(url, {
        // Disable cache to ensure fresh data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      console.log('[CONFIG SYNC] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to load module configuration');
      }

      const config = await response.json();
      console.log('[CONFIG SYNC] Loaded config:', config);
      console.log('[CONFIG SYNC] Number of fields:', config.fields?.length || 0);
      console.log('[CONFIG SYNC] Field names:', config.fields?.map((f: any) => f.name).join(', '));
      
      setModuleConfig(config);
    } catch (error) {
      console.error('[CONFIG SYNC] Error loading module config:', error);
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
      setRecords(data.records || []);
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
    // Navigate to new record page instead of opening modal
    router.push(`/modules/${moduleName}/new`);
  };

  const handleEdit = (record: ModuleRecord) => {
    // Navigate to edit record page instead of opening modal
    router.push(`/modules/${moduleName}/edit/${record.id}`);
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

  // Unified conversion handler for tiles view
  const handleConversion = async (recordId: string, conversionType: string) => {
    switch (conversionType) {
      case 'lead-to-client':
        await handleConvertLeadToClient(recordId);
        break;
      case 'quotation-to-order':
        await handleConvertQuotationToOrder(recordId);
        break;
      case 'order-to-invoice':
        await handleConvertOrderToInvoice(recordId);
        break;
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

  const getDisplayValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined) return '-';

    // Handle object values (lookup/dropdown fields that return {label, value})
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.label) return value.label;
      if (value.value) return value.value;
      if (value.name) return value.name;
      return '-';
    }

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

  // Helper function to get field value from record (handles both flat and nested data structure)
  const getFieldValue = (record: ModuleRecord, fieldName: string) => {
    // Check if data is nested (for newly created records)
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      return record.data[fieldName];
    }
    // Otherwise, data is spread at root level (for fetched records)
    return (record as any)[fieldName];
  };

  // Helper to extract string value from potentially object values
  const getStringValue = (value: any): string => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value.label || value.value || value.name || '';
    }
    return value ? String(value) : '';
  };

  // Helper to get status badge color
  const getStatusColor = (status: any, moduleName: string) => {
    // Handle object values
    const statusStr = typeof status === 'object' ? (status?.label || status?.value || '') : (status || '');
    
    if (moduleName === 'Leads') {
      switch (statusStr) {
        case 'New': return 'blue';
        case 'Contacted': return 'cyan';
        case 'Qualified': return 'purple';
        case 'Converted': return 'green';
        case 'Lost': return 'red';
        default: return 'gray';
      }
    }
    // Add more module-specific colors as needed
    return statusStr === 'Converted' || statusStr === 'Paid' || statusStr === 'Completed' ? 'green' : 'blue';
  };

  // Helper to get priority color
  const getPriorityColor = (priority: any) => {
    // Handle object values
    const priorityStr = typeof priority === 'object' ? (priority?.label || priority?.value || '') : (priority || '');
    
    switch (priorityStr) {
      case 'Low': return 'gray';
      case 'Medium': return 'blue';
      case 'High': return 'orange';
      case 'Urgent': return 'red';
      default: return 'gray';
    }
  };

  if (loading || !moduleConfig) {
    return (
      <AppLayout>
        <Container maxW="full" centerContent py={10}>
          <Spinner size="xl" color="primary.500" />
        </Container>
      </AppLayout>
    );
  }

  // Calculate statistics
  const getStatistics = () => {
    const statusField = moduleConfig.fields.find((f) => f.name === 'status');
    const stats: Record<string, number> = { total: records.length };

    if (statusField && statusField.config?.options) {
      statusField.config.options.forEach((option: any) => {
        // Handle both string and object options from config
        const optionValue = typeof option === 'object' ? (option.value || option.label) : option;
        
        stats[optionValue] = records.filter((r) => {
          const statusValue = getFieldValue(r, 'status');
          // Handle both string and object values in records
          const statusStr = typeof statusValue === 'object' ? (statusValue?.label || statusValue?.value) : statusValue;
          return statusStr === optionValue;
        }).length;
      });
    }

    return stats;
  };

  const statistics = getStatistics();

  // Get primary display fields - smarter selection for table view
  const displayFields = moduleConfig.fields.filter((f) => {
    // Exclude notes/textarea and large fields from table
    if (f.dataType === 'textarea' || f.dataType === 'table') return false;
    // Include essential fields
    return ['text', 'email', 'lookup', 'phone', 'currency', 'date', 'dropdown'].includes(f.dataType);
  }).slice(0, moduleName === 'Leads' ? 5 : 4); // Show more columns for Leads

  // Show filtered records if any filters are active, otherwise show all records
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || activeTab !== 0;
  const displayRecords = hasActiveFilters ? filteredRecords : records;

  return (
    <AppLayout>
      <Container maxW="full" py={6} px={{ base: 4, md: 6 }}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" color="primary.700">
                {moduleConfig.icon} {moduleConfig.displayName}
              </Heading>
              <Text color="gray.600" fontSize="sm" mt={1}>
                {moduleConfig.description || `Manage ${moduleConfig.displayName}`}
              </Text>
            </Box>
            <HStack spacing={3}>
              {/* View Toggle */}
              <HStack spacing={0} bg="gray.100" borderRadius="md" p={1}>
                <Button
                  size="sm"
                  variant={viewMode === 'table' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'table' ? 'primary' : 'gray'}
                  onClick={() => setViewMode('table')}
                  leftIcon={<Text fontSize="sm">📋</Text>}
                >
                  Table
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'tiles' ? 'solid' : 'ghost'}
                  colorScheme={viewMode === 'tiles' ? 'primary' : 'gray'}
                  onClick={() => setViewMode('tiles')}
                  leftIcon={<Text fontSize="sm">🎴</Text>}
                >
                  Tiles
                </Button>
              </HStack>
              
              {/* Create New Button */}
              <Button
                colorScheme="primary"
                onClick={handleCreateNew}
                size="md"
                leftIcon={<Text>➕</Text>}
              >
                New {moduleConfig.displayName.replace(/s$/, '')}
              </Button>
            </HStack>
          </Flex>

          {/* Statistics Dashboard (for modules with status field) */}
          {moduleConfig.fields.some((f) => f.name === 'status' && f.config?.options) && (
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }} gap={4}>
            <GridItem>
              <Card bg="white" borderLeft="4px" borderColor="primary.500">
                <CardBody>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.600">Total</StatLabel>
                    <StatNumber fontSize="2xl" color="primary.700">{statistics.total}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            {moduleConfig.fields
              .find((f) => f.name === 'status')
              ?.config?.options?.slice(0, 5)
              ?.map((option: any) => {
                const optionValue = typeof option === 'object' ? (option.value || option.label) : option;
                const optionLabel = typeof option === 'object' ? (option.label || option.value) : option;
                return (
                  <GridItem key={optionValue}>
                    <Card bg="white" borderLeft="4px" borderColor={`${getStatusColor(optionValue, moduleName)}.500`}>
                      <CardBody>
                        <Stat>
                          <StatLabel fontSize="sm" color="gray.600">{optionLabel}</StatLabel>
                          <StatNumber fontSize="2xl" color={`${getStatusColor(optionValue, moduleName)}.600`}>
                            {statistics[optionValue] || 0}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                );
              })}
            </Grid>
          )}

          {/* Filters and Search */}
          <Card bg="white">
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <GridItem>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Text>🔍</Text>
                    </InputLeftElement>
                    <Input
                      placeholder={`Search ${moduleConfig.displayName.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </GridItem>
                {moduleConfig.fields.some((f) => f.name === 'status') && (
                  <GridItem>
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All Status</option>
                      {moduleConfig.fields
                        .find((f) => f.name === 'status')
                        ?.config?.options?.map((option: any) => {
                          const optionValue = typeof option === 'object' ? (option.value || option.label) : option;
                          const optionLabel = typeof option === 'object' ? (option.label || option.value) : option;
                          return (
                            <option key={optionValue} value={optionValue}>
                              {optionLabel}
                            </option>
                          );
                        })}
                    </Select>
                  </GridItem>
                )}
              </Grid>
            </CardBody>
          </Card>

          {/* Tabs for Pipeline (Leads module) */}
          {moduleName === 'Leads' && (
            <Tabs index={activeTab} onChange={setActiveTab} colorScheme="primary" variant="enclosed">
              <TabList>
                <Tab>All ({statistics.total})</Tab>
                <Tab>New ({statistics.New || 0})</Tab>
                <Tab>Contacted ({statistics.Contacted || 0})</Tab>
                <Tab>Qualified ({statistics.Qualified || 0})</Tab>
                <Tab>Closed ({(statistics.Converted || 0) + (statistics.Lost || 0)})</Tab>
              </TabList>
            </Tabs>
          )}

          {/* Records Display - Table or Tiles View */}
          {viewMode === 'tiles' ? (
            <ModuleTilesView
              records={displayRecords}
              moduleConfig={moduleConfig}
              moduleName={moduleName}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onConvert={handleConversion}
              isConverting={isConverting}
            />
          ) : displayRecords.length > 0 ? (
            <Card bg="white">
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple" size="md">
                    <Thead bg="gray.50">
                      <Tr>
                        {displayFields.map((field) => (
                          <Th key={field.name} color="gray.700">{field.label}</Th>
                        ))}
                        <Th color="gray.700">Created</Th>
                        <Th color="gray.700">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {displayRecords.map((record) => (
                        <Tr key={record.id} _hover={{ bg: 'gray.50' }}>
                          {displayFields.map((field) => {
                            const value = getFieldValue(record, field.name);
                            return (
                              <Td key={`${record.id}-${field.name}`}>
                                {field.name === 'status' ? (
                                  <Badge colorScheme={getStatusColor(value, moduleName)}>
                                    {getDisplayValue(field, value)}
                                  </Badge>
                                ) : field.name === 'priority' ? (
                                  <Badge colorScheme={getPriorityColor(value)}>
                                    {getDisplayValue(field, value)}
                                  </Badge>
                                ) : field.name === 'name' || field.name.toLowerCase().includes('name') ? (
                                  <Text fontWeight="medium" color="primary.700">
                                    {getDisplayValue(field, value)}
                                  </Text>
                                ) : field.dataType === 'currency' ? (
                                  <Text fontWeight="medium" color="accent.700">
                                    {getDisplayValue(field, value)}
                                  </Text>
                                ) : (
                                  <Text color="gray.600">{getDisplayValue(field, value)}</Text>
                                )}
                              </Td>
                            );
                          })}
                          <Td fontSize="sm" color="gray.500">
                            {new Date(record.createdAt).toLocaleDateString('en-IN')}
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="View"
                                icon={<Text>👁️</Text>}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleView(record)}
                              />
                              <IconButton
                                aria-label="Edit"
                                icon={<Text>✏️</Text>}
                                size="sm"
                                variant="ghost"
                                colorScheme="primary"
                                onClick={() => handleEdit(record)}
                              />
                              {moduleName === 'Leads' && getStringValue(getFieldValue(record, 'status')) !== 'Converted' && (
                                <IconButton
                                  aria-label="Convert to Client"
                                  icon={<Text>✓</Text>}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  isLoading={isConverting}
                                  title="Convert Lead to Client"
                                  onClick={() => handleConvertLeadToClient(record.id)}
                                />  
                              )}
                              {moduleName === 'Quotations' && getStringValue(getFieldValue(record, 'status')) !== 'Converted' && (
                                <IconButton
                                  aria-label="Convert to Order"
                                  icon={<Text>📋</Text>}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  isLoading={isConverting}
                                  title="Convert Quotation to Order"
                                  onClick={() => handleConvertQuotationToOrder(record.id)}
                                />  
                              )}
                              {moduleName === 'Orders' && getStringValue(getFieldValue(record, 'status')) !== 'Invoiced' && (
                                <IconButton
                                  aria-label="Convert to Invoice"
                                  icon={<Text>🧾</Text>}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  isLoading={isConverting}
                                  title="Convert Order to Invoice"
                                  onClick={() => handleConvertOrderToInvoice(record.id)}
                                />
                              )}
                              <IconButton
                                aria-label="Delete"
                                icon={<Text>🗑️</Text>}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(record.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          ) : (
            <Card bg="white">
              <CardBody textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">
                  {searchQuery || statusFilter !== 'All' ? 'No matching records found' : 'No records found'}
                </Text>
                <Text fontSize="sm" color="gray.400" mt={2}>
                  {searchQuery || statusFilter !== 'All'
                    ? 'Try adjusting your filters'
                    : `Create your first ${moduleConfig.displayName.toLowerCase()} to get started`}
                </Text>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>

      {/* View Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="primary.500" color="white">
            {moduleConfig.displayName} Details
          </ModalHeader>
          <ModalBody py={6}>
            {selectedRecord && (
              <VStack align="stretch" spacing={4}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {moduleConfig.fields.map((field) => {
                    const value = getFieldValue(selectedRecord, field.name);
                    if (!value && value !== 0) return null;
                    
                    return (
                      <GridItem key={field.name} colSpan={field.dataType === 'textarea' ? 2 : 1}>
                        <Box>
                          <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={1}>
                            {field.label}
                          </Text>
                          {field.name === 'status' ? (
                            <Badge colorScheme={getStatusColor(value, moduleName)} fontSize="sm">
                              {getDisplayValue(field, value)}
                            </Badge>
                          ) : field.name === 'priority' ? (
                            <Badge colorScheme={getPriorityColor(value)} fontSize="sm">
                              {getDisplayValue(field, value)}
                            </Badge>
                          ) : field.dataType === 'currency' ? (
                            <Text fontSize="md" fontWeight="medium" color="accent.700">
                              {getDisplayValue(field, value)}
                            </Text>
                          ) : (
                            <Text fontSize="md">{getDisplayValue(field, value)}</Text>
                          )}
                        </Box>
                      </GridItem>
                    );
                  })}
                </Grid>
                
                <Box pt={4} borderTop="1px" borderColor="gray.200">
                  <Text fontSize="xs" color="gray.500">
                    Created: {new Date(selectedRecord.createdAt).toLocaleString('en-IN')}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Last Updated: {new Date(selectedRecord.updatedAt).toLocaleString('en-IN')}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50">
            <HStack spacing={3}>
              <Button
                colorScheme="primary"
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
    </AppLayout>
  );
}
