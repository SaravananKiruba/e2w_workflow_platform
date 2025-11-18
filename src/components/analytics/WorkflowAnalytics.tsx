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
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #434343 0%, #000000 100%)'
  );
  const accentColor = useColorModeValue('purple.500', 'purple.300');

  // Zoho-inspired color palette
  const COLORS = ['#5B2C6F', '#7F3F98', '#A066C1', '#C18EDA', '#E0B6F3', '#F0D9FF'];
  const CHART_COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#48bb78',
    warning: '#ed8936',
    danger: '#f56565',
    info: '#4299e1',
  };

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
        <VStack align="stretch" spacing={8}>
          {/* Header with Gradient */}
          <Box
            bgGradient={gradientBg}
            p={8}
            borderRadius="xl"
            color="white"
            boxShadow="2xl"
          >
            <Heading size="xl" mb={3} fontWeight="bold">
              📊 Sales Analytics Dashboard
            </Heading>
            <Text fontSize="lg" opacity={0.9}>
              Comprehensive overview of your sales pipeline from leads to payments
            </Text>
            <HStack mt={4} spacing={4}>
              <Badge colorScheme="green" fontSize="md" px={3} py={1} borderRadius="full">
                Last 30 Days
              </Badge>
              <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                Real-time Data
              </Badge>
            </HStack>
          </Box>

          {/* KPI Cards with Enhanced Design */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, green.400, green.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    💰 Total Revenue
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="green.600" mt={2}>
                    ₹{revenue.total.toLocaleString()}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    ↗ Last 30 days
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, purple.400, purple.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    🎯 Lead → Client
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600" mt={2}>
                    {conversionRates.leadToClient}%
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Conversion Rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, blue.400, blue.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    📝 Quote → Order
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="blue.600" mt={2}>
                    {conversionRates.quotationToOrder}%
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Conversion Rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, orange.400, orange.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    ⏱️ Outstanding
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="orange.600" mt={2}>
                    ₹{invoices.outstanding.toLocaleString()}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Pending Invoices
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Sales Funnel */}
          <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
            <CardHeader bg="gray.50" borderTopRadius="xl">
              <Heading size="md" color={accentColor}>
                📈 Sales Pipeline Funnel
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Track your conversion through each stage
              </Text>
            </CardHeader>
            <CardBody p={6}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#718096" />
                  <YAxis type="category" dataKey="name" width={120} stroke="#718096" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="url(#colorGradient)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Revenue Trend and Invoice Status */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Revenue Trend */}
            <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
              <CardHeader bg="gray.50" borderTopRadius="xl">
                <Heading size="md" color={accentColor}>
                  💹 Revenue Trend
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Daily revenue over the past 30 days
                </Text>
              </CardHeader>
              <CardBody p={6}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#48bb78" 
                      strokeWidth={3}
                      dot={{ fill: '#48bb78', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
              <CardHeader bg="gray.50" borderTopRadius="xl">
                <Heading size="md" color={accentColor}>
                  📄 Invoice Status
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Distribution of invoice statuses
                </Text>
              </CardHeader>
              <CardBody p={6}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      fill="#8884D8"
                      dataKey="value"
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Grid>

          {/* Top Clients */}
          <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
            <CardHeader bg="gray.50" borderTopRadius="xl">
              <Heading size="md" color={accentColor}>
                🏆 Top Clients by Revenue
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Your most valuable customers
              </Text>
            </CardHeader>
            <CardBody p={6}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClients}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="clientName" stroke="#718096" fontSize={12} />
                  <YAxis stroke="#718096" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
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
        <VStack align="stretch" spacing={8}>
          {/* Header with Gradient */}
          <Box
            bgGradient={gradientBg}
            p={8}
            borderRadius="xl"
            color="white"
            boxShadow="2xl"
          >
            <Heading size="xl" mb={3} fontWeight="bold">
              🛒 Purchase Analytics Dashboard
            </Heading>
            <Text fontSize="lg" opacity={0.9}>
              Comprehensive overview of your procurement and expense management
            </Text>
            <HStack mt={4} spacing={4}>
              <Badge colorScheme="orange" fontSize="md" px={3} py={1} borderRadius="full">
                Last 30 Days
              </Badge>
              <Badge colorScheme="cyan" fontSize="md" px={3} py={1} borderRadius="full">
                Live Tracking
              </Badge>
            </HStack>
          </Box>

          {/* KPI Cards with Enhanced Design */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, red.400, red.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    💸 Total Expenses
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="red.600" mt={2}>
                    ₹{expenses.total.toLocaleString()}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    ↗ Last 30 days
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, teal.400, teal.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    🎯 PR → PO
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="teal.600" mt={2}>
                    {conversionRates.prToPO}%
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Conversion Rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, cyan.400, cyan.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    📦 PO → GRN
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="cyan.600" mt={2}>
                    {conversionRates.poToGRN}%
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Conversion Rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="xl"
              boxShadow="lg"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(to-r, yellow.400, yellow.600)"
              />
              <CardBody pt={6}>
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                    ⏱️ Pending Payments
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="yellow.700" mt={2}>
                    ₹{expenses.pending.toLocaleString()}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mt={2}>
                    Outstanding
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Pipeline Counts */}
          <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
            <CardHeader bg="gray.50" borderTopRadius="xl">
              <Heading size="md" color={accentColor}>
                📊 Purchase Pipeline Overview
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Track records across procurement stages
              </Text>
            </CardHeader>
            <CardBody p={6}>
              <HStack spacing={6} justify="space-around" flexWrap="wrap">
                <VStack 
                  p={4} 
                  borderRadius="lg" 
                  bg="blue.50" 
                  minW="120px"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                >
                  <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                    {pipeline.vendors}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="blue.700">
                    👥 Vendors
                  </Text>
                </VStack>
                <VStack 
                  p={4} 
                  borderRadius="lg" 
                  bg="purple.50" 
                  minW="120px"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                >
                  <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                    {pipeline.purchaseRequests}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="purple.700">
                    📝 PRs
                  </Text>
                </VStack>
                <VStack 
                  p={4} 
                  borderRadius="lg" 
                  bg="green.50" 
                  minW="120px"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                >
                  <Text fontSize="3xl" fontWeight="bold" color="green.600">
                    {pipeline.purchaseOrders}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="green.700">
                    🛒 POs
                  </Text>
                </VStack>
                <VStack 
                  p={4} 
                  borderRadius="lg" 
                  bg="orange.50" 
                  minW="120px"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                >
                  <Text fontSize="3xl" fontWeight="bold" color="orange.600">
                    {pipeline.grns}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="orange.700">
                    📦 GRNs
                  </Text>
                </VStack>
                <VStack 
                  p={4} 
                  borderRadius="lg" 
                  bg="red.50" 
                  minW="120px"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                >
                  <Text fontSize="3xl" fontWeight="bold" color="red.600">
                    {pipeline.vendorBills}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="red.700">
                    📄 Bills
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Expense Trend and Payment Status */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {/* Expense Trend */}
            <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
              <CardHeader bg="gray.50" borderTopRadius="xl">
                <Heading size="md" color={accentColor}>
                  📉 Expense Trend
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Monthly expense tracking
                </Text>
              </CardHeader>
              <CardBody p={6}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={expenses.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#f56565" 
                      strokeWidth={3}
                      dot={{ fill: '#f56565', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Payment Status Breakdown */}
            <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
              <CardHeader bg="gray.50" borderTopRadius="xl">
                <Heading size="md" color={accentColor}>
                  💳 Payment Status
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Distribution of payment statuses
                </Text>
              </CardHeader>
              <CardBody p={6}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      fill="#8884D8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Grid>

          {/* Top Vendors */}
          <Card bg={cardBg} borderWidth={0} borderRadius="xl" boxShadow="xl">
            <CardHeader bg="gray.50" borderTopRadius="xl">
              <Heading size="md" color={accentColor}>
                🏢 Top Vendors by Spending
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Your most engaged suppliers
              </Text>
            </CardHeader>
            <CardBody p={6}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVendors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vendorName" stroke="#718096" fontSize={12} />
                  <YAxis stroke="#718096" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spending" fill="#f56565" radius={[8, 8, 0, 0]} />
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
