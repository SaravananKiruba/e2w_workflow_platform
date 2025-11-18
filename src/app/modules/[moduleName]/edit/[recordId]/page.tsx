'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Spinner, useToast, Center, Text, VStack } from '@chakra-ui/react';
import AppLayout from '@/components/layout/AppLayout';
import ModuleFormPage from '@/components/forms/ModuleFormPage';
import { ModuleConfig } from '@/types/metadata';

interface ModuleRecord {
  id: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
  [key: string]: any;
}

export default function EditRecordPage() {
  const params = useParams();
  const { data: session } = useSession();
  const toast = useToast();

  const moduleName = params.moduleName as string;
  const recordId = params.recordId as string;
  const tenantId = session?.user?.tenantId;

  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [recordData, setRecordData] = useState<ModuleRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleName || !tenantId || !recordId) return;
    loadData();
  }, [moduleName, tenantId, recordId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load module config and record data in parallel
      const [configResponse, recordResponse] = await Promise.all([
        fetch(`/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }),
        fetch(`/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }),
      ]);

      if (!configResponse.ok) {
        throw new Error('Failed to load module configuration');
      }

      if (!recordResponse.ok) {
        throw new Error('Failed to load record');
      }

      const config = await configResponse.json();
      const record = await recordResponse.json();

      console.log('[EDIT PAGE] Loaded config:', config);
      console.log('[EDIT PAGE] Loaded record:', record);

      setModuleConfig(config);
      setRecordData(record);
    } catch (error) {
      console.error('[EDIT PAGE] Error loading data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load data',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !moduleConfig || !recordData) {
    return (
      <AppLayout>
        <Container maxW="full" centerContent py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="primary.500" />
            <Text color="gray.600">Loading record...</Text>
          </VStack>
        </Container>
      </AppLayout>
    );
  }

  if (!tenantId) {
    return (
      <AppLayout>
        <Container maxW="full" centerContent py={10}>
          <Text color="red.500">Unauthorized: No tenant ID found</Text>
        </Container>
      </AppLayout>
    );
  }

  // Prepare initial data - handle both flat and nested structures
  const initialData = recordData.data && typeof recordData.data === 'object' && !Array.isArray(recordData.data)
    ? recordData.data
    : recordData;

  return (
    <AppLayout>
      <ModuleFormPage
        moduleConfig={moduleConfig}
        moduleName={moduleName}
        tenantId={tenantId}
        isEdit={true}
        recordId={recordId}
        initialData={initialData}
      />
    </AppLayout>
  );
}
