'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Icon,
  Text,
  Button,
  Card,
  CardBody,
} from '@chakra-ui/react';
import {
  FiGrid,
  FiGitBranch,
  FiUsers,
  FiDatabase,
  FiHardDrive,
  FiArrowRight,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function TenantAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    totalWorkflows: 0,
    totalRecords: 0,
    storageUsed: 0,
  });

  useEffect(() => {
    // TODO: Fetch actual stats from API
    setStats({
      totalUsers: 12,
      totalModules: 7,
      totalWorkflows: 5,
      totalRecords: 1250,
      storageUsed: 45.8,
    });
  }, []);

  const quickActions = [
    {
      title: 'Field Builder',
      description: 'Create and manage custom fields for your modules',
      icon: FiGrid,
      color: 'blue',
      href: '/tenant-admin/field-builder',
    },
    {
      title: 'Workflow Builder',
      description: 'Automate processes with custom workflows',
      icon: FiGitBranch,
      color: 'green',
      href: '/tenant-admin/workflow-builder',
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: FiUsers,
      color: 'orange',
      href: '/tenant-admin/users',
    },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg" color="purple.700">
          Tenant Admin Dashboard
        </Heading>
        <Text color="gray.600" mt={2}>
          Manage your organization's configuration and settings
        </Text>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Box bg="white" p={5} borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
          <Stat>
            <HStack>
              <Icon as={FiUsers} boxSize={6} color="blue.500" />
              <StatLabel>Total Users</StatLabel>
            </HStack>
            <StatNumber>{stats.totalUsers}</StatNumber>
            <StatHelpText>Active in organization</StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={5} borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
          <Stat>
            <HStack>
              <Icon as={FiGrid} boxSize={6} color="green.500" />
              <StatLabel>Modules</StatLabel>
            </HStack>
            <StatNumber>{stats.totalModules}</StatNumber>
            <StatHelpText>Configured modules</StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={5} borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
          <Stat>
            <HStack>
              <Icon as={FiGitBranch} boxSize={6} color="purple.500" />
              <StatLabel>Workflows</StatLabel>
            </HStack>
            <StatNumber>{stats.totalWorkflows}</StatNumber>
            <StatHelpText>Active workflows</StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={5} borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
          <Stat>
            <HStack>
              <Icon as={FiDatabase} boxSize={6} color="orange.500" />
              <StatLabel>Total Records</StatLabel>
            </HStack>
            <StatNumber>{stats.totalRecords.toLocaleString()}</StatNumber>
            <StatHelpText>{stats.storageUsed.toFixed(1)} MB used</StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Quick Actions */}
      <Box>
        <Heading size="md" mb={4}>
          Quick Actions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {quickActions.map((action) => (
            <Card key={action.title} variant="outline" _hover={{ shadow: 'md', borderColor: `${action.color}.300` }} transition="all 0.2s">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Icon as={action.icon} boxSize={8} color={`${action.color}.500`} />
                    <Heading size="sm">{action.title}</Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {action.description}
                  </Text>
                  <Button
                    size="sm"
                    colorScheme={action.color}
                    rightIcon={<Icon as={FiArrowRight} />}
                    onClick={() => router.push(action.href)}
                  >
                    Open
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Info Box */}
      <Box bg="purple.50" p={5} borderRadius="lg" border="1px" borderColor="purple.200">
        <VStack align="start" spacing={2}>
          <HStack>
            <Icon as={FiGrid} color="purple.600" />
            <Text fontWeight="bold" color="purple.800">
              About Tenant Admin
            </Text>
          </HStack>
          <Text fontSize="sm" color="purple.700">
            This section is for administrators and managers only. Here you can configure fields, 
            create workflows, and manage users for your organization.
          </Text>
          <Text fontSize="sm" color="purple.700">
            Regular staff members will only see the core modules (Leads, Clients, etc.) and 
            will not have access to these configuration tools.
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}
