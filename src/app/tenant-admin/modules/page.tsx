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
  workflowCategory?: string;
  workflowName?: string;
  category?: string;
  position: number;
  insertAfter?: string;
  showInNav: boolean;
  allowedRoles: string[];
  isCustomModule: boolean;
  status: string;
}

interface Workflow {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
}

const ICON_OPTIONS = [
  'FiGrid', 'FiFileText', 'FiUsers', 'FiShoppingCart', 'FiDollarSign',
  'FiCreditCard', 'FiTrendingUp', 'FiLayers', 'FiDatabase', 'FiTag',
  'FiClipboard', 'FiTruck', 'FiPackage', 'FiBox', 'FiArchive',
];

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'staff', label: 'Staff' },
];

export default function ModuleBuilderPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    moduleName: '',
    displayName: '',
    icon: 'FiGrid',
    description: '',
    workflowCategory: '',
    insertAfter: '',
    allowedRoles: ['manager', 'owner', 'staff'],
  });
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchModules();
    fetchWorkflows();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = modules.filter((module) => {
      const matchSearch =
        module.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'all' || module.category === filterCategory;
      const matchType = filterType === 'all' ||
        (filterType === 'custom' && module.isCustomModule) ||
        (filterType === 'system' && !module.isCustomModule);
      return matchSearch && matchCategory && matchType;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'moduleName':
          aVal = a.moduleName.toLowerCase();
          bVal = b.moduleName.toLowerCase();
          break;
        case 'displayName':
          aVal = a.displayName.toLowerCase();
          bVal = b.displayName.toLowerCase();
          break;
        case 'position':
        default:
          aVal = a.position || 0;
          bVal = b.position || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredModules(filtered);
  }, [modules, searchTerm, filterCategory, filterType, sortBy, sortOrder]);

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

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/tenant-admin/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData({
      moduleName: '',
      displayName: '',
      icon: 'FiGrid',
      description: '',
      workflowCategory: '',
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
      workflowCategory: module.workflowCategory || '',
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
    m.workflowCategory === formData.workflowCategory && (!editingModule || m.id !== editingModule.id)
  );

  return (
    <Container maxW={{ base: "full", md: "container.xl" }} py={{ base: 4, md: 8 }} px={{ base: 3, md: 8 }}>
      <VStack align="stretch" spacing={{ base: 4, md: 6 }}>
        <HStack justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }} gap={{ base: 3, md: 0 }}>
          <Heading size={{ base: "md", md: "lg" }}>Module Builder</Heading>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme="blue" 
            onClick={handleOpenCreate}
            size={{ base: "sm", md: "md" }}
            w={{ base: "full", sm: "auto" }}
          >
            Create Custom Module
          </Button>
        </HStack>

        {/* Filter and Sort Controls */}
        <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px" borderColor="gray.200" boxShadow="sm">
          <VStack spacing={{ base: 4, md: 5 }} align="stretch">
            {/* Title and Result Count */}
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="sm">Filter & Search</Heading>
                <Text fontSize="xs" color="gray.500">
                  Showing <strong>{filteredModules.length}</strong> of <strong>{modules.length}</strong> modules
                </Text>
              </VStack>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                  setFilterType('all');
                  setSortBy('position');
                  setSortOrder('asc');
                }}
              >
                Clear All
              </Button>
            </HStack>

            {/* Search Input */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                🔍 Search Modules
              </FormLabel>
              <Input
                placeholder="Search by module name or display name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="md"
                borderColor="gray.300"
                _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(66, 153, 225, 0.5)' }}
                autoComplete="off"
              />
            </FormControl>

            {/* Filter Row - Category and Type */}
            <HStack spacing={{ base: 2, md: 4 }} align="flex-end" flexWrap={{ base: "wrap", md: "nowrap" }}>
              <FormControl minW={{ base: "full", sm: "180px" }}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  📂 Category
                </FormLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="all">All Categories</option>
                  <option value="Sales">📊 Sales</option>
                  <option value="Purchase">🛒 Purchase</option>
                  <option value="Custom">⚡ Custom</option>
                </Select>
              </FormControl>

              <FormControl minW={{ base: "full", sm: "180px" }}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  🔧 Type
                </FormLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="all">All Types</option>
                  <option value="system">🏢 System</option>
                  <option value="custom">⭐ Custom</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Sort Controls */}
            <HStack spacing={{ base: 2, md: 4 }} align="flex-end" flexWrap={{ base: "wrap", md: "nowrap" }}>
              <FormControl minW={{ base: "full", sm: "200px" }}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  ⬆️ Sort By
                </FormLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="position">Position</option>
                  <option value="moduleName">Module Name</option>
                  <option value="displayName">Display Name</option>
                </Select>
              </FormControl>

              <FormControl minW={{ base: "full", sm: "150px" }}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Order
                </FormLabel>
                <Stack direction={{ base: "column", sm: "row" }} spacing={2}>
                  <Button
                    size="md"
                    variant={sortOrder === 'desc' ? 'solid' : 'outline'}
                    colorScheme={sortOrder === 'desc' ? 'blue' : 'gray'}
                    onClick={() => setSortOrder('desc')}
                    flex={1}
                    fontSize="sm"
                  >
                    ↓ Descending
                  </Button>
                  <Button
                    size="md"
                    variant={sortOrder === 'asc' ? 'solid' : 'outline'}
                    colorScheme={sortOrder === 'asc' ? 'blue' : 'gray'}
                    onClick={() => setSortOrder('asc')}
                    flex={1}
                    fontSize="sm"
                  >
                    ↑ Ascending
                  </Button>
                </Stack>
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: "sm", md: "md" }}>
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
              ) : filteredModules.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    <Text color="gray.500">No modules found matching your filters</Text>
                  </Td>
                </Tr>
              ) : (
                filteredModules.map((module) => (
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
                      <Stack direction={{ base: "column", sm: "row" }} spacing={{ base: 1, sm: 2 }}>
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
                      </Stack>
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
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 0, md: 4 }}>
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
                <FormLabel>Workflow Category</FormLabel>
                <Select
                  value={formData.workflowCategory}
                  onChange={(e) => setFormData({ ...formData, workflowCategory: e.target.value, insertAfter: '' })}
                >
                  <option value="">-- Select Workflow --</option>
                  {workflows.map(wf => (
                    <option key={wf.id} value={wf.name}>{wf.displayName}</option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Assign this module to a workflow category
                </Text>
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
            <Stack direction={{ base: "column", sm: "row" }} spacing={3} w={{ base: "full", sm: "auto" }}>
              <Button variant="ghost" onClick={onClose} w={{ base: "full", sm: "auto" }}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit} w={{ base: "full", sm: "auto" }}>
                {editingModule ? 'Update' : 'Create'}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
