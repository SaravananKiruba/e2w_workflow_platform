'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  VStack,
  Button,
  Select,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  IconButton,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Text,
  Divider,
} from '@chakra-ui/react';
import { DndContext, DragEndEvent, DragOverEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FiSave, FiEye, FiRotateCcw, FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FieldLibrary from '@/components/admin/FieldLibrary';
import FormCanvas from '@/components/admin/FormCanvas';
import FieldPropertyPanel from '@/components/admin/FieldPropertyPanel';
import FormPreview from '@/components/admin/FormPreview';

interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  dataType: string;
  uiType: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  defaultValue?: any;
  validation?: any[];
  options?: any[];
  lookupConfig?: any;
  tableConfig?: any;
}

interface ModuleInfo {
  moduleName: string;
  displayName: string;
  icon?: string;
  description?: string;
  version: number;
}

const AVAILABLE_MODULES = [
  { value: 'Leads', label: 'Leads' },
  { value: 'Clients', label: 'Clients' },
  { value: 'Quotations', label: 'Quotations' },
  { value: 'Orders', label: 'Orders' },
  { value: 'Invoices', label: 'Invoices' },
  { value: 'Payments', label: 'Payments' },
];

export default function FieldBuilderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Load module configuration when module is selected
  useEffect(() => {
    if (selectedModule) {
      loadModuleConfig(selectedModule);
    }
  }, [selectedModule]);

  // Track unsaved changes
  useEffect(() => {
    if (fields.length > 0 && moduleInfo) {
      setHasUnsavedChanges(true);
    }
  }, [fields]);

  async function loadModuleConfig(moduleName: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/fields?moduleName=${moduleName}`);
      if (response.ok) {
        const data = await response.json();
        setModuleInfo({
          moduleName: data.moduleName,
          displayName: moduleName,
          description: data.description,
          version: data.version,
        });
        
        // Convert fields to include IDs
        const fieldsWithIds = data.fields.map((field: any, index: number) => ({
          id: `${field.name}-${index}`,
          ...field,
        }));
        setFields(fieldsWithIds);
        setHasUnsavedChanges(false);
      } else {
        toast({
          title: 'Error loading module',
          description: 'Could not load module configuration',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error loading module config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load module configuration',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    // Handle dropping a field type from library onto canvas
    if (active.data.current?.type === 'fieldType') {
      const fieldType = active.data.current.fieldType;
      addNewField(fieldType);
      return;
    }

    // Handle reordering fields within canvas
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setFields(arrayMove(fields, oldIndex, newIndex));
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Could add visual feedback here
  }

  function addNewField(fieldType: any) {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      name: `${fieldType.name}_${Date.now()}`,
      label: `New ${fieldType.label}`,
      dataType: fieldType.name,
      uiType: fieldType.name === 'lookup' ? 'autocomplete' : 'input',
      placeholder: '',
      helpText: '',
      required: false,
      readOnly: false,
      hidden: false,
      validation: [],
      ...(fieldType.config?.defaultProps || {}),
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    
    toast({
      title: 'Field added',
      description: `${fieldType.label} field added to canvas`,
      status: 'success',
      duration: 2000,
    });
  }

  function handleFieldSelect(fieldId: string) {
    setSelectedFieldId(fieldId);
  }

  function handleFieldUpdate(updatedField: FieldDefinition) {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
    toast({
      title: 'Field updated',
      description: 'Field properties saved',
      status: 'success',
      duration: 2000,
    });
  }

  function handleFieldDelete(fieldId: string) {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(undefined);
    }
    toast({
      title: 'Field deleted',
      description: 'Field removed from canvas',
      status: 'info',
      duration: 2000,
    });
  }

  async function handleSave() {
    if (!selectedModule || !moduleInfo) {
      toast({
        title: 'No module selected',
        description: 'Please select a module first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Remove IDs before saving (they're only for UI)
      const fieldsToSave = fields.map(({ id, ...field }) => field);

      const response = await fetch('/api/admin/fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: selectedModule,
          fields: fieldsToSave,
          description: moduleInfo.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasUnsavedChanges(false);
        toast({
          title: 'Configuration saved',
          description: `${selectedModule} configuration updated to version ${data.version}`,
          status: 'success',
          duration: 4000,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save configuration',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    if (selectedModule) {
      loadModuleConfig(selectedModule);
      setSelectedFieldId(undefined);
      toast({
        title: 'Changes reset',
        description: 'Configuration restored to last saved version',
        status: 'info',
        duration: 3000,
      });
    }
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (!session || session.user.role !== 'admin') {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={12}>
          <Heading size="lg" mb={4}>
            Access Denied
          </Heading>
          <Text color="gray.600" mb={6}>
            You need administrator privileges to access the Field Builder.
          </Text>
          <Button colorScheme="blue" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="container.2xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Breadcrumb spacing={2} separator={<FiChevronRight />} mb={4}>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => router.push('/dashboard')}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>Field Builder</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <HStack justify="space-between" mb={4}>
              <Box>
                <Heading size="lg" mb={2}>
                  Visual Field Builder
                </Heading>
                <Text color="gray.600">
                  Drag and drop to create and configure form fields
                </Text>
              </Box>

              <HStack spacing={3}>
                {hasUnsavedChanges && (
                  <Tooltip label="Reset to last saved version">
                    <IconButton
                      aria-label="Reset changes"
                      icon={<FiRotateCcw />}
                      variant="outline"
                      onClick={handleReset}
                      isDisabled={!selectedModule}
                    />
                  </Tooltip>
                )}
                <Tooltip label="Preview form">
                  <IconButton
                    aria-label="Preview"
                    icon={<FiEye />}
                    variant="outline"
                    colorScheme="blue"
                    onClick={onOpen}
                    isDisabled={fields.length === 0}
                  />
                </Tooltip>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={isSaving}
                  isDisabled={!selectedModule || !hasUnsavedChanges}
                >
                  Save Configuration
                </Button>
              </HStack>
            </HStack>

            {/* Module Selector */}
            <FormControl maxW="400px">
              <FormLabel>Select Module to Configure</FormLabel>
              <Select
                placeholder="Choose a module..."
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                {AVAILABLE_MODULES.map((module) => (
                  <option key={module.value} value={module.value}>
                    {module.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedModule && (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <Grid templateColumns="250px 1fr 350px" gap={6} h="calc(100vh - 300px)">
                {/* Field Library */}
                <GridItem>
                  <FieldLibrary />
                </GridItem>

                {/* Form Canvas */}
                <GridItem>
                  <FormCanvas
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onFieldSelect={handleFieldSelect}
                    onFieldDelete={handleFieldDelete}
                  />
                </GridItem>

                {/* Field Property Panel */}
                <GridItem>
                  <FieldPropertyPanel
                    field={selectedField || null}
                    onFieldUpdate={handleFieldUpdate}
                    onClose={() => setSelectedFieldId(undefined)}
                    availableFields={fields.map(f => f.name)}
                  />
                </GridItem>
              </Grid>
            </DndContext>
          )}

          {!selectedModule && (
            <Box textAlign="center" py={20}>
              <Text fontSize="lg" color="gray.500">
                Select a module above to start building
              </Text>
            </Box>
          )}
        </VStack>
      </Container>

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>Form Preview - {selectedModule}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormPreview fields={fields} moduleName={selectedModule} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
