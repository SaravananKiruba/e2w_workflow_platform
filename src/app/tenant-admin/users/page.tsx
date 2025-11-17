'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Stack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Icon,
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
  Code,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    status: 'active',
  });
  const [userCredentials, setUserCredentials] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCredOpen, onOpen: onCredOpen, onClose: onCredClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchRole = filterRole === 'all' || user.role === filterRole;
      return matchSearch && matchStatus && matchRole;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
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

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/tenant/users', {
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast({
          title: 'Error loading users',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading users',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      status: 'active',
    });
    onOpen();
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const method = selectedUser ? 'PUT' : 'POST';
      const url = selectedUser
        ? `/api/tenant/users/${selectedUser.id}`
        : '/api/tenant/users';

      const body = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (!selectedUser) {
          // For new users, show credentials modal
          setUserCredentials({
            email: formData.email,
            password: data.generatedPassword,
          });
          onCredOpen();
        } else {
          toast({
            title: 'User updated',
            status: 'success',
            duration: 3000,
          });
        }
        
        onClose();
        fetchUsers();
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save user',
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

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/tenant/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({
          title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
          status: 'success',
          duration: 3000,
        });
        fetchUsers();
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update status',
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'purple',
      manager: 'blue',
      staff: 'gray',
    };
    return colors[role] || 'gray';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'red';
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <HStack justify="space-between" flexWrap={{ base: "wrap", md: "nowrap" }} gap={{ base: 3, md: 0 }}>
          <Box>
            <Heading size={{ base: "md", md: "lg" }}>User Management</Heading>
            <Text color="gray.600" mt={1} fontSize={{ base: "sm", md: "md" }}>
              Manage users in your organization
            </Text>
          </Box>
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="purple"
          onClick={openCreateModal}
          size={{ base: "sm", md: "md" }}
          w={{ base: "full", sm: "auto" }}
        >
          Add User
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
                Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
              </Text>
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterRole('all');
                setSortBy('created');
                setSortOrder('desc');
              }}
            >
              Clear All
            </Button>
          </HStack>

          {/* Search Input */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
              🔍 Search Users
            </FormLabel>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="md"
              borderColor="gray.300"
              _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px rgba(128, 90, 213, 0.5)' }}
              autoComplete="off"
            />
          </FormControl>

          {/* Filter Row - Status and Role */}
          <HStack spacing={{ base: 2, md: 4 }} align="flex-end" flexWrap={{ base: "wrap", md: "nowrap" }}>
            <FormControl minW={{ base: "full", sm: "180px" }}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                📊 Status
              </FormLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                size="md"
                borderColor="gray.300"
                _focus={{ borderColor: 'purple.500' }}
              >
                <option value="all">All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </Select>
            </FormControl>

            <FormControl minW={{ base: "full", sm: "180px" }}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                👤 Role
              </FormLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                size="md"
                borderColor="gray.300"
                _focus={{ borderColor: 'purple.500' }}
              >
                <option value="all">All Roles</option>
                <option value="admin">🔑 Admin</option>
                <option value="manager">👔 Manager</option>
                <option value="owner">👑 Owner</option>
                <option value="staff">👤 Staff</option>
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
                _focus={{ borderColor: 'purple.500' }}
              >
                <option value="created">Created Date</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
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
                  colorScheme={sortOrder === 'desc' ? 'purple' : 'gray'}
                  onClick={() => setSortOrder('desc')}
                  flex={1}
                  fontSize="sm"
                >
                  ↓ Descending
                </Button>
                <Button
                  size="md"
                  variant={sortOrder === 'asc' ? 'solid' : 'outline'}
                  colorScheme={sortOrder === 'asc' ? 'purple' : 'gray'}
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

      {/* Users Table */}
      <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple" size={{ base: "sm", md: "md" }}>
            <Thead bg="gray.50">
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8}>
                  <Text color="gray.500">No users found matching your filters</Text>
                </Td>
              </Tr>
            ) : (
              filteredUsers.map((user) => (
                <Tr key={user.id}>
                <Td fontWeight="600">{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Badge colorScheme={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </Td>
                <Td fontSize="sm">{new Date(user.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Edit user"
                      icon={<Icon as={FiEdit} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(user)}
                    />
                    <IconButton
                      aria-label={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      icon={<Icon as={user.status === 'active' ? FiToggleRight : FiToggleLeft} />}
                      size="sm"
                      variant="ghost"
                      colorScheme={user.status === 'active' ? 'orange' : 'green'}
                      onClick={() => handleToggleStatus(user.id, user.status)}
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

      {/* Info Box */}
      <Box bg="blue.50" p={{ base: 3, md: 4 }} borderRadius="lg" border="1px" borderColor="blue.200">
        <Text fontSize={{ base: "xs", md: "sm" }} color="blue.800">
          <strong>Note:</strong> Users cannot be deleted, only deactivated. This preserves audit trail and data integrity.
          Staff users can only access core modules. Admins and Managers can access Tenant Admin tools.
        </Text>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 0, md: 4 }}>
          <ModalHeader>
            {selectedUser ? 'Edit User' : 'Create New User'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  isDisabled={!!selectedUser}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Staff: Core modules only. Manager/Admin: Core modules + Tenant Admin tools.
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
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
              <Button colorScheme="purple" onClick={handleSubmit}>
                {selectedUser ? 'Update' : 'Create'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* User Credentials Modal */}
      <Modal isOpen={isCredOpen} onClose={onCredClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Created Successfully! 🎉</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" color="green.600">
                ✅ User account has been created
              </Text>
              <Text fontSize="sm" color="gray.600">
                Share these credentials with the user so they can login to their account.
              </Text>
              
              <Box bg="gray.50" p={4} borderRadius="md" border="1px" borderColor="gray.200">
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">Email:</Text>
                    <HStack>
                      <Code fontSize="md" colorScheme="blue" p={2} flex={1}>
                        {userCredentials?.email}
                      </Code>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(userCredentials?.email || '');
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
                        {userCredentials?.password}
                      </Code>
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(userCredentials?.password || '');
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
                  💡 User can change their password after the first login.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="purple" onClick={onCredClose}>
              I've Saved the Credentials
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </VStack>
    </Box>
  );
}
