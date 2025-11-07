'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Icon,
  Divider,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiServer,
  FiDatabase,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function SaaSProviderDashboard() {
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch platform metrics
      const metricsRes = await fetch('/api/admin/platform/metrics');
      const metricsData = await metricsRes.json();
      setPlatformMetrics(metricsData);

      // Fetch tenants
      const tenantsRes = await fetch('/api/admin/tenants?limit=10');
      const tenantsData = await tenantsRes.json();
      setTenants(tenantsData.tenants || []);

      // Fetch system health
      const healthRes = await fetch('/api/admin/platform/health');
      const healthData = await healthRes.json();
      setSystemHealth(healthData);
    } catch (error: any) {
      toast({
        title: 'Error loading dashboard',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={4}>
          <Heading>Loading...</Heading>
          <Progress size="xs" isIndeterminate w="100%" />
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg">SaaS Provider Dashboard</Heading>
            <Text color="gray.600">Platform-wide metrics and tenant management</Text>
          </VStack>
          <HStack>
            <Button
              leftIcon={<Icon as={FiUsers} />}
              colorScheme="blue"
              onClick={() => router.push('/admin/tenants')}
            >
              Manage Tenants
            </Button>
            <Button
              leftIcon={<Icon as={FiAlertCircle} />}
              colorScheme="orange"
              onClick={() => router.push('/admin/approval-queue')}
            >
              Approval Queue
            </Button>
          </HStack>
        </HStack>

        {/* Platform Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <Icon as={FiUsers} boxSize={6} color="blue.500" />
                  <StatLabel>Total Tenants</StatLabel>
                </HStack>
                <StatNumber>{platformMetrics?.totalTenants || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {platformMetrics?.tenantGrowth || 0}% this month
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <Icon as={FiServer} boxSize={6} color="green.500" />
                  <StatLabel>Active Tenants</StatLabel>
                </HStack>
                <StatNumber>{platformMetrics?.activeTenants || 0}</StatNumber>
                <StatHelpText>
                  {platformMetrics?.activePercentage || 0}% of total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <Icon as={FiDatabase} boxSize={6} color="purple.500" />
                  <StatLabel>Total Records</StatLabel>
                </HStack>
                <StatNumber>{platformMetrics?.totalRecords || 0}</StatNumber>
                <StatHelpText>
                  Across all modules
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <Icon as={FiActivity} boxSize={6} color="orange.500" />
                  <StatLabel>API Calls (24h)</StatLabel>
                </HStack>
                <StatNumber>{platformMetrics?.apiCalls24h || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type={platformMetrics?.apiTrend > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(platformMetrics?.apiTrend || 0)}% vs yesterday
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* System Health */}
        <Card>
          <CardHeader>
            <Heading size="md">System Health</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon
                    as={systemHealth?.database === 'healthy' ? FiCheckCircle : FiAlertCircle}
                    color={systemHealth?.database === 'healthy' ? 'green.500' : 'red.500'}
                  />
                  <Text fontWeight="bold">Database</Text>
                </HStack>
                <Badge colorScheme={systemHealth?.database === 'healthy' ? 'green' : 'red'}>
                  {systemHealth?.database || 'Unknown'}
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  Response time: {systemHealth?.databaseResponseTime || 'N/A'}ms
                </Text>
              </VStack>

              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FiServer} color="blue.500" />
                  <Text fontWeight="bold">Storage Usage</Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold">
                  {systemHealth?.storageUsage || 0}%
                </Text>
                <Progress
                  value={systemHealth?.storageUsage || 0}
                  w="100%"
                  colorScheme={systemHealth?.storageUsage > 80 ? 'red' : 'green'}
                />
              </VStack>

              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FiActivity} color="purple.500" />
                  <Text fontWeight="bold">Avg Response Time</Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold">
                  {systemHealth?.avgResponseTime || 0}ms
                </Text>
                <Badge colorScheme={systemHealth?.avgResponseTime < 100 ? 'green' : 'yellow'}>
                  {systemHealth?.avgResponseTime < 100 ? 'Excellent' : 'Good'}
                </Badge>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Tabs for detailed views */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Recent Tenants</Tab>
            <Tab>Pending Approvals</Tab>
            <Tab>Usage Trends</Tab>
          </TabList>

          <TabPanels>
            {/* Recent Tenants */}
            <TabPanel>
              <Card>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Tenant Name</Th>
                        <Th>Status</Th>
                        <Th>Subscription</Th>
                        <Th>Users</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tenants.map((tenant) => (
                        <Tr key={tenant.id}>
                          <Td fontWeight="bold">{tenant.name}</Td>
                          <Td>
                            <Badge colorScheme={getTenantStatusColor(tenant.status)}>
                              {tenant.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme="purple">{tenant.subscriptionTier}</Badge>
                          </Td>
                          <Td>{tenant._count?.users || 0}</Td>
                          <Td fontSize="sm">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Pending Approvals */}
            <TabPanel>
              <Card>
                <CardBody>
                  <Text color="gray.600">
                    {platformMetrics?.pendingApprovals || 0} configuration changes pending approval
                  </Text>
                  <Button
                    mt={4}
                    colorScheme="orange"
                    onClick={() => router.push('/admin/approval-queue')}
                  >
                    View Approval Queue
                  </Button>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Usage Trends */}
            <TabPanel>
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Module Usage</Text>
                      <Icon as={FiTrendingUp} color="green.500" />
                    </HStack>
                    {platformMetrics?.moduleUsage?.map((module: any) => (
                      <Box key={module.name}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">{module.displayName}</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {module.recordCount} records
                          </Text>
                        </HStack>
                        <Progress
                          value={(module.recordCount / platformMetrics.totalRecords) * 100}
                          colorScheme="blue"
                          size="sm"
                        />
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
