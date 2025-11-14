'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  IconButton,
  Switch,
  Code,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiUsers,
  FiDatabase,
  FiActivity,
  FiToggleLeft,
  FiToggleRight,
  FiHardDrive,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subscriptionTier: 'free',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants?limit=100');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error: any) {
      toast({
        title: 'Error loading tenants',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedTenant(null);
    setFormData({
      name: '',
      slug: '',
      subscriptionTier: 'free',
      status: 'active',
    });
    onOpen();
  };

  const openEditModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      subscriptionTier: tenant.subscriptionTier,
      status: tenant.status,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      const url = selectedTenant
        ? `/api/admin/tenants/${selectedTenant.id}`
        : '/api/admin/tenants';

      const method = selectedTenant ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: selectedTenant ? 'Tenant updated' : 'Tenant created',
          status: 'success',
          duration: 3000,
        });
        fetchTenants();
        onClose();
      } else {
        const error = await res.json();
        toast({
          title: 'Operation failed',
          description: error.error || error.details,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (tenantId: string) => {
    toast({
      title: 'Delete Not Allowed',
      description: 'Please use deactivate instead to preserve tenant data.',
      status: 'warning',
      duration: 4000,
    });
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this tenant? ${newStatus === 'inactive' ? 'Users will not be able to login.' : 'Users will regain access.'}`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({
          title: `Tenant ${action}d`,
          description: `The tenant has been ${action}d successfully.`,
          status: 'success',
          duration: 3000,
        });
        fetchTenants();
      } else {
        const error = await res.json();
        toast({
          title: 'Operation failed',
          description: error.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getTenantStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      suspended: 'orange',
      inactive: 'gray',
    };
    return colorMap[status] || 'gray';
  };

  const getSubscriptionColor = (tier: string) => {
    const colorMap: Record<string, string> = {
      free: 'gray',
      basic: 'blue',
      professional: 'purple',
      enterprise: 'orange',
    };
    return colorMap[tier] || 'gray';
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Tenant Management</Heading>
            <Text color="gray.600">Manage all tenants and their subscriptions</Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={openCreateModal}
          >
            Create Tenant
          </Button>
        </HStack>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box bg="white" p={4} borderRadius="lg" border="1px" borderColor="gray.200">
            <Stat>
              <HStack>
                <Icon as={FiUsers} boxSize={6} color="blue.500" />
                <StatLabel>Total Tenants</StatLabel>
              </HStack>
              <StatNumber>{tenants.length}</StatNumber>
              <StatHelpText>All registered tenants</StatHelpText>
            </Stat>
          </Box>

          <Box bg="white" p={4} borderRadius="lg" border="1px" borderColor="gray.200">
            <Stat>
              <HStack>
                <Icon as={FiActivity} boxSize={6} color="green.500" />
                <StatLabel>Active Tenants</StatLabel>
              </HStack>
              <StatNumber>
                {tenants.filter((t) => t.status === 'active').length}
              </StatNumber>
              <StatHelpText>Currently active</StatHelpText>
            </Stat>
          </Box>

          <Box bg="white" p={4} borderRadius="lg" border="1px" borderColor="gray.200">
            <Stat>
              <HStack>
                <Icon as={FiHardDrive} boxSize={6} color="orange.500" />
                <StatLabel>Total Storage</StatLabel>
              </HStack>
              <StatNumber>
                {(tenants.reduce((sum, t) => sum + (t.storageUsedMB || 0), 0) / 1024).toFixed(2)} GB
              </StatNumber>
              <StatHelpText>Storage consumed</StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Tenants Table */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
          {loading ? (
            <Box p={8} textAlign="center">
              <Text>Loading...</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Tenant Name</Th>
                  <Th>Slug</Th>
                  <Th>Status</Th>
                  <Th>Subscription</Th>
                  <Th>Users</Th>
                  <Th>Records</Th>
                  <Th>Storage (MB)</Th>
                  <Th>Limits</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tenants.map((tenant) => (
                  <Tr key={tenant.id}>
                    <Td fontWeight="bold">{tenant.name}</Td>
                    <Td>
                      <Code fontSize="sm">{tenant.slug}</Code>
                    </Td>
                    <Td>
                      <Badge colorScheme={getTenantStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getSubscriptionColor(tenant.subscriptionTier)}>
                        {tenant.subscriptionTier}
                      </Badge>
                    </Td>
                    <Td>{tenant._count?.users || 0}</Td>
                    <Td>{(tenant.recordCount || 0).toLocaleString()}</Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="600">
                          {(tenant.storageUsedMB || 0).toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          / {(tenant.maxStorage || 1000).toFixed(0)} MB
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.600">
                          Users: {tenant._count?.users || 0}/{tenant.maxUsers || 10}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          Modules: {tenant._count?.modules || 0}
                        </Text>
                      </VStack>
                    </Td>
                    <Td fontSize="sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Edit tenant"
                          icon={<Icon as={FiEdit} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(tenant)}
                        />
                        <IconButton
                          aria-label={tenant.status === 'active' ? 'Deactivate tenant' : 'Activate tenant'}
                          icon={<Icon as={tenant.status === 'active' ? FiToggleRight : FiToggleLeft} />}
                          size="sm"
                          variant="ghost"
                          colorScheme={tenant.status === 'active' ? 'orange' : 'green'}
                          onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTenant ? 'Edit Tenant' : 'Create New Tenant'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tenant Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corporation"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Slug</FormLabel>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="acme-corp"
                  isDisabled={!!selectedTenant}
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Lowercase, alphanumeric and hyphens only. Cannot be changed later.
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Subscription Tier</FormLabel>
                <Select
                  value={formData.subscriptionTier}
                  onChange={(e) =>
                    setFormData({ ...formData, subscriptionTier: e.target.value })
                  }
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {selectedTenant ? 'Update' : 'Create'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
