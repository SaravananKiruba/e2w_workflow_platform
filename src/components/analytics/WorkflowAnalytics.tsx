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
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
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
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';

interface WorkflowAnalyticsProps {
  workflowName: string;
  tenantId: string;
}

export default function WorkflowAnalytics({ workflowName, tenantId }: WorkflowAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchAnalytics();
  }, [workflowName, tenantId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `/api/analytics/workflow/${workflowName}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <Spinner size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!analytics) {
    return null;
  }

  // Sales Workflow Analytics
  if (workflowName === 'Sales') {
    const { pipeline, conversionRates, revenue, invoices, topClients } = analytics;

    // Prepare funnel data
    const funnelData = [
      { name: 'Leads', value: pipeline.leads, fill: '#8884D8' },
      { name: 'Clients', value: pipeline.clients, fill: '#83A6ED' },
      { name: 'Quotations', value: pipeline.quotations, fill: '#8DD1E1' },
      { name: 'Orders', value: pipeline.orders, fill: '#82CA9D' },
      { name: 'Invoices', value: pipeline.invoices, fill: '#A4DE6C' },
      { name: 'Payments', value: pipeline.payments, fill: '#D0ED57' },
    ];

    // Prepare invoice status pie chart
    const invoiceStatusData = Object.entries(invoices.statusBreakdown || {}).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    return (
      <Container maxW="container.xl" py={8}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Sales Analytics</Heading>
            <Text color="gray.600">
              Overview of your sales pipeline from leads to payments
            </Text>
          </Box>

          {/* KPI Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Revenue</StatLabel>
                  <StatNumber>₹{revenue.total.toLocaleString()}</StatNumber>
                  <StatHelpText>Last 30 days</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Lead → Client</StatLabel>
                  <StatNumber>{conversionRates.leadToClient}%</StatNumber>
                  <StatHelpText>Conversion Rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Quote → Order</StatLabel>
                  <StatNumber>{conversionRates.quotationToOrder}%</StatNumber>
                  <StatHelpText>Conversion Rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Outstanding</StatLabel>
                  <StatNumber>₹{invoices.outstanding.toLocaleString()}</StatNumber>
                  <StatHelpText>Pending Invoices</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Sales Funnel */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Sales Pipeline Funnel</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Revenue Trend and Invoice Status */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Revenue Trend */}
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Revenue Trend</Heading>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884D8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Invoice Status</Heading>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884D8"
                      dataKey="value"
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Grid>

          {/* Top Clients */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Top Clients by Revenue</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClients}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="clientName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#82CA9D" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // Purchase Workflow Analytics
  if (workflowName === 'Purchase') {
    const { pipeline, conversionRates, expenses, paymentStatus, topVendors } = analytics;

    // Prepare payment status pie chart
    const paymentStatusData = Object.entries(paymentStatus || {}).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    return (
      <Container maxW="container.xl" py={8}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Purchase Analytics</Heading>
            <Text color="gray.600">
              Overview of your procurement and expense management
            </Text>
          </Box>

          {/* KPI Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Expenses</StatLabel>
                  <StatNumber>₹{expenses.total.toLocaleString()}</StatNumber>
                  <StatHelpText>Last 30 days</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>PR → PO</StatLabel>
                  <StatNumber>{conversionRates.prToPO}%</StatNumber>
                  <StatHelpText>Conversion Rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>PO → GRN</StatLabel>
                  <StatNumber>{conversionRates.poToGRN}%</StatNumber>
                  <StatHelpText>Conversion Rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Pending Payments</StatLabel>
                  <StatNumber>₹{expenses.pending.toLocaleString()}</StatNumber>
                  <StatHelpText>Outstanding</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Pipeline Counts */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Purchase Pipeline</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={4} justify="space-around" flexWrap="wrap">
                <VStack>
                  <Badge colorScheme="blue" fontSize="2xl" p={3}>{pipeline.vendors}</Badge>
                  <Text fontSize="sm">Vendors</Text>
                </VStack>
                <VStack>
                  <Badge colorScheme="purple" fontSize="2xl" p={3}>{pipeline.purchaseRequests}</Badge>
                  <Text fontSize="sm">Purchase Requests</Text>
                </VStack>
                <VStack>
                  <Badge colorScheme="green" fontSize="2xl" p={3}>{pipeline.purchaseOrders}</Badge>
                  <Text fontSize="sm">Purchase Orders</Text>
                </VStack>
                <VStack>
                  <Badge colorScheme="orange" fontSize="2xl" p={3}>{pipeline.grns}</Badge>
                  <Text fontSize="sm">GRNs</Text>
                </VStack>
                <VStack>
                  <Badge colorScheme="red" fontSize="2xl" p={3}>{pipeline.vendorBills}</Badge>
                  <Text fontSize="sm">Vendor Bills</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Expense Trend and Payment Status */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Expense Trend */}
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Expense Trend</Heading>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenses.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#FF8042" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Payment Status Breakdown */}
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Payment Status</Heading>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884D8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Grid>

          {/* Top Vendors */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Top Vendors by Spending</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVendors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendorName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spending" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // Custom Workflow Analytics (Generic)
  const { totalRecords, recordsByModule, growthTrend, statusBreakdown } = analytics;

  const statusData = Object.entries(statusBreakdown || {}).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>{workflowName} Analytics</Heading>
          <Text color="gray.600">
            Overview of your {workflowName.toLowerCase()} workflow
          </Text>
        </Box>

        {/* Total Records */}
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Records</StatLabel>
              <StatNumber>{totalRecords}</StatNumber>
              <StatHelpText>Last 30 days</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Records by Module */}
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Records by Module</Heading>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recordsByModule}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Growth Trend and Status Breakdown */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
          {/* Growth Trend */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Growth Trend</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#82CA9D" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Status Breakdown */}
          <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Status Distribution</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884D8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </Grid>
      </VStack>
    </Container>
  );
}
