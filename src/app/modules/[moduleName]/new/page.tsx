'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Spinner, useToast, Center, Text, VStack } from '@chakra-ui/react';
import AppLayout from '@/components/layout/AppLayout';
import ModuleFormPage from '@/components/forms/ModuleFormPage';
import { ModuleConfig } from '@/types/metadata';

export default function NewRecordPage() {
  const params = useParams();
  const { data: session } = useSession();
  const toast = useToast();

  const moduleName = params.moduleName as string;
  const tenantId = session?.user?.tenantId;

  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleName || !tenantId) return;
    loadModuleConfig();
  }, [moduleName, tenantId]);

  const loadModuleConfig = async () => {
    console.log('[NEW PAGE] Loading config for:', moduleName);
    console.log('[NEW PAGE] Tenant ID:', tenantId);
    
    try {
      const url = `/api/modules?tenantId=${tenantId}&moduleName=${moduleName}`;
      console.log('[NEW PAGE] Fetching from:', url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      console.log('[NEW PAGE] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to load module configuration');
      }

      const config = await response.json();
      console.log('[NEW PAGE] Loaded config:', config);
      console.log('[NEW PAGE] Number of fields:', config.fields?.length || 0);
      
      setModuleConfig(config);
    } catch (error) {
      console.error('[NEW PAGE] Error loading module config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module configuration',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !moduleConfig) {
    return (
      <AppLayout>
        <Container maxW="full" centerContent py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="primary.500" />
            <Text color="gray.600">Loading form...</Text>
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

  return (
    <AppLayout>
      <ModuleFormPage
        moduleConfig={moduleConfig}
        moduleName={moduleName}
        tenantId={tenantId}
      />
    </AppLayout>
  );
}
