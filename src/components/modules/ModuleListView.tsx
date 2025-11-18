/**
 * ModuleListView Component
 * 
 * Reusable list view for any module with:
 * - Dynamic table rendering
 * - Search and filtering
 * - Sort support
 * - Actions (view, edit, delete)
 * - Tiles/Table view toggle
 * 
 * This component eliminates the need for separate list.tsx files per module
 */

'use client';

import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Text,
  VStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Flex,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiGrid, FiList, FiMoreVertical } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { ModuleConfig } from '@/types/metadata';
import { SimpleTableView } from '@/components/tables/SimpleTableView';
import ModuleTilesView from '@/components/tables/ModuleTilesView';

interface ModuleRecord {
  id: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
  [key: string]: any;
}

interface ModuleListViewProps {
  moduleName: string;
  moduleConfig: ModuleConfig;
  tenantId: string;
  onCreateNew: () => void;
  onEdit: (recordId: string) => void;
  onView: (record: ModuleRecord) => void;
  defaultViewMode?: 'table' | 'tiles';
}

export default function ModuleListView({
  moduleName,
  moduleConfig,
  tenantId,
  onCreateNew,
  onEdit,
  onView,
  defaultViewMode = 'table',
}: ModuleListViewProps) {
  const toast = useToast();
  
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'tiles'>(defaultViewMode);
  const [activeTab, setActiveTab] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [moduleSettings, setModuleSettings] = useState<any>(null);

  // Load module settings
  useEffect(() => {
    if (!tenantId || !moduleName) return;
    loadModuleSettings();
  }, [moduleName, tenantId]);

  // Load records
  useEffect(() => {
    if (!tenantId) return;
    loadRecords();
  }, [moduleName, tenantId]);

  const loadModuleSettings = async () => {
    try {
      const response = await fetch(
        `/api/tenant-admin/module-settings?tenantId=${tenantId}&moduleName=${moduleName}`
      );
      if (response.ok) {
        const data = await response.json();
        setModuleSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading module settings:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    if (!moduleConfig) return;
    applyFilters();
  }, [records, searchQuery, statusFilter, activeTab, moduleConfig]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/modules/${moduleName}/records?tenantId=${tenantId}`,
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error('Failed to load records');

      const data = await response.json();
      const recordList = Array.isArray(data) ? data : data.records || [];
      setRecords(recordList);
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load records',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!records || !Array.isArray(records)) {
      setFilteredRecords([]);
      return;
    }
    
    let filtered = [...records];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => getFieldValue(r, 'status') === statusFilter);
    }

    // Tab-based filtering (for Leads - use dynamic status from config)
    if (moduleName === 'Leads') {
      // Get status field configuration to find available statuses
      const statusField = moduleConfig.fields.find(f => f.name === 'status');
      const statusOptions = statusField?.config?.options || [];
      
      // Build dynamic status map from field config
      const statusMap = ['All', ...statusOptions.map((opt: any) => opt.label || opt.value)];
      const tabStatus = statusMap[activeTab];
      
      if (tabStatus && tabStatus !== 'All') {
        filtered = filtered.filter(r => getFieldValue(r, 'status') === tabStatus);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        moduleConfig.fields.some(field => {
          if (['text', 'email', 'phone'].includes(field.dataType)) {
            const value = getFieldValue(r, field.name);
            return value && String(value).toLowerCase().includes(query);
          }
          return false;
        })
      );
    }

    setFilteredRecords(filtered);
  };

  const getFieldValue = (record: ModuleRecord, fieldName: string): any => {
    if (record.data && record.data[fieldName] !== undefined) {
      return record.data[fieldName];
    }
    return record[fieldName];
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(
        `/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete record');

      toast({
        title: 'Success',
        description: 'Record deleted successfully',
        status: 'success',
        duration: 3000,
      });

      loadRecords();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleConvert = async (recordId: string, conversionType: string) => {
    const confirmMessages: Record<string, string> = {
      'lead-to-client': 'Convert this Lead to a Client?',
      'quotation-to-order': 'Convert this Quotation to an Order?',
      'order-to-invoice': 'Convert this Order to an Invoice?',
    };

    if (!confirm(confirmMessages[conversionType] || 'Convert this record?')) return;

    try {
      setIsConverting(true);
      const response = await fetch(`/api/conversions/${conversionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          conversionType === 'lead-to-client'
            ? { leadId: recordId }
            : conversionType === 'quotation-to-order'
            ? { quotationId: recordId }
            : { orderId: recordId }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description:
          conversionType === 'lead-to-client'
            ? 'Lead converted to Client successfully'
            : conversionType === 'quotation-to-order'
            ? 'Quotation converted to Order successfully'
            : 'Order converted to Invoice successfully',
        status: 'success',
        duration: 4000,
      });

      // Reload records to reflect updated status
      loadRecords();
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'Failed to convert record',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="primary.500" />
      </Flex>
    );
  }

  // Get dynamic status options for Leads module
  const getLeadStatusTabs = () => {
    if (moduleName !== 'Leads') return null;
    
    const statusField = moduleConfig.fields.find(f => f.name === 'status');
    const statusOptions = statusField?.config?.options || [];
    
    return statusOptions.map((opt: any) => opt.label || opt.value);
  };

  const leadStatusTabs = getLeadStatusTabs();

  return (
    <VStack align="stretch" spacing={4}>
      {/* Tabs for Leads module - Dynamic from config */}
      {moduleName === 'Leads' && leadStatusTabs && leadStatusTabs.length > 0 && (
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="primary">
          <TabList>
            <Tab>All ({records.length})</Tab>
            {leadStatusTabs.map((status: string) => (
              <Tab key={status}>{status}</Tab>
            ))}
          </TabList>
        </Tabs>
      )}

      {/* Header with search and filters */}
      <HStack justify="space-between" wrap="wrap" spacing={4}>
        <HStack flex="1" minW="300px">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {moduleName === 'Leads' && leadStatusTabs && leadStatusTabs.map((status: string) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
        </HStack>

        <HStack>
          {/* View mode toggle */}
          <HStack spacing={0} borderRadius="md" overflow="hidden" border="1px" borderColor="gray.200">
            <IconButton
              aria-label="Table view"
              icon={<FiList />}
              size="sm"
              variant={viewMode === 'table' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'table' ? 'primary' : 'gray'}
              onClick={() => setViewMode('table')}
              borderRadius={0}
            />
            <IconButton
              aria-label="Tiles view"
              icon={<FiGrid />}
              size="sm"
              variant={viewMode === 'tiles' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'tiles' ? 'primary' : 'gray'}
              onClick={() => setViewMode('tiles')}
              borderRadius={0}
            />
          </HStack>

          <Button
            leftIcon={<FiPlus />}
            colorScheme="primary"
            onClick={onCreateNew}
          >
            Create New
          </Button>
        </HStack>
      </HStack>

      {/* Results count */}
      <Text fontSize="sm" color="gray.600">
        Showing {filteredRecords.length} of {records.length} records
      </Text>

      {/* Table or Tiles View */}
      {viewMode === 'table' ? (
        <SimpleTableView
          config={moduleConfig}
          records={filteredRecords}
          onView={onView}
          onEdit={onEdit}
          onDelete={handleDelete}
          moduleSettings={moduleSettings}
          moduleName={moduleName}
        />
      ) : (
        <ModuleTilesView
          records={filteredRecords}
          moduleConfig={moduleConfig}
          moduleName={moduleName}
          onView={onView}
          onEdit={(record) => onEdit(record.id)}
          onDelete={handleDelete}
          onConvert={handleConvert}
          isConverting={isConverting}
        />
      )}
    </VStack>
  );
}
