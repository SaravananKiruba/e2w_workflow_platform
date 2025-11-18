/**
 * ModuleFormView Component
 * 
 * Reusable form view for creating/editing records in any module.
 * Wraps DynamicForm with standard layout and actions.
 * 
 * This component eliminates the need for separate new.tsx and edit.tsx files
 */

'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Text,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { DynamicForm, DynamicFormRef } from '@/components/forms/DynamicForm';
import { ModuleConfig } from '@/types/metadata';
import { useInvalidateLookups } from '@/lib/hooks/use-lookup-query';

interface ModuleFormViewProps {
  moduleName: string;
  moduleConfig: ModuleConfig;
  tenantId: string;
  mode: 'new' | 'edit';
  recordId?: string;
  initialData?: Record<string, any>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ModuleFormView({
  moduleName,
  moduleConfig,
  tenantId,
  mode,
  recordId,
  initialData,
  onSuccess,
  onCancel,
}: ModuleFormViewProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<DynamicFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const invalidateLookups = useInvalidateLookups();

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);

      const url =
        mode === 'edit' && recordId
          ? `/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`
          : `/api/modules/${moduleName}/records?tenantId=${tenantId}`;

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save record');
      }

      // ✅ EPIC 1.1: Auto-refresh dropdowns
      invalidateLookups(moduleName, tenantId);
      
      // Invalidate related modules to ensure consistency
      const relatedModules: Record<string, string[]> = {
        'Clients': ['Quotations', 'Orders', 'Invoices', 'Payments'],
        'Products': ['Quotations', 'Orders', 'Invoices', 'PurchaseOrders', 'PurchaseRequisitions'],
        'Vendors': ['PurchaseOrders', 'PurchaseRequisitions', 'Payments'],
        'Leads': ['Clients'],
      };
      
      if (relatedModules[moduleName]) {
        relatedModules[moduleName].forEach(relatedModule => {
          invalidateLookups(relatedModule, tenantId);
        });
      }
      
      // Handle special cases (e.g., Lead -> Client conversion)
      if (moduleName === 'Leads' && data.status === 'Converted') {
        invalidateLookups('Clients', tenantId);
      }

      toast({
        title: 'Success',
        description: `Record ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/modules/${moduleName}`);
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save record',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <VStack align="stretch" spacing={6}>
      {/* Breadcrumb */}
      <Breadcrumb fontSize="sm" color="gray.600">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/modules/${moduleName}`}>
            {moduleConfig.displayName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>
            {mode === 'edit' ? 'Edit' : 'Create New'}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <Box>
        <Heading size="lg" color="primary.700">
          {mode === 'edit'
            ? `Edit ${moduleConfig.displayName}`
            : `Create New ${moduleConfig.displayName.replace(/s$/, '')}`}
        </Heading>
        <Text color="gray.600" fontSize="sm" mt={2}>
          {mode === 'edit'
            ? `Update the details for this ${moduleConfig.displayName.toLowerCase().replace(/s$/, '')}`
            : `Fill in the details to create a new ${moduleConfig.displayName.toLowerCase().replace(/s$/, '')}`}
        </Text>
      </Box>

      {/* Form Card */}
      <Card bg="white" shadow="md">
        <CardBody p={8}>
          <DynamicForm
            ref={formRef}
            config={moduleConfig}
            initialData={initialData || {}}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={4}>
        <Button
          variant="outline"
          onClick={handleCancel}
          size="lg"
          isDisabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          colorScheme="primary"
          onClick={() => formRef.current?.submit()}
          size="lg"
          isLoading={isSubmitting}
        >
          {mode === 'edit' ? 'Update' : 'Create'} {moduleConfig.displayName.replace(/s$/, '')}
        </Button>
      </HStack>
    </VStack>
  );
}
