/**
 * Module Analytics Sidebar Component
 * 
 * Displays key metrics for a module:
 * - Total count
 * - Current month stats
 * - Trends vs previous month
 * - Quick insights
 * 
 * EPIC 3.1: In-Module Analytics
 */

'use client';

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  Text,
  Spinner,
  Flex,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface ModuleAnalyticsSidebarProps {
  moduleName: string;
  tenantId: string;
}

interface AnalyticsData {
  moduleName: string;
  period: string;
  totalCount: number;
  currentPeriod: {
    count: number;
    total: number;
    startDate: string;
    endDate: string;
  };
  previousPeriod: {
    count: number;
    total: number;
    startDate: string;
    endDate: string;
  };
  trends: {
    countChange: number;
    amountChange: number;
  };
  isSalesModule: boolean;
  isPurchaseModule: boolean;
}

async function fetchModuleAnalytics(
  moduleName: string,
  tenantId: string
): Promise<AnalyticsData> {
  const response = await fetch(
    `/api/modules/${moduleName}/analytics?tenantId=${tenantId}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}

export default function ModuleAnalyticsSidebar({
  moduleName,
  tenantId,
}: ModuleAnalyticsSidebarProps) {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['module-analytics', moduleName, tenantId],
    queryFn: () => fetchModuleAnalytics(moduleName, tenantId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card bg="white" shadow="sm" h="full">
        <CardBody>
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="lg" color="primary.500" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card bg="white" shadow="sm">
        <CardBody>
          <Text color="red.500" fontSize="sm">
            Failed to load analytics
          </Text>
        </CardBody>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.abs(value).toFixed(1)}%`;
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Analytics Header */}
      <Card bg="white" shadow="sm">
        <CardHeader pb={2}>
          <Heading size="sm" color="gray.700">
            📊 Analytics
          </Heading>
        </CardHeader>
        <CardBody pt={2}>
          <VStack align="stretch" spacing={4}>
            {/* Total Count */}
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">
                Total Records
              </StatLabel>
              <StatNumber fontSize="2xl" color="primary.600">
                {analytics.totalCount.toLocaleString()}
              </StatNumber>
            </Stat>

            <Divider />

            {/* This Month */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={2}>
                This Month
              </Text>
              <VStack align="stretch" spacing={3}>
                <Stat>
                  <StatLabel fontSize="xs" color="gray.600">
                    New Records
                  </StatLabel>
                  <StatNumber fontSize="xl" color="gray.800">
                    {analytics.currentPeriod.count}
                  </StatNumber>
                  {analytics.trends.countChange !== 0 && (
                    <StatHelpText mb={0}>
                      <StatArrow
                        type={analytics.trends.countChange > 0 ? 'increase' : 'decrease'}
                      />
                      {formatPercentage(analytics.trends.countChange)}
                    </StatHelpText>
                  )}
                </Stat>

                {(analytics.isSalesModule || analytics.isPurchaseModule) && (
                  <Stat>
                    <StatLabel fontSize="xs" color="gray.600">
                      {analytics.isSalesModule ? 'Sales' : 'Expenses'}
                    </StatLabel>
                    <StatNumber fontSize="xl" color="gray.800">
                      {formatCurrency(analytics.currentPeriod.total)}
                    </StatNumber>
                    {analytics.trends.amountChange !== 0 && (
                      <StatHelpText mb={0}>
                        <StatArrow
                          type={analytics.trends.amountChange > 0 ? 'increase' : 'decrease'}
                        />
                        {formatPercentage(analytics.trends.amountChange)}
                      </StatHelpText>
                    )}
                  </Stat>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Last Month Comparison */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={2}>
                Last Month
              </Text>
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between">
                  <Text fontSize="xs" color="gray.600">
                    Records
                  </Text>
                  <Text fontSize="xs" fontWeight="semibold">
                    {analytics.previousPeriod.count}
                  </Text>
                </Flex>
                {(analytics.isSalesModule || analytics.isPurchaseModule) && (
                  <Flex justify="space-between">
                    <Text fontSize="xs" color="gray.600">
                      {analytics.isSalesModule ? 'Sales' : 'Expenses'}
                    </Text>
                    <Text fontSize="xs" fontWeight="semibold">
                      {formatCurrency(analytics.previousPeriod.total)}
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            {/* Quick Insight */}
            {analytics.trends.countChange > 0 && (
              <Badge colorScheme="green" fontSize="xs" py={1} px={2} borderRadius="md">
                <Flex align="center" gap={1}>
                  <FiTrendingUp />
                  <Text>Growing {formatPercentage(analytics.trends.countChange)}</Text>
                </Flex>
              </Badge>
            )}
            {analytics.trends.countChange < 0 && (
              <Badge colorScheme="red" fontSize="xs" py={1} px={2} borderRadius="md">
                <Flex align="center" gap={1}>
                  <FiTrendingDown />
                  <Text>Down {formatPercentage(analytics.trends.countChange)}</Text>
                </Flex>
              </Badge>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
