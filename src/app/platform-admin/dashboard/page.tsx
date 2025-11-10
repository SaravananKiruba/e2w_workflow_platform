'use client';

import {
  Box,
  Container,
  Heading,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  SimpleGrid,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { FiUsers, FiServer, FiCheckCircle, FiClock } from 'react-icons/fi';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalModules: number;
  totalWorkflows: number;
}

export default function PlatformAdminDashboard() {
  const router = useRouter();
  
  // Platform admin doesn't need a separate dashboard - redirect to tenants
  useEffect(() => {
    router.push('/platform-admin/tenants');
  }, [router]);

  return null;
}

// OLD CODE - Keeping for reference if needed later
function OldPlatformDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<PlatformStats>({
    totalTenants: 0,
    activeTenants: 0,
    inactiveTenants: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalModules: 0,
    totalWorkflows: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Implement API endpoint for platform stats
      // For now, using placeholder data
      setStats({
        totalTenants: 1,
        activeTenants: 1,
        inactiveTenants: 0,
        totalUsers: 2,
        activeUsers: 2,
        pendingApprovals: 0,
        totalModules: 6,
        totalWorkflows: 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error loading statistics',
        description: 'Failed to fetch platform statistics',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Container maxW="7xl" py={8}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Platform Admin Dashboard</Heading>
            <Text color="gray.600">
              Manage tenants, users, and platform-wide settings
            </Text>
          </Box>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <Heading size="md">Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => router.push('/platform-admin/tenants')}
                >
                  Manage Tenants
                </Button>
                <Button
                  colorScheme="purple"
                  size="lg"
                  onClick={() => router.push('/platform-admin/approval-queue')}
                >
                  Approval Queue
                </Button>
                <Button
                  colorScheme="teal"
                  size="lg"
                  onClick={() => router.push('/platform-admin/settings')}
                >
                  Platform Settings
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/admin/field-builder')}
                >
                  Field Library
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Statistics Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {/* Tenants */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between">
                    <Box>
                      <StatLabel>Total Tenants</StatLabel>
                      <StatNumber>{stats.totalTenants}</StatNumber>
                      <StatHelpText>
                        <Badge colorScheme="green">{stats.activeTenants} active</Badge>
                        {stats.inactiveTenants > 0 && (
                          <Badge ml={2} colorScheme="gray">
                            {stats.inactiveTenants} inactive
                          </Badge>
                        )}
                      </StatHelpText>
                    </Box>
                    <Icon as={FiServer} boxSize={10} color="blue.500" />
                  </HStack>
                </Stat>
              </CardBody>
            </Card>

            {/* Users */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between">
                    <Box>
                      <StatLabel>Total Users</StatLabel>
                      <StatNumber>{stats.totalUsers}</StatNumber>
                      <StatHelpText>
                        <Badge colorScheme="green">{stats.activeUsers} active</Badge>
                      </StatHelpText>
                    </Box>
                    <Icon as={FiUsers} boxSize={10} color="purple.500" />
                  </HStack>
                </Stat>
              </CardBody>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between">
                    <Box>
                      <StatLabel>Pending Approvals</StatLabel>
                      <StatNumber>{stats.pendingApprovals}</StatNumber>
                      <StatHelpText>
                        Config changes awaiting review
                      </StatHelpText>
                    </Box>
                    <Icon as={FiClock} boxSize={10} color="orange.500" />
                  </HStack>
                </Stat>
              </CardBody>
            </Card>

            {/* Modules */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between">
                    <Box>
                      <StatLabel>Active Modules</StatLabel>
                      <StatNumber>{stats.totalModules}</StatNumber>
                      <StatHelpText>
                        {stats.totalWorkflows} workflows configured
                      </StatHelpText>
                    </Box>
                    <Icon as={FiCheckCircle} boxSize={10} color="teal.500" />
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <Heading size="md">Recent Activity</Heading>
            </CardHeader>
            <CardBody>
              <Text color="gray.500" textAlign="center" py={8}>
                No recent activity to display
              </Text>
            </CardBody>
          </Card>

          {/* System Health */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="md">System Health</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text>Database</Text>
                    <Badge colorScheme="green">Healthy</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>API Services</Text>
                    <Badge colorScheme="green">Healthy</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Background Jobs</Text>
                    <Badge colorScheme="green">Running</Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Platform Version</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text>Version</Text>
                    <Badge>v1.0.0</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Environment</Text>
                    <Badge colorScheme="yellow">Development</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Last Updated</Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date().toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </AppLayout>
  );
}
