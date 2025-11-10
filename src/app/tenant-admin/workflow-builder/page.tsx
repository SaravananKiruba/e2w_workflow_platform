'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  HStack,
  VStack,
  Button,
  IconButton,
  Select,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Text,
  Divider,
} from '@chakra-ui/react';
import {
  FiSave,
  FiPlay,
  FiPlus,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiSettings,
} from 'react-icons/fi';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Components
import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import WorkflowTestPanel from '@/components/admin/WorkflowTestPanel';

// Node types configuration for React Flow
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

export default function WorkflowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTestOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure();
  const toast = useToast();

  // Fetch modules and workflows
  useEffect(() => {
    fetchModules();
    fetchWorkflows();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      const data = await res.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        config: {},
        moduleName: selectedModule,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} node added`,
      status: 'success',
      duration: 2000,
    });
  };

  const saveWorkflow = async () => {
    if (!workflowName || !selectedModule) {
      toast({
        title: 'Missing information',
        description: 'Please provide workflow name and select a module',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Convert React Flow graph to workflow JSON
      const triggerNode = nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        toast({
          title: 'Missing trigger',
          description: 'Workflow must have a trigger node',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const conditionNodes = nodes.filter((n) => n.type === 'condition');
      const actionNodes = nodes.filter((n) => n.type === 'action');

      const workflowData = {
        name: workflowName,
        moduleName: selectedModule,
        trigger: triggerNode.data.config || { type: 'onCreate' },
        conditions: conditionNodes.length > 0 ? {
          operator: 'AND',
          rules: conditionNodes.map((n) => n.data.config || {}).filter((c) => c.field),
        } : undefined,
        actions: actionNodes.map((n) => ({
          type: n.data.config?.type || 'notification',
          config: n.data.config || {},
        })),
        priority: 0,
      };

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (res.ok) {
        toast({
          title: 'Workflow saved successfully',
          status: 'success',
          duration: 3000,
        });
        fetchWorkflows();
      } else {
        const error = await res.json();
        toast({
          title: 'Failed to save workflow',
          description: error.error || 'Unknown error',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error saving workflow',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const loadWorkflow = async (workflowId: string) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    setWorkflowName(workflow.name);
    setSelectedModule(workflow.moduleName);
    setSelectedWorkflow(workflowId);

    // Parse workflow JSON and convert to React Flow nodes
    const parsedTrigger = typeof workflow.trigger === 'string' 
      ? JSON.parse(workflow.trigger) 
      : workflow.trigger;
    
    const parsedActions = typeof workflow.actions === 'string'
      ? JSON.parse(workflow.actions)
      : workflow.actions;

    const newNodes: Node[] = [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Trigger',
          config: parsedTrigger,
          moduleName: workflow.moduleName,
        },
      },
    ];

    let yOffset = 100;
    parsedActions.forEach((action: any, idx: number) => {
      yOffset += 150;
      newNodes.push({
        id: `action-${idx + 1}`,
        type: 'action',
        position: { x: 100, y: yOffset },
        data: {
          label: action.type,
          config: action,
          moduleName: workflow.moduleName,
        },
      });
    });

    setNodes(newNodes);
    setEdges([]);

    toast({
      title: 'Workflow loaded',
      status: 'success',
      duration: 2000,
    });
  };

  const testWorkflow = () => {
    if (!selectedWorkflow && !workflowName) {
      toast({
        title: 'Save workflow first',
        description: 'Please save the workflow before testing',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    onTestOpen();
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName('');
    setSelectedWorkflow(null);
    toast({
      title: 'Canvas cleared',
      status: 'info',
      duration: 2000,
    });
  };

  return (
    <Container maxW="100vw" h="calc(100vh - 64px)" p={0}>
      <VStack h="100%" spacing={0}>
        {/* Header */}
        <Box w="100%" bg="white" borderBottom="1px" borderColor="gray.200" p={4}>
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Heading size="md">Workflow Builder</Heading>
              <Badge colorScheme="purple">Visual Designer</Badge>
            </HStack>

            <HStack spacing={2}>
              <FormControl w="200px">
                <Input
                  placeholder="Workflow Name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  size="sm"
                />
              </FormControl>

              <FormControl w="200px">
                <Select
                  placeholder="Select Module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  size="sm"
                >
                  {modules.map((m) => (
                    <option key={m.moduleName} value={m.moduleName}>
                      {m.displayName}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Button
                leftIcon={<FiSettings />}
                size="sm"
                onClick={onOpen}
                variant="outline"
              >
                Load
              </Button>
              <Button
                leftIcon={<FiPlay />}
                size="sm"
                onClick={testWorkflow}
                colorScheme="orange"
              >
                Test
              </Button>
              <Button
                leftIcon={<FiSave />}
                size="sm"
                onClick={saveWorkflow}
                colorScheme="blue"
              >
                Save
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Toolbar */}
        <Box w="100%" bg="gray.50" borderBottom="1px" borderColor="gray.200" p={2}>
          <HStack spacing={2} justify="center">
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={() => addNode('trigger')}
              colorScheme="green"
              variant="outline"
              isDisabled={nodes.some((n) => n.type === 'trigger')}
            >
              Add Trigger
            </Button>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={() => addNode('condition')}
              colorScheme="yellow"
              variant="outline"
            >
              Add Condition
            </Button>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={() => addNode('action')}
              colorScheme="purple"
              variant="outline"
            >
              Add Action
            </Button>
            <Divider orientation="vertical" h="24px" />
            <Button size="sm" onClick={clearCanvas} variant="ghost" colorScheme="red">
              Clear Canvas
            </Button>
          </HStack>
        </Box>

        {/* Canvas */}
        <Box w="100%" flex={1} bg="gray.100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>
      </VStack>

      {/* Load Workflow Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Load Workflow</DrawerHeader>
          <DrawerBody>
            <VStack spacing={3} align="stretch">
              {workflows.map((workflow) => (
                <Box
                  key={workflow.id}
                  p={4}
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => {
                    loadWorkflow(workflow.id);
                    onClose();
                  }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{workflow.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {workflow.moduleName}
                      </Text>
                    </VStack>
                    <Badge colorScheme={workflow.isActive ? 'green' : 'gray'}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Test Workflow Drawer */}
      <Drawer isOpen={isTestOpen} placement="right" onClose={onTestClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Test Workflow</DrawerHeader>
          <DrawerBody>
            <WorkflowTestPanel
              workflowId={selectedWorkflow || undefined}
              workflow={selectedWorkflow ? workflows.find((w) => w.id === selectedWorkflow) : undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Container>
  );
}
