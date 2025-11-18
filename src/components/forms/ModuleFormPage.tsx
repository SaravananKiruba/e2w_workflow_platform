'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { DynamicForm, DynamicFormRef } from './DynamicForm';
import { ModuleConfig } from '@/types/metadata';

interface ModuleFormPageProps {
  moduleConfig: ModuleConfig;
  moduleName: string;
  initialData?: Record<string, any>;
  isEdit?: boolean;
  recordId?: string;
  tenantId: string;
  onSuccess?: () => void;
}

export default function ModuleFormPage({
  moduleConfig,
  moduleName,
  initialData,
  isEdit = false,
  recordId,
  tenantId,
  onSuccess,
}: ModuleFormPageProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<DynamicFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);

      const url = isEdit && recordId
        ? `/api/modules/${moduleName}/records/${recordId}?tenantId=${tenantId}`
        : `/api/modules/${moduleName}/records?tenantId=${tenantId}`;

      const method = isEdit ? 'PUT' : 'POST';

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
        description: `Record ${isEdit ? 'updated' : 'created'} successfully`,
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
    router.back();
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack align="stretch" spacing={6}>
        {/* Breadcrumb Navigation */}
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
              {isEdit ? 'Edit' : 'Create New'}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Header */}
        <Box>
          <Heading size="lg" color="primary.700">
            {isEdit ? `Edit ${moduleConfig.displayName}` : `Create New ${moduleConfig.displayName.replace(/s$/, '')}`}
          </Heading>
          <Text color="gray.600" fontSize="sm" mt={2}>
            {isEdit
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
              onSubmit={handleFormSubmit}
            />
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <HStack justify="flex-end" spacing={4} pt={4} pb={8}>
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
            isLoading={isSubmitting}
            loadingText={isEdit ? 'Updating...' : 'Creating...'}
            size="lg"
            px={10}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
