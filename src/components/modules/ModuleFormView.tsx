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
  CardHeader,
  Heading,
  HStack,
  Text,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Grid,
  GridItem,
  Badge,
  IconButton,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  Divider,
  List,
  ListItem,
  Flex,
} from '@chakra-ui/react';
import { FiPhone, FiPlus, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
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
  const [moduleSettings, setModuleSettings] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' });
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  const invalidateLookups = useInvalidateLookups();

  // Load module settings
  useEffect(() => {
    if (!tenantId || !moduleName) return;
    loadModuleSettings();
  }, [moduleName, tenantId]);

  // Load activities, notes, tasks for edit mode if features enabled
  useEffect(() => {
    if (mode === 'edit' && recordId && moduleSettings) {
      const hasFeatures = moduleSettings.features?.activities || 
                          moduleSettings.features?.notes || 
                          moduleSettings.features?.tasks;
      if (hasFeatures) {
        loadLeadExtras();
      }
    }
  }, [mode, recordId, moduleSettings]);

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

  const loadLeadExtras = async () => {
    try {
      const [activitiesRes, notesRes, tasksRes] = await Promise.all([
        fetch(`/api/modules/${moduleName}/records/${recordId}/activities?tenantId=${tenantId}`),
        fetch(`/api/modules/${moduleName}/records/${recordId}/notes?tenantId=${tenantId}`),
        fetch(`/api/modules/${moduleName}/records/${recordId}/tasks?tenantId=${tenantId}`),
      ]);
      
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
      }
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading lead extras:', error);
    }
  };

  const handleCall = async (phoneNumber: string) => {
    if (!moduleSettings?.clickToCall?.enabled) return;
    
    toast({
      title: 'Initiating Call',
      description: `Calling ${phoneNumber}...`,
      status: 'info',
      duration: 2000,
    });

    // Log activity
    try {
      await fetch(`/api/modules/${moduleName}/records/${recordId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: 'call',
          title: 'Phone Call',
          description: `Called ${phoneNumber}`,
        }),
      });
      loadLeadExtras();
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await fetch(`/api/modules/${moduleName}/records/${recordId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          content: newNote,
        }),
      });
      setNewNote('');
      loadLeadExtras();
      toast({ title: 'Note added', status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Failed to add note', status: 'error', duration: 2000 });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      await fetch(`/api/modules/${moduleName}/records/${recordId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: newTask.title,
          dueDate: newTask.dueDate,
        }),
      });
      setNewTask({ title: '', dueDate: '' });
      loadLeadExtras();
      toast({ title: 'Task created', status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Failed to create task', status: 'error', duration: 2000 });
    }
  };

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

  const showRecordExtras = mode === 'edit' && recordId && moduleSettings && (
    moduleSettings.features?.activities || 
    moduleSettings.features?.notes || 
    moduleSettings.features?.tasks
  );

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
      <HStack justify="space-between">
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
        
        {/* Click-to-Call Button */}
        {showRecordExtras && moduleSettings?.clickToCall?.enabled && initialData?.phone && (
          <Button
            leftIcon={<FiPhone />}
            colorScheme="green"
            onClick={() => handleCall(initialData.phone)}
          >
            Call
          </Button>
        )}
      </HStack>

      <Grid templateColumns={showRecordExtras ? { base: '1fr', lg: '2fr 1fr' } : '1fr'} gap={6}>
        {/* Main Form */}
        <GridItem>
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
        </GridItem>

        {/* Record Sidebar - Tasks, Notes, Activity (Any Module) */}
        {showRecordExtras && (
          <GridItem>
            <VStack spacing={4} align="stretch">
              {/* Tasks Card */}
              {moduleSettings?.features?.tasks && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="sm">Follow-up Tasks</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {/* Add Task Form */}
                    <Box>
                      <Input
                        size="sm"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        mb={2}
                      />
                      <HStack>
                        <Input
                          size="sm"
                          type="datetime-local"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        />
                        <IconButton
                          aria-label="Add task"
                          icon={<FiPlus />}
                          size="sm"
                          colorScheme="blue"
                          onClick={addTask}
                        />
                      </HStack>
                    </Box>
                    
                    <Divider />
                    
                    {/* Task List */}
                    <List spacing={2}>
                      {tasks.map((task: any) => (
                        <ListItem key={task.id} fontSize="sm">
                          <Flex justify="space-between" align="center">
                            <Text>{task.title}</Text>
                            <Badge colorScheme={task.status === 'completed' ? 'green' : 'orange'} size="sm">
                              {task.status === 'completed' ? <FiCheckCircle /> : <FiClock />}
                            </Badge>
                          </Flex>
                        </ListItem>
                      ))}
                      {tasks.length === 0 && (
                        <Text fontSize="sm" color="gray.500">No tasks yet</Text>
                      )}
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              )}

              {/* Notes Card */}
              {moduleSettings?.features?.notes && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="sm">Notes</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {/* Add Note Form */}
                    <HStack>
                      <Textarea
                        size="sm"
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={2}
                      />
                      <IconButton
                        aria-label="Add note"
                        icon={<FiPlus />}
                        size="sm"
                        colorScheme="blue"
                        onClick={addNote}
                      />
                    </HStack>
                    
                    <Divider />
                    
                    {/* Notes List */}
                    <List spacing={2}>
                      {notes.map((note: any) => (
                        <ListItem key={note.id} fontSize="sm" p={2} bg="gray.50" borderRadius="md">
                          <Text>{note.content}</Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {new Date(note.createdAt).toLocaleString()}
                          </Text>
                        </ListItem>
                      ))}
                      {notes.length === 0 && (
                        <Text fontSize="sm" color="gray.500">No notes yet</Text>
                      )}
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              )}

              {/* Activity Timeline Card */}
              {moduleSettings?.features?.activities && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="sm">Activity Timeline</Heading>
                </CardHeader>
                <CardBody>
                  <List spacing={2}>
                    {activities.map((activity: any) => (
                      <ListItem key={activity.id} fontSize="sm" p={2} borderLeft="3px solid" borderColor="blue.400" pl={3}>
                        <Text fontWeight="bold">{activity.type}</Text>
                        <Text>{activity.description}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </Text>
                      </ListItem>
                    ))}
                    {activities.length === 0 && (
                      <Text fontSize="sm" color="gray.500">No activities yet</Text>
                    )}
                  </List>
                </CardBody>
              </Card>
              )}
            </VStack>
          </GridItem>
        )}
      </Grid>

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
