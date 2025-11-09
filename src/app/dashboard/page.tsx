'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  useDisclosure,
  IconButton,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
} from '@chakra-ui/react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiMenu, FiLogOut } from 'react-icons/fi';

export const dynamic = 'force-dynamic';

// Module configuration
const modules = [
  {
    name: 'Finance Dashboard',
    icon: '📊',
    description: 'Business intelligence & KPIs',
    color: 'cyan',
    path: '/dashboard/finance',
    isSpecial: true,
  },
  {
    name: 'Leads',
    icon: '📋',
    description: 'Manage potential customers',
    color: 'blue',
    path: '/modules/Leads',
  },
  {
    name: 'Clients',
    icon: '👤',
    description: 'Your active customers',
    color: 'green',
    path: '/modules/Clients',
  },
  {
    name: 'Quotations',
    icon: '📄',
    description: 'Create and send quotes',
    color: 'purple',
    path: '/modules/Quotations',
  },
  {
    name: 'Orders',
    icon: '📦',
    description: 'Track customer orders',
    color: 'orange',
    path: '/modules/Orders',
  },
  {
    name: 'Invoices',
    icon: '🧾',
    description: 'Billing and invoices',
    color: 'red',
    path: '/modules/Invoices',
  },
  {
    name: 'Payments',
    icon: '💰',
    description: 'Track payments received',
    color: 'teal',
    path: '/modules/Payments',
  },
];

