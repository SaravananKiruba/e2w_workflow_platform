/**
 * Profit & Loss (P&L) Report Component
 * 
 * Displays automated P&L report with:
 * - Summary cards (Revenue, Expenses, Net Profit)
 * - Period selector
 * - Detailed breakdown tables
 * - Visual charts
 * 
 * EPIC 4.1: Auto P&L Report from existing data
 */

'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Flex,
  Input,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FiDownload, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';

interface PLReport {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenue: {
    total: number;
    count: number;
    breakdown: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    count: number;
    breakdown: Array<{
      id: string;
      date: string;
      type: string;
      description: string;
      amount: number;
    }>;
  };
  status: 'profit' | 'loss';
}

export default function PLReportPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const tenantId = session?.user?.tenantId;

  // Default to current month
  const now = new Date();
  const [fromDate, setFromDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadReport();
    }
  }, [tenantId, fromDate, toDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/pl?tenantId=${tenantId}&from=${fromDate}&to=${toDate}`,
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error('Failed to load P&L report');

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error loading P&L:', error);
      toast({
        title: 'Error',
        description: 'Failed to load P&L report',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleQuickPeriod = (period: 'current-month' | 'last-month' | 'quarter' | 'year') => {
    const now = new Date();
    let from = startOfMonth(now);
    let to = endOfMonth(now);

    switch (period) {
      case 'current-month':
        // Already set above
        break;
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        from = quarterStart;
        to = now;
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
    }

    setFromDate(format(from, 'yyyy-MM-dd'));
    setToDate(format(to, 'yyyy-MM-dd'));
  };

  if (loading || !report) {
    return (
      <AppLayout>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="primary.500" />
        </Flex>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container maxW="container.xl" py={6}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" color="primary.700" mb={2}>
              📈 Profit & Loss Report
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Automated P&L from invoices and expenses
            </Text>
          </Box>

          {/* Period Selector */}
          <Card bg="white" shadow="sm">
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack wrap="wrap" spacing={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1}>
                      From Date
                    </Text>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      size="sm"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1}>
                      To Date
                    </Text>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      size="sm"
                    />
                  </Box>
                  <Box pt={5}>
                    <Button size="sm" colorScheme="primary" onClick={loadReport}>
                      Generate Report
                    </Button>
                  </Box>
                </HStack>

                <HStack wrap="wrap" spacing={2}>
                  <Text fontSize="xs" color="gray.600">Quick Select:</Text>
                  <Button size="xs" variant="outline" onClick={() => handleQuickPeriod('current-month')}>
                    This Month
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleQuickPeriod('last-month')}>
                    Last Month
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleQuickPeriod('quarter')}>
                    This Quarter
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleQuickPeriod('year')}>
                    This Year
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Summary Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            {/* Revenue */}
            <GridItem>
              <Card bg="green.50" borderLeft="4px" borderColor="green.500">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.700" fontSize="sm">Total Revenue</StatLabel>
                    <StatNumber color="green.700" fontSize="2xl">
                      {formatCurrency(report.summary.totalRevenue)}
                    </StatNumber>
                    <StatHelpText color="gray.600">
                      {report.revenue.count} invoices
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            {/* Expenses */}
            <GridItem>
              <Card bg="red.50" borderLeft="4px" borderColor="red.500">
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.700" fontSize="sm">Total Expenses</StatLabel>
                    <StatNumber color="red.700" fontSize="2xl">
                      {formatCurrency(report.summary.totalExpenses)}
                    </StatNumber>
                    <StatHelpText color="gray.600">
                      {report.expenses.count} payments
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            {/* Net Profit */}
            <GridItem>
              <Card 
                bg={report.status === 'profit' ? 'blue.50' : 'orange.50'}
                borderLeft="4px" 
                borderColor={report.status === 'profit' ? 'blue.500' : 'orange.500'}
              >
                <CardBody>
                  <Stat>
                    <StatLabel color="gray.700" fontSize="sm">Net Profit/Loss</StatLabel>
                    <StatNumber 
                      color={report.status === 'profit' ? 'blue.700' : 'orange.700'} 
                      fontSize="2xl"
                    >
                      {formatCurrency(report.summary.netProfit)}
                    </StatNumber>
                    <StatHelpText color="gray.600">
                      {report.summary.profitMargin.toFixed(2)}% margin
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <Heading size="md" color="green.700">💰 Revenue Breakdown</Heading>
            </CardHeader>
            <CardBody>
              {report.revenue.breakdown.length > 0 ? (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Amount</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {report.revenue.breakdown.map((item) => (
                      <Tr key={item.id}>
                        <Td>{formatDate(item.date)}</Td>
                        <Td>{item.description}</Td>
                        <Td isNumeric fontWeight="semibold" color="green.600">
                          {formatCurrency(item.amount)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">No revenue in this period</Text>
              )}
            </CardBody>
          </Card>

          {/* Expenses Breakdown */}
          <Card>
            <CardHeader>
              <Heading size="md" color="red.700">💸 Expenses Breakdown</Heading>
            </CardHeader>
            <CardBody>
              {report.expenses.breakdown.length > 0 ? (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Amount</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {report.expenses.breakdown.map((item) => (
                      <Tr key={item.id}>
                        <Td>{formatDate(item.date)}</Td>
                        <Td>
                          <Badge colorScheme="orange" size="sm">
                            {item.type}
                          </Badge>
                        </Td>
                        <Td>{item.description}</Td>
                        <Td isNumeric fontWeight="semibold" color="red.600">
                          {formatCurrency(item.amount)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">No expenses in this period</Text>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </AppLayout>
  );
}
