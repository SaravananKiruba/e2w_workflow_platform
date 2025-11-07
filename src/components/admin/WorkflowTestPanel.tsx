'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';

interface WorkflowTestPanelProps {
  workflowId?: string;
  workflow?: any;
}

export default function WorkflowTestPanel({ workflowId, workflow }: WorkflowTestPanelProps) {
  const [testData, setTestData] = useState('{\n  "status": "new",\n  "amount": 1000\n}');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const toast = useToast();

  const runTest = async () => {
    if (!workflow && !workflowId) {
      toast({
        title: 'No workflow selected',
        description: 'Please save the workflow first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsRunning(true);
    setTestResult(null);

    try {
      // Parse test data
      const parsedData = JSON.parse(testData);

      // Simulate workflow execution
      const result = await fetch('/api/workflows/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflowId || workflow?.id,
          testData: parsedData,
        }),
      });

      const response = await result.json();

      setTestResult(response);

      // Add to execution history
      setExecutionHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          status: response.success ? 'success' : 'failed',
          input: parsedData,
          output: response,
        },
        ...prev,
      ]);

      toast({
        title: response.success ? 'Test completed' : 'Test failed',
        description: response.message || 'Check results below',
        status: response.success ? 'success' : 'error',
        duration: 3000,
      });
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message,
        message: 'Failed to execute test',
      };

      setTestResult(errorResult);

      toast({
        title: 'Test execution failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'failed':
        return <Icon as={FiXCircle} color="red.500" />;
      case 'running':
        return <Spinner size="sm" color="blue.500" />;
      default:
        return <Icon as={FiClock} color="gray.500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      success: 'green',
      failed: 'red',
      running: 'blue',
    };

    return (
      <Badge colorScheme={colorMap[status] || 'gray'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <VStack spacing={4} align="stretch" p={4} bg="gray.50" borderRadius="md">
      {/* Test Input */}
      <Box>
        <Text fontWeight="bold" mb={2}>
          Test Input Data (JSON)
        </Text>
        <Textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          placeholder='{"field1": "value1", "field2": "value2"}'
          fontFamily="monospace"
          fontSize="sm"
          rows={6}
          bg="white"
        />
        <Text fontSize="xs" color="gray.600" mt={1}>
          Provide sample record data to test the workflow
        </Text>
      </Box>

      {/* Run Test Button */}
      <Button
        leftIcon={isRunning ? <Spinner size="sm" /> : <Icon as={FiPlay} />}
        colorScheme="blue"
        onClick={runTest}
        isLoading={isRunning}
        loadingText="Running test..."
      >
        Run Test
      </Button>

      <Divider />

      {/* Test Results */}
      {testResult && (
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold">Test Result</Text>
            {getStatusBadge(testResult.success ? 'success' : 'failed')}
          </HStack>

          <VStack align="stretch" spacing={3}>
            {/* Trigger Evaluation */}
            <Box p={3} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
              <HStack justify="space-between">
                <HStack>
                  {getStatusIcon(testResult.triggerMatched ? 'success' : 'failed')}
                  <Text fontWeight="bold" fontSize="sm">
                    Trigger Evaluation
                  </Text>
                </HStack>
                {testResult.triggerMatched ? (
                  <Badge colorScheme="green">PASSED</Badge>
                ) : (
                  <Badge colorScheme="red">FAILED</Badge>
                )}
              </HStack>
              {testResult.triggerDetails && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {testResult.triggerDetails}
                </Text>
              )}
            </Box>

            {/* Conditions Evaluation */}
            {testResult.conditionsResult !== undefined && (
              <Box p={3} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
                <HStack justify="space-between">
                  <HStack>
                    {getStatusIcon(testResult.conditionsResult ? 'success' : 'failed')}
                    <Text fontWeight="bold" fontSize="sm">
                      Conditions Check
                    </Text>
                  </HStack>
                  {testResult.conditionsResult ? (
                    <Badge colorScheme="green">PASSED</Badge>
                  ) : (
                    <Badge colorScheme="red">FAILED</Badge>
                  )}
                </HStack>
                {testResult.conditionsDetails && (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    {testResult.conditionsDetails}
                  </Text>
                )}
              </Box>
            )}

            {/* Actions Execution */}
            {testResult.actions && testResult.actions.length > 0 && (
              <Box p={3} bg="white" borderRadius="md" border="1px" borderColor="gray.200">
                <Text fontWeight="bold" fontSize="sm" mb={2}>
                  Actions Executed ({testResult.actions.length})
                </Text>
                <VStack align="stretch" spacing={2}>
                  {testResult.actions.map((action: any, idx: number) => (
                    <Box
                      key={idx}
                      p={2}
                      bg="gray.50"
                      borderRadius="sm"
                      border="1px"
                      borderColor="gray.200"
                    >
                      <HStack justify="space-between">
                        <HStack>
                          {getStatusIcon(action.success ? 'success' : 'failed')}
                          <Text fontSize="sm">{action.type || `Action ${idx + 1}`}</Text>
                        </HStack>
                        {getStatusBadge(action.success ? 'success' : 'failed')}
                      </HStack>
                      {action.result && (
                        <Code fontSize="xs" mt={1} display="block" p={1}>
                          {JSON.stringify(action.result, null, 2)}
                        </Code>
                      )}
                      {action.error && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          Error: {action.error}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Error Details */}
            {testResult.error && (
              <Box p={3} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                <HStack mb={1}>
                  <Icon as={FiAlertCircle} color="red.500" />
                  <Text fontWeight="bold" fontSize="sm" color="red.700">
                    Error Details
                  </Text>
                </HStack>
                <Code fontSize="xs" display="block" p={2} bg="white">
                  {testResult.error}
                </Code>
              </Box>
            )}

            {/* Full Response */}
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton bg="gray.100" borderRadius="md">
                  <Box flex="1" textAlign="left" fontSize="sm">
                    View Full Response
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    fontSize="xs"
                    p={3}
                    overflowX="auto"
                  >
                    {JSON.stringify(testResult, null, 2)}
                  </Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </Box>
      )}

      <Divider />

      {/* Execution History */}
      <Box>
        <Text fontWeight="bold" mb={2}>
          Execution History ({executionHistory.length})
        </Text>
        {executionHistory.length > 0 ? (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Timestamp</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {executionHistory.slice(0, 10).map((exec) => (
                  <Tr key={exec.id}>
                    <Td fontSize="xs">
                      {new Date(exec.timestamp).toLocaleString()}
                    </Td>
                    <Td>{getStatusBadge(exec.status)}</Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setTestResult(exec.output)}
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.500">
            No test executions yet
          </Text>
        )}
      </Box>
    </VStack>
  );
}