interface ModuleStats {
  [key: string]: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState<ModuleStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      loadStats();
    }
  }, [status, router]);

  const loadStats = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const statsData: ModuleStats = {};
      
      // Load record counts for each module (skip special modules like Finance Dashboard)
      for (const module of modules) {
        if (module.isSpecial) {
          statsData[module.name] = 0; // Special modules don't have record counts
          continue;
        }
        
        try {
          const response = await fetch(
            `/api/modules/${module.name}/records?tenantId=${session.user.tenantId}`
          );
          if (response.ok) {
            const data = await response.json();
            statsData[module.name] = data.records?.length || 0;
          }
        } catch (error) {
          console.error(`Error loading ${module.name}:`, error);
          statsData[module.name] = 0;
        }
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  const SidebarContent = () => (
    <VStack align="stretch" spacing={1} p={4} h="full">
      {/* Logo */}
      <Box mb={6} mt={2}>
        <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, blue.500, purple.600)" bgClip="text">
          💼 Easy2Work
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1}>
          Workflow Platform
        </Text>
      </Box>

      {/* Navigation */}
      <VStack align="stretch" spacing={1} flex={1}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} mb={2}>
          MODULES
        </Text>
        {modules.map((module) => (
          <Button
            key={module.name}
            variant="ghost"
            justifyContent="start"
            leftIcon={<Text fontSize="lg">{module.icon}</Text>}
            rightIcon={
              <Badge colorScheme={module.color} borderRadius="full" px={2}>
                {stats[module.name] || 0}
              </Badge>
            }
            onClick={() => router.push(module.path)}
            _hover={{ bg: `${module.color}.50` }}
          >
            {module.name}
          </Button>
        ))}
      </VStack>

      {/* User Menu at Bottom */}
      <Box borderTopWidth={1} pt={4}>
        <HStack spacing={3}>
          <Avatar size="sm" name={session?.user?.name || ''} bg="blue.500" />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="600">
              {session?.user?.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {session?.user?.email}
            </Text>
          </VStack>
          <IconButton
            aria-label="Logout"
            icon={<Icon as={FiLogOut} />}
            size="sm"
            variant="ghost"
            onClick={handleLogout}
          />
        </HStack>
      </Box>
    </VStack>
  );

  if (status === 'loading' || loading) {
    return (
      <Flex h="100vh" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Heading size="lg">Loading...</Heading>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Mobile Sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerContent>
          <SidebarContent />
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        left={0}
        top={0}
        w="280px"
        h="100vh"
        bg="white"
        borderRightWidth={1}
        borderColor="gray.200"
        overflow="auto"
      >
        <SidebarContent />
      </Box>

      {/* Main Content */}
      <Box ml={{ base: 0, md: '280px' }} transition="margin-left 0.3s">
        {/* Mobile Header */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          px={4}
          py={3}
          alignItems="center"
          bg="white"
          borderBottomWidth={1}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <IconButton
            aria-label="Open menu"
            icon={<Icon as={FiMenu} />}
            onClick={onOpen}
            variant="ghost"
            mr={2}
          />
          <Text fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, blue.500, purple.600)" bgClip="text">
            💼 Easy2Work
          </Text>
        </Flex>

        {/* Dashboard Content */}
        <Container maxW="full" p={8}>
          <VStack align="stretch" spacing={8}>
            {/* Welcome Header */}
            <Box>
              <Heading as="h1" size="xl" mb={2}>
                Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Manage your sales pipeline from lead to payment
              </Text>
            </Box>

            {/* Quick Stats */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={4}>
              {modules.map((module) => (
                <GridItem
                  key={module.name}
                  p={5}
                  bg="white"
                  borderRadius="xl"
                  shadow="sm"
                  borderWidth={1}
                  cursor="pointer"
                  onClick={() => router.push(module.path)}
                  _hover={{
                    shadow: 'md',
                    transform: 'translateY(-2px)',
                    borderColor: `${module.color}.300`,
                  }}
                  transition="all 0.2s"
                >
                  <VStack spacing={3}>
                    <Text fontSize="3xl">{module.icon}</Text>
                    <VStack spacing={0}>
                      {!module.isSpecial && (
                        <Text fontSize="2xl" fontWeight="bold" color={`${module.color}.600`}>
                          {stats[module.name] || 0}
                        </Text>
                      )}
                      <Text fontSize="sm" fontWeight="500" color="gray.600" textAlign="center">
                        {module.name}
                      </Text>
                    </VStack>
                  </VStack>
                </GridItem>
              ))}
            </Grid>

            {/* Module Cards */}
            <Box>
              <Heading size="md" mb={4}>
                Quick Access
              </Heading>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                {modules.map((module) => (
                  <GridItem
                    key={module.name}
                    p={6}
                    bg="white"
                    borderRadius="xl"
                    shadow="sm"
                    borderWidth={1}
                    cursor="pointer"
                    onClick={() => router.push(module.path)}
                    _hover={{
                      shadow: 'lg',
                      transform: 'translateY(-4px)',
                      borderColor: `${module.color}.300`,
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        bg={`${module.color}.50`}
                        borderRadius="lg"
                        fontSize="2xl"
                      >
                        {module.icon}
                      </Box>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" fontSize="lg">
                          {module.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {module.description}
                        </Text>
                      </VStack>
                      <Badge colorScheme={module.color} fontSize="md" px={3} py={1} borderRadius="full">
                        {stats[module.name] || 0}
                      </Badge>
                    </HStack>
                  </GridItem>
                ))}
              </Grid>
            </Box>

            {/* Pipeline Flow */}
            <Box p={6} bg="white" borderRadius="xl" shadow="sm" borderWidth={1}>
              <Heading size="md" mb={4}>
                Sales Pipeline Flow
              </Heading>
              <HStack spacing={2} flexWrap="wrap" justify="center">
                {modules.map((module, index) => (
                  <HStack key={module.name} spacing={2}>
                    <Box
                      px={4}
                      py={2}
                      bg={`${module.color}.50`}
                      borderRadius="lg"
                      borderWidth={2}
                      borderColor={`${module.color}.200`}
                    >
                      <HStack>
                        <Text fontSize="lg">{module.icon}</Text>
                        <Text fontWeight="600" color={`${module.color}.700`}>
                          {module.name}
                        </Text>
                      </HStack>
                    </Box>
                    {index < modules.length - 1 && (
                      <Text fontSize="2xl" color="gray.400">
                        →
                      </Text>
                    )}
                  </HStack>
                ))}
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
