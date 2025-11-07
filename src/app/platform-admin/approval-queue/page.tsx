'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Code,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiEye, FiClock } from 'react-icons/fi';
import AppLayout from '@/components/layout/AppLayout';

export default function ApprovalQueuePage() {
  const [pendingConfigs, setPendingConfigs] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchPendingConfigs();
  }, []);

  const fetchPendingConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approval-queue');
      const data = await res.json();
      setPendingConfigs(data.configs || []);
    } catch (error: any) {
      toast({
        title: 'Error loading approvals',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const viewConfig = (config: any) => {
    setSelectedConfig(config);
    setComment('');
    onOpen();
  };

  const handleApprove = async () => {
    if (!selectedConfig) return;

    try {
      const res = await fetch(`/api/admin/configs/${selectedConfig.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      if (res.ok) {
        toast({
          title: 'Configuration approved',
          status: 'success',
          duration: 3000,
        });
        fetchPendingConfigs();
        onClose();
      } else {
        const error = await res.json();
        toast({
          title: 'Approval failed',
          description: error.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error approving configuration',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleReject = async () => {
    if (!selectedConfig) return;

    if (!comment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please provide a reason for rejection',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const res = await fetch(`/api/admin/configs/${selectedConfig.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      if (res.ok) {
        toast({
          title: 'Configuration rejected',
          status: 'success',
          duration: 3000,
        });
        fetchPendingConfigs();
        onClose();
      } else {
        const error = await res.json();
        toast({
          title: 'Rejection failed',
          description: error.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error rejecting configuration',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const parsedFields = (config: any) => {
    try {
      return typeof config.fields === 'string' ? JSON.parse(config.fields) : config.fields;
    } catch {
      return [];
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Approval Queue</Heading>
            <Text color="gray.600">
              Review and approve configuration changes from tenants
            </Text>
          </VStack>
          <HStack>
            <Badge colorScheme="orange" fontSize="lg" px={3} py={1}>
              {pendingConfigs.length} Pending
            </Badge>
            <Button onClick={fetchPendingConfigs} size="sm">
              Refresh
            </Button>
          </HStack>
        </HStack>

        {/* Pending Configurations Table */}
        <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" overflow="hidden">
          {loading ? (
            <Box p={8} textAlign="center">
              <Text>Loading...</Text>
            </Box>
          ) : pendingConfigs.length === 0 ? (
            <Box p={8} textAlign="center">
              <Icon as={FiCheck} boxSize={12} color="green.500" mb={2} />
              <Text fontSize="lg" fontWeight="bold">All caught up!</Text>
              <Text color="gray.600">No pending approvals at the moment</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Module</Th>
                  <Th>Tenant</Th>
                  <Th>Version</Th>
                  <Th>Submitted</Th>
                  <Th>Submitted By</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingConfigs.map((config) => (
                  <Tr key={config.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{config.displayName}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {config.moduleName}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text>{config.tenant?.name || 'Unknown'}</Text>
                    </Td>
                    <Td>
                      <Badge>v{config.version}</Badge>
                    </Td>
                    <Td fontSize="sm">
                      {new Date(config.updatedAt).toLocaleString()}
                    </Td>
                    <Td fontSize="sm">{config.createdBy || 'N/A'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<Icon as={FiEye} />}
                          onClick={() => viewConfig(config)}
                          colorScheme="blue"
                          variant="ghost"
                        >
                          Review
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      {/* Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Review Configuration Change
            <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
              {selectedConfig?.displayName} ({selectedConfig?.moduleName})
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Metadata */}
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Tenant
                  </Text>
                  <Text fontWeight="bold">{selectedConfig?.tenant?.name}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Version
                  </Text>
                  <Badge>v{selectedConfig?.version}</Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Submitted
                  </Text>
                  <Text fontSize="sm">
                    {selectedConfig?.updatedAt &&
                      new Date(selectedConfig.updatedAt).toLocaleString()}
                  </Text>
                </Box>
              </HStack>

              <Divider />

              {/* Configuration Details */}
              <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                  <Tab>Fields ({parsedFields(selectedConfig).length})</Tab>
                  <Tab>Layouts</Tab>
                  <Tab>Validations</Tab>
                  <Tab>Raw JSON</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
                      {parsedFields(selectedConfig).map((field: any, idx: number) => (
                        <Box
                          key={idx}
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                          border="1px"
                          borderColor="gray.200"
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">{field.label}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {field.name} ({field.type})
                              </Text>
                            </VStack>
                            <Badge colorScheme={field.required ? 'red' : 'gray'}>
                              {field.required ? 'Required' : 'Optional'}
                            </Badge>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </TabPanel>

                  <TabPanel>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={3}
                      fontSize="sm"
                      maxH="300px"
                      overflowY="auto"
                    >
                      {selectedConfig?.layouts || 'No layout configuration'}
                    </Code>
                  </TabPanel>

                  <TabPanel>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={3}
                      fontSize="sm"
                      maxH="300px"
                      overflowY="auto"
                    >
                      {selectedConfig?.validations || 'No validation rules'}
                    </Code>
                  </TabPanel>

                  <TabPanel>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={3}
                      fontSize="sm"
                      maxH="300px"
                      overflowY="auto"
                    >
                      {JSON.stringify(selectedConfig, null, 2)}
                    </Code>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Divider />

              {/* Comment Section */}
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Comment (Optional for approval, required for rejection)
                </Text>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your feedback or reason for decision..."
                  rows={4}
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                leftIcon={<Icon as={FiX} />}
                colorScheme="red"
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button
                leftIcon={<Icon as={FiCheck} />}
                colorScheme="green"
                onClick={handleApprove}
              >
                Approve
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
