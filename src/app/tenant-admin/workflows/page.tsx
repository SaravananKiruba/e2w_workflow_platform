'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiTrendingUp, FiShoppingCart } from 'react-icons/fi';

interface Workflow {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  isSystem: boolean;
  isActive: boolean;
  moduleSequence?: string;
}

const ICON_OPTIONS = [
  { value: 'FiTrendingUp', label: '📊 Trending Up (Sales)' },
  { value: 'FiShoppingCart', label: '🛒 Shopping Cart (Purchase)' },
  { value: 'FiUsers', label: '👥 Users (HR)' },
  { value: 'FiPackage', label: '📦 Package (Inventory)' },
  { value: 'FiDollarSign', label: '💰 Dollar (Finance)' },
  { value: 'FiGrid', label: '⚡ Grid (Custom)' },
  { value: 'FiLayers', label: '📚 Layers (Projects)' },
];

export default function WorkflowManagementPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: 'FiGrid',
  });
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/tenant-admin/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch workflows',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workflows',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingWorkflow(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: 'FiGrid',
    });
    onOpen();
  };

  const handleOpenEdit = (workflow: Workflow) => {
    if (workflow.isSystem) {
      toast({
        title: 'Cannot Edit',
        description: 'System workflows cannot be edited',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      displayName: workflow.displayName,
      description: workflow.description || '',
      icon: workflow.icon || 'FiGrid',
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.displayName) {
      toast({
        title: 'Validation Error',
        description: 'Name and display name are required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate name format (no spaces, alphanumeric only)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      toast({
        title: 'Validation Error',
        description: 'Name must start with a letter and contain only letters, numbers, and underscores',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const url = '/api/tenant-admin/workflows';
      const method = editingWorkflow ? 'PUT' : 'POST';
      const payload = editingWorkflow ? { id: editingWorkflow.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Workflow ${editingWorkflow ? 'updated' : 'created'} successfully`,
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchWorkflows();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save workflow',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      toast({
        title: 'Cannot Delete',
        description: 'System workflows cannot be deleted',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this workflow? All modules in this workflow will be hidden.')) return;

    try {
      const response = await fetch(`/api/tenant-admin/workflows?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Workflow deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchWorkflows();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete workflow',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const systemWorkflows = workflows.filter(w => w.isSystem);
  const customWorkflows = workflows.filter(w => !w.isSystem);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">Workflow Management</Heading>
            <Text color="gray.600" mt={2}>
              Create custom workflows to organize your business modules
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={handleOpenCreate}>
            Create Workflow
          </Button>
        </HStack>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>About Workflows</AlertTitle>
            <AlertDescription>
              Workflows help organize related modules. For example, create an "Employee" workflow with modules like Attendance, Tasks, and Leaves.
              Default Sales and Purchase workflows are provided by the system.
            </AlertDescription>
          </Box>
        </Alert>

        {/* System Workflows */}
        <Box>
          <Heading size="md" mb={4}>System Workflows</Heading>
          <Box bg="white" borderRadius="lg" shadow="sm" overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Display Name</Th>
                  <Th>Description</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {systemWorkflows.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">No system workflows found</Td>
                  </Tr>
                ) : (
                  systemWorkflows.map((workflow) => (
                    <Tr key={workflow.id}>
                      <Td fontWeight="medium">{workflow.name}</Td>
                      <Td>{workflow.displayName}</Td>
                      <Td>{workflow.description || 'N/A'}</Td>
                      <Td>
                        <Badge colorScheme="blue">System</Badge>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>

        {/* Custom Workflows */}
        <Box>
          <Heading size="md" mb={4}>Custom Workflows</Heading>
          <Box bg="white" borderRadius="lg" shadow="sm" overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Display Name</Th>
                  <Th>Description</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">Loading...</Td>
                  </Tr>
                ) : customWorkflows.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      No custom workflows yet. Create one to get started!
                    </Td>
                  </Tr>
                ) : (
                  customWorkflows.map((workflow) => (
                    <Tr key={workflow.id}>
                      <Td fontWeight="medium">{workflow.name}</Td>
                      <Td>{workflow.displayName}</Td>
                      <Td>{workflow.description || 'N/A'}</Td>
                      <Td>
                        <Badge colorScheme={workflow.isActive ? 'green' : 'gray'}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit workflow"
                            icon={<FiEdit />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleOpenEdit(workflow)}
                          />
                          <IconButton
                            aria-label="Delete workflow"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(workflow.id, workflow.isSystem)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingWorkflow ? 'Edit Workflow' : 'Create Custom Workflow'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Workflow Name (Internal)</FormLabel>
                <Input
                  placeholder="e.g., Employee, Projects, Inventory"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isDisabled={!!editingWorkflow}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Internal name (no spaces, alphanumeric and underscores only). Cannot be changed after creation.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Display Name</FormLabel>
                <Input
                  placeholder="e.g., Employee Management"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  User-friendly name shown in the interface
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Brief description of this workflow"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Icon</FormLabel>
                <Select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </Select>
              </FormControl>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  After creating a workflow, go to Module Builder to add modules to this workflow.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleSubmit}>
              {editingWorkflow ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
