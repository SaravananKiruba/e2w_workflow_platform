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
  Checkbox,
  CheckboxGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiGrid } from 'react-icons/fi';

interface Module {
  id: string;
  moduleName: string;
  displayName: string;
  icon: string;
  description?: string;
  purpose?: string;
  category?: string;
  position: number;
  insertAfter?: string;
  showInNav: boolean;
  allowedRoles: string[];
  isCustomModule: boolean;
  status: string;
}

const ICON_OPTIONS = [
  'FiGrid', 'FiFileText', 'FiUsers', 'FiShoppingCart', 'FiDollarSign',
  'FiCreditCard', 'FiTrendingUp', 'FiLayers', 'FiDatabase', 'FiTag',
  'FiClipboard', 'FiTruck', 'FiPackage', 'FiBox', 'FiArchive',
];

const CATEGORY_OPTIONS = ['Sales', 'Purchase', 'Inventory', 'Finance', 'HR', 'Custom'];

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'staff', label: 'Staff' },
];

export default function ModuleBuilderPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    moduleName: '',
    displayName: '',
    icon: 'FiGrid',
    description: '',
    purpose: '',
    category: 'Custom',
    insertAfter: '',
    allowedRoles: ['manager', 'owner', 'staff'],
  });
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/tenant-admin/custom-modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch modules',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch modules',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData({
      moduleName: '',
      displayName: '',
      icon: 'FiGrid',
      description: '',
      purpose: '',
      category: 'Custom',
      insertAfter: '',
      allowedRoles: ['manager', 'owner', 'staff'],
    });
    onOpen();
  };

  const handleOpenEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      moduleName: module.moduleName,
      displayName: module.displayName,
      icon: module.icon || 'FiGrid',
      description: module.description || '',
      purpose: module.purpose || '',
      category: module.category || 'Custom',
      insertAfter: module.insertAfter || '',
      allowedRoles: module.allowedRoles || ['manager', 'owner', 'staff'],
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.moduleName || !formData.displayName) {
      toast({
        title: 'Validation Error',
        description: 'Module name and display name are required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const url = '/api/tenant-admin/custom-modules';
      const method = editingModule ? 'PUT' : 'POST';
      const payload = editingModule ? { id: editingModule.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Module ${editingModule ? 'updated' : 'created'} successfully`,
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchModules();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save module',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: 'Error',
        description: 'Failed to save module',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/tenant-admin/custom-modules?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Module deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchModules();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete module',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete module',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const availableModulesForInsertAfter = modules.filter(m => 
    m.category === formData.category && (!editingModule || m.id !== editingModule.id)
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg">Module Builder</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleOpenCreate}>
            Create Custom Module
          </Button>
        </HStack>

        <Box bg="white" borderRadius="lg" shadow="sm" overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Module Name</Th>
                <Th>Display Name</Th>
                <Th>Category</Th>
                <Th>Position</Th>
                <Th>Allowed Roles</Th>
                <Th>Type</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">Loading...</Td>
                </Tr>
              ) : modules.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">No modules found</Td>
                </Tr>
              ) : (
                modules.map((module) => (
                  <Tr key={module.id}>
                    <Td fontWeight="medium">{module.moduleName}</Td>
                    <Td>{module.displayName}</Td>
                    <Td>
                      <Badge colorScheme="blue">{module.category || 'N/A'}</Badge>
                    </Td>
                    <Td>{module.position}</Td>
                    <Td>
                      <HStack spacing={1}>
                        {module.allowedRoles?.map(role => (
                          <Badge key={role} size="sm" colorScheme="green">{role}</Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={module.isCustomModule ? 'purple' : 'gray'}>
                        {module.isCustomModule ? 'Custom' : 'System'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit module"
                          icon={<FiEdit />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => handleOpenEdit(module)}
                        />
                        {module.isCustomModule && (
                          <IconButton
                            aria-label="Delete module"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(module.id)}
                          />
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingModule ? 'Edit Module' : 'Create Custom Module'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Module Name (Internal)</FormLabel>
                <Input
                  placeholder="e.g., Projects, Tasks, Inventory"
                  value={formData.moduleName}
                  onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                  isDisabled={!!editingModule}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Internal name (no spaces, used in URLs). Cannot be changed after creation.
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Display Name</FormLabel>
                <Input
                  placeholder="e.g., Project Management"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Icon</FormLabel>
                <Select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Brief description of this module"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Purpose</FormLabel>
                <Textarea
                  placeholder="What is this module used for?"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, insertAfter: '' })}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Insert After Module</FormLabel>
                <Select
                  value={formData.insertAfter}
                  onChange={(e) => setFormData({ ...formData, insertAfter: e.target.value })}
                >
                  <option value="">-- Place at end --</option>
                  {availableModulesForInsertAfter.map(mod => (
                    <option key={mod.id} value={mod.moduleName}>
                      {mod.displayName}
                    </option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Position this module after another module in the same category
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Allowed Roles</FormLabel>
                <CheckboxGroup
                  value={formData.allowedRoles}
                  onChange={(values) => setFormData({ ...formData, allowedRoles: values as string[] })}
                >
                  <Stack spacing={2}>
                    {ROLE_OPTIONS.map(role => (
                      <Checkbox key={role.value} value={role.value}>
                        {role.label}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {editingModule ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
