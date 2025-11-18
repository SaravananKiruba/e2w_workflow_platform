/**
 * Unified Module Page
 * 
 * Single page for all module operations using mode-based routing:
 * - ?mode=list (default) - List view with table/tiles
 * - ?mode=new - Create new record
 * - ?mode=edit&id=xxx - Edit existing record
 * 
 * EPIC 2.1: Simplify Module Pages
 * 
 * This replaces the need for:
 * - page.tsx (list)
 * - new/page.tsx (create)
 * - edit/[recordId]/page.tsx (edit)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Spinner,
  useToast,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';
import ModuleListView from '@/components/modules/ModuleListView';
import ModuleFormView from '@/components/modules/ModuleFormView';
import ModuleAnalyticsSidebar from '@/components/analytics/ModuleAnalyticsSidebar';
import { ModuleConfig } from '@/types/metadata';

type ViewMode = 'list' | 'new' | 'edit';

export default function UnifiedModulePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const toast = useToast();

  const moduleName = params.moduleName as string;
  const tenantId = session?.user?.tenantId;

  // Get mode from URL
  const mode = (searchParams.get('mode') || 'list') as ViewMode;
  const recordId = searchParams.get('id');

  // State
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  
  // Modal for record details
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Load module configuration
  useEffect(() => {
    if (!moduleName || !tenantId) return;
    loadModuleConfig();
  }, [moduleName, tenantId]);

  // Load record data for edit mode
  useEffect(() => {
    if (mode === 'edit' && recordId && tenantId) {
      loadRecordData();
    }
  }, [mode, recordId, tenantId]);

  const loadModuleConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`,
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error('Failed to load module configuration');

      const config = await response.json();
      setModuleConfig(config);
    } catch (error) {
      console.error('Error loading module config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module configuration',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecordData = async () => {
    try {
      const response = await fetch(
        `/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`
      );

      if (!response.ok) throw new Error('Failed to load record');

      const result = await response.json();
      // API returns { record } wrapper
      const record = result.record || result;
      console.log('[UnifiedModulePage] Loaded record data:', record);
      setEditData(record);
    } catch (error) {
      console.error('Error loading record:', error);
      toast({
        title: 'Error',
        description: 'Failed to load record',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleModeChange = (newMode: ViewMode, id?: string) => {
    const params = new URLSearchParams();
    params.set('mode', newMode);
    if (id) params.set('id', id);
    router.push(`/modules/${moduleName}?${params.toString()}`);
  };

  const handleCreateNew = () => {
    handleModeChange('new');
  };

  const handleEdit = (id: string) => {
    handleModeChange('edit', id);
  };

  const handleView = (record: any) => {
    setSelectedRecord(record);
    onOpen();
  };

  const handleSuccess = () => {
    handleModeChange('list');
    toast({
      title: 'Success',
      description: `Record ${mode === 'edit' ? 'updated' : 'created'} successfully`,
      status: 'success',
      duration: 3000,
    });
  };

  const handleCancel = () => {
    handleModeChange('list');
  };

  if (loading || !moduleConfig) {
    return (
      <AppLayout>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="primary.500" />
        </Flex>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxW="container.2xl" py={6}>
        <Grid
          templateColumns={{ base: '1fr', lg: mode === 'list' ? '1fr 320px' : '1fr' }}
          gap={6}
        >
          {/* Main Content */}
          <GridItem>
            <Box>
              {/* Header */}
              <Box mb={6}>
                {mode !== 'list' && (
                  <Button
                    leftIcon={<FiArrowLeft />}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModeChange('list')}
                    mb={4}
                  >
                    Back to List
                  </Button>
                )}
                <Heading size="lg" color="primary.700" mb={2}>
                  {moduleConfig.displayName}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {mode === 'list' && `Manage all ${moduleConfig.displayName.toLowerCase()}`}
                  {mode === 'new' && `Create a new ${moduleConfig.displayName.toLowerCase().replace(/s$/, '')}`}
                  {mode === 'edit' && `Edit ${moduleConfig.displayName.toLowerCase().replace(/s$/, '')}`}
                </Text>
              </Box>

              {/* Content based on mode */}
              {mode === 'list' && tenantId && (
                <ModuleListView
                  moduleName={moduleName}
                  moduleConfig={moduleConfig}
                  tenantId={tenantId}
                  onCreateNew={handleCreateNew}
                  onEdit={handleEdit}
                  onView={handleView}
                  defaultViewMode={
                    session?.user?.role === 'manager' || session?.user?.role === 'staff'
                      ? 'tiles'
                      : 'table'
                  }
                />
              )}

              {mode === 'new' && tenantId && (
                <ModuleFormView
                  moduleName={moduleName}
                  moduleConfig={moduleConfig}
                  tenantId={tenantId}
                  mode="new"
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              )}

              {mode === 'edit' && tenantId && recordId && editData && (
                <ModuleFormView
                  moduleName={moduleName}
                  moduleConfig={moduleConfig}
                  tenantId={tenantId}
                  mode="edit"
                  recordId={recordId}
                  initialData={editData}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              )}

              {mode === 'edit' && !editData && (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="lg" color="primary.500" />
                </Flex>
              )}
            </Box>
          </GridItem>

          {/* Analytics Sidebar (only in list mode) */}
          {mode === 'list' && tenantId && (
            <GridItem display={{ base: 'none', lg: 'block' }}>
              <Box position="sticky" top="20px">
                <ModuleAnalyticsSidebar
                  moduleName={moduleName}
                  tenantId={tenantId}
                />
              </Box>
            </GridItem>
          )}
        </Grid>
      </Container>

      {/* View Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{moduleConfig.displayName} Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRecord && (
              <Box>
                {moduleConfig.fields.map((field) => {
                  const value = selectedRecord.data?.[field.name] ?? selectedRecord[field.name];
                  if (!value) return null;
                  return (
                    <Box key={field.name} mb={3}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                        {field.label}
                      </Text>
                      <Text fontSize="sm">{String(value)}</Text>
                    </Box>
                  );
                })}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
}
