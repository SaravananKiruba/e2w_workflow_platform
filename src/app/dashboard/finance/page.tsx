'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Icon,
  useColorModeValue,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FiDollarSign,
  FiAlertCircle,
  FiFileText,
  FiShoppingCart,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
} from 'react-icons/fi';

interface FinanceMetrics {
  kpis: {
    paidRevenue: number;
    outstandingAmount: number;
    pendingQuotations: number;
    pendingOrders: number;
    overdueInvoices: number;
    overdueAmount: number;
    totalInvoices: number;
    pendingInvoicesCount: number;
  };
  charts: {
    revenueTrend: Array<{ date: string; revenue: number }>;
    topClients: Array<{ clientName: string; revenue: number; orderCount: number }>;
  };
  alerts: {
    overdueInvoices: Array<any>;
  };
}

export default function FinanceDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchMetrics();
    }
  }, [status, router]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/metrics?metric=finance-dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch finance metrics');
      }

      const data = await response.json();
      setMetrics(data.result);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Failed to load finance dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading Finance Dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} p={8}>
        <Container maxW="container.xl">
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button mt={4} onClick={fetchMetrics}>Retry</Button>
        </Container>
      </Box>
    );
  }

  if (!metrics) {
    return null;
  }

  const kpiCards = [
    {
      label: 'Total Revenue (Paid)',
      value: `₹${metrics.kpis.paidRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FiDollarSign,
      color: 'green',
      helpText: 'Total paid invoices',
      trend: 'up',
    },
    {
      label: 'Outstanding Amount',
      value: `₹${metrics.kpis.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FiClock,
      color: 'orange',
      helpText: `${metrics.kpis.pendingInvoicesCount} pending invoices`,
      trend: null,
    },
    {
      label: 'Overdue Invoices',
      value: metrics.kpis.overdueInvoices.toString(),
      icon: FiAlertCircle,
      color: 'red',
      helpText: `₹${metrics.kpis.overdueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} overdue`,
      trend: 'down',
    },
    {
      label: 'Pending Quotations',
      value: metrics.kpis.pendingQuotations.toString(),
      icon: FiFileText,
      color: 'blue',
      helpText: 'Not yet converted',
      trend: null,
    },
    {
      label: 'Pending Orders',
      value: metrics.kpis.pendingOrders.toString(),
      icon: FiShoppingCart,
      color: 'purple',
      helpText: 'Not yet invoiced',
      trend: null,
    },
    {
      label: 'Total Invoices',
      value: metrics.kpis.totalInvoices.toString(),
      icon: FiCheckCircle,
      color: 'teal',
      helpText: 'All time invoices',
      trend: null,
    },
  ];

  // Prepare revenue trend data
  const revenueTrendData = metrics.charts.revenueTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
  }));

  // Prepare top clients data
  const topClientsData = metrics.charts.topClients.map(client => ({
    name: client.clientName.length > 20 ? client.clientName.substring(0, 20) + '...' : client.clientName,
    revenue: client.revenue,
    orders: client.orderCount,
  }));

  // Payment status distribution
  const paymentStatusData = [
    { name: 'Paid', value: metrics.kpis.paidRevenue, color: '#48BB78' },
    { name: 'Pending', value: metrics.kpis.outstandingAmount, color: '#ED8936' },
    { name: 'Overdue', value: metrics.kpis.overdueAmount, color: '#F56565' },
  ];

  const COLORS = ['#48BB78', '#ED8936', '#F56565'];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Finance Dashboard</Heading>
              <Text color="gray.500">Real-time business intelligence and financial metrics</Text>
            </VStack>
            <Button
              leftIcon={<Icon as={FiTrendingUp} />}
              colorScheme="blue"
              onClick={fetchMetrics}
              size="sm"
            >
              Refresh
            </Button>
          </Flex>

          {/* KPI Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {kpiCards.map((kpi, index) => (
              <GridItem key={index}>
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                  <CardBody>
                    <Stat>
                      <HStack justify="space-between" mb={2}>
                        <StatLabel fontSize="sm" color="gray.500">
                          {kpi.label}
                        </StatLabel>
                        <Icon as={kpi.icon} boxSize={5} color={`${kpi.color}.500`} />
                      </HStack>
                      <StatNumber fontSize="2xl" color={`${kpi.color}.600`}>
                        {kpi.value}
                      </StatNumber>
                      <StatHelpText fontSize="xs" mb={0}>
                        {kpi.trend && <StatArrow type={kpi.trend as any} />}
                        {kpi.helpText}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>

          {/* Charts Row */}
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            {/* Revenue Trend Chart */}
            <GridItem>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={2}>
                  <Heading size="md">Revenue Trend (Last 30 Days)</Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Daily revenue from invoices
                  </Text>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value: number) => [
                          `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                          'Revenue',
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3182CE"
                        strokeWidth={2}
                        dot={{ fill: '#3182CE', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            </GridItem>

            {/* Payment Status Distribution */}
            <GridItem>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={2}>
                  <Heading size="md">Payment Status Distribution</Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Breakdown of invoice payments
                  </Text>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                          'Amount',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Top Clients Chart */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
            <CardHeader pb={2}>
              <Heading size="md">Top 5 Clients by Revenue (This Month)</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Highest revenue generating clients
              </Text>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClientsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') {
                        return [`₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue'];
                      }
                      return [value, 'Orders'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#48BB78" name="Revenue (₹)" />
                  <Bar dataKey="orders" fill="#4299E1" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Overdue Invoices Alert */}
          {metrics.alerts.overdueInvoices.length > 0 && (
            <Card bg={cardBg} borderWidth="1px" borderColor="red.200" shadow="sm">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={FiAlertCircle} color="red.500" boxSize={5} />
                  <Heading size="md" color="red.600">
                    Overdue Invoices ({metrics.alerts.overdueInvoices.length})
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Invoices past their due date - immediate action required
                </Text>
              </CardHeader>
              <CardBody>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Invoice Number</Th>
                        <Th>Client</Th>
                        <Th>Due Date</Th>
                        <Th isNumeric>Amount</Th>
                        <Th isNumeric>Days Overdue</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {metrics.alerts.overdueInvoices.slice(0, 10).map((invoice, index) => (
                        <Tr key={index}>
                          <Td fontWeight="medium">{invoice.invoiceNumber}</Td>
                          <Td>{invoice.clientName}</Td>
                          <Td>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</Td>
                          <Td isNumeric>
                            ₹{invoice.totalAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme="red">{invoice.daysOverdue} days</Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme="red">{invoice.paymentStatus}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                {metrics.alerts.overdueInvoices.length > 10 && (
                  <Text fontSize="sm" color="gray.500" mt={3} textAlign="center">
                    Showing top 10 of {metrics.alerts.overdueInvoices.length} overdue invoices
                  </Text>
                )}
              </CardBody>
            </Card>
          )}

          {/* Success Message - No Overdue Invoices */}
          {metrics.alerts.overdueInvoices.length === 0 && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Excellent Payment Health!</AlertTitle>
                <AlertDescription>
                  You have no overdue invoices. All payments are on track.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            <GridItem>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiTrendingUp} color="green.500" boxSize={5} />
                    <Heading size="md">Business Health</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Collection Rate
                      </Text>
                      <Text fontWeight="bold" color="green.600">
                        {metrics.kpis.totalInvoices > 0
                          ? ((metrics.kpis.paidRevenue / (metrics.kpis.paidRevenue + metrics.kpis.outstandingAmount)) * 100).toFixed(1)
                          : '0'}%
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Outstanding Rate
                      </Text>
                      <Text fontWeight="bold" color="orange.600">
                        {metrics.kpis.totalInvoices > 0
                          ? ((metrics.kpis.outstandingAmount / (metrics.kpis.paidRevenue + metrics.kpis.outstandingAmount)) * 100).toFixed(1)
                          : '0'}%
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Overdue Rate
                      </Text>
                      <Text fontWeight="bold" color="red.600">
                        {metrics.kpis.totalInvoices > 0
                          ? ((metrics.kpis.overdueInvoices / metrics.kpis.totalInvoices) * 100).toFixed(1)
                          : '0'}%
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
                <CardHeader pb={2}>
                  <HStack>
                    <Icon as={FiUsers} color="blue.500" boxSize={5} />
                    <Heading size="md">Pipeline Status</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Quotations → Orders Conversion
                      </Text>
                      <Badge colorScheme="blue">{metrics.kpis.pendingQuotations} pending</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Orders → Invoices Conversion
                      </Text>
                      <Badge colorScheme="purple">{metrics.kpis.pendingOrders} pending</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Invoices → Payments Conversion
                      </Text>
                      <Badge colorScheme="orange">{metrics.kpis.pendingInvoicesCount} pending</Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Footer */}
          <Box textAlign="center" pt={4} pb={2}>
            <Text fontSize="xs" color="gray.500">
              Last updated: {new Date().toLocaleString('en-IN')}
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
