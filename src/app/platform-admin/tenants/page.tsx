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
  FiKey,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [filteredTenants, setFilteredTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState('created'); // created, name, users, records, storage
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subscriptionTier: 'free',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [totalStorageGB, setTotalStorageGB] = useState(0);
  const [adminCredentials, setAdminCredentials] = useState<any>(null);
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const [selectedTenantForReset, setSelectedTenantForReset] = useState<any>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetResult, setResetResult] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCredOpen, onOpen: onCredOpen, onClose: onCredClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchTenants();
    fetchStorageData();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = tenants.filter((tenant) => {
      const matchSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || tenant.status === filterStatus;
      const matchTier = filterTier === 'all' || tenant.subscriptionTier === filterTier;
      return matchSearch && matchStatus && matchTier;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'users':
          aVal = a._count?.users || 0;
          bVal = b._count?.users || 0;
          break;
        case 'records':
          aVal = a.recordCount || 0;
          bVal = b.recordCount || 0;
          break;
        case 'storage':
          aVal = a.storageUsedMB || 0;
          bVal = b.storageUsedMB || 0;
          break;
        case 'created':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTenants(filtered);
  }, [tenants, searchTerm, filterStatus, filterTier, sortBy, sortOrder]);

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

  const openResetModal = (tenant: any) => {
    setSelectedTenantForReset(tenant);
    setResetPasswordValue('');
    setResetResult(null);
    onResetOpen();
  };

  const handleResetPassword = async () => {
    if (!selectedTenantForReset) return;

    // Validate password
    if (!resetPasswordValue) {
      toast({
        title: 'Password required',
        description: 'Please enter a new password',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (resetPasswordValue.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantForReset.id}/reset-admin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: resetPasswordValue }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetResult(data);
        toast({ title: 'Password reset', description: 'Tenant admin password has been reset. Copy the new password below.', status: 'success', duration: 4000 });
        fetchTenants();
      } else {
        toast({ title: 'Reset failed', description: data.error || 'Failed to reset password', status: 'error', duration: 4000 });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An error occurred', status: 'error', duration: 4000 });
    }
  };

  const fetchStorageData = async () => {
    try {
      const res = await fetch('/api/admin/platform/storage');
      if (res.ok) {
        const data = await res.json();
        setTotalStorageGB(data.totalStorageGB);
      }
    } catch (error) {
      console.error('Error fetching storage data:', error);
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
        const data = await res.json();
        
        if (!selectedTenant && data.adminCredentials) {
          // Show credentials modal for new tenant
          setAdminCredentials(data.adminCredentials);
          onCredOpen();
        }

        toast({
          title: selectedTenant ? 'Tenant updated' : 'Tenant created',
          status: 'success',
          duration: 3000,
        });
        fetchTenants();
        fetchStorageData();
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
        fetchStorageData();
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
                {totalStorageGB.toFixed(2)} GB
              </StatNumber>
              <StatHelpText>Storage consumed</StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Filters and Sort Controls */}
        <Box bg="white" p={6} borderRadius="lg" border="1px" borderColor="gray.200" boxShadow="sm">
          <VStack spacing={5} align="stretch">
            {/* Title and Result Count */}
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="sm">Filter & Search</Heading>
                <Text fontSize="xs" color="gray.500">
                  Showing <strong>{filteredTenants.length}</strong> of <strong>{tenants.length}</strong> tenants
                </Text>
              </VStack>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterTier('all');
                  setSortBy('created');
                  setSortOrder('desc');
                }}
              >
                Clear All
              </Button>
            </HStack>

            {/* First Row - Search */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                🔍 Search Tenants
              </FormLabel>
              <Input
                placeholder="Search by tenant name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="md"
                borderColor="gray.300"
                _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(66, 153, 225, 0.5)' }}
              />
            </FormControl>

            {/* Filter Row 1 - Status and Tier */}
            <HStack spacing={4} align="flex-end">
              <FormControl minW="180px">
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  📊 Status
                </FormLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">✅ Active</option>
                  <option value="suspended">⏸️ Suspended</option>
                  <option value="inactive">❌ Inactive</option>
                </Select>
              </FormControl>

              <FormControl minW="180px">
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  💎 Tier
                </FormLabel>
                <Select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="all">All Tiers</option>
                  <option value="free">🆓 Free</option>
                  <option value="basic">📦 Basic</option>
                  <option value="professional">⭐ Professional</option>
                  <option value="enterprise">🚀 Enterprise</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Filter Row 2 - Sort Options */}
            <HStack spacing={4} align="flex-end">
              <FormControl minW="200px">
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
                  <option value="created">Created Date</option>
                  <option value="name">Tenant Name</option>
                  <option value="users">Users Count</option>
                  <option value="records">Records Count</option>
                  <option value="storage">Storage Used</option>
                </Select>
              </FormControl>

              <FormControl minW="150px">
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Order
                </FormLabel>
                <HStack spacing={2}>
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
                </HStack>
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        {/* Tenants Table */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
          {loading ? (
            <Box p={8} textAlign="center">
              <Text>Loading...</Text>
            </Box>
          ) : filteredTenants.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color="gray.500">No tenants found matching your filters</Text>
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
                {filteredTenants.map((tenant) => (
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
                          aria-label="Reset tenant admin password"
                          icon={<Icon as={FiKey} />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openResetModal(tenant)}
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

      {/* Tenant Admin Credentials Modal */}
      <Modal isOpen={isCredOpen} onClose={onCredClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tenant Created Successfully! 🎉</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" color="orange.600">
                ⚠️ Important: Share these credentials with the tenant admin
              </Text>
              <Text fontSize="sm" color="gray.600">
                These credentials are shown only once. The tenant admin can reset their password after first login.
              </Text>
              
              <Box bg="gray.50" p={4} borderRadius="md" border="1px" borderColor="gray.200">
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">Email:</Text>
                    <HStack>
                      <Code fontSize="md" colorScheme="blue" p={2} flex={1}>
                        {adminCredentials?.email}
                      </Code>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(adminCredentials?.email || '');
                          toast({ title: 'Email copied!', status: 'success', duration: 2000 });
                        }}
                      >
                        Copy
                      </Button>
                    </HStack>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">Password:</Text>
                    <HStack>
                      <Code fontSize="md" colorScheme="green" p={2} flex={1}>
                        {adminCredentials?.password}
                      </Code>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(adminCredentials?.password || '');
                          toast({ title: 'Password copied!', status: 'success', duration: 2000 });
                        }}
                      >
                        Copy
                      </Button>
                    </HStack>
                  </Box>
                </VStack>
              </Box>

              <Box bg="blue.50" p={3} borderRadius="md">
                <Text fontSize="sm" color="blue.800">
                  💡 {adminCredentials?.message}
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={onCredClose}>
              I've Saved the Credentials
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Tenant Admin Password Modal */}
      <Modal isOpen={isResetOpen} onClose={onResetClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Tenant Admin Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                You are resetting the tenant admin password for <strong>{selectedTenantForReset?.name}</strong>.
              </Text>

              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Enter a new password (min 6 characters)"
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Share this password with the tenant admin for their new login.
                </Text>
              </FormControl>

              {resetResult && (
                <Box bg="gray.50" p={3} borderRadius="md" border="1px" borderColor="gray.200">
                  <Text fontSize="sm" fontWeight="bold">New Credentials</Text>
                  <HStack mt={2} spacing={3}>
                    <Code>{resetResult.email}</Code>
                    <Code colorScheme="green">{resetResult.password}</Code>
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(resetResult.password || ''); toast({ title: 'Password copied', status: 'success' }); }}>Copy</Button>
                  </HStack>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onResetClose}>Cancel</Button>
              <Button colorScheme="orange" onClick={handleResetPassword}>Reset Password</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
