'use client';

import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  IconButton,
  VStack,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Icon,
  Button,
  Badge,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiGrid,
  FiBox,
  FiFileText,
  FiShoppingCart,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiLayers,
  FiGitBranch,
  FiCheckCircle,
  FiDatabase,
  FiSliders,
} from 'react-icons/fi';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  icon: any;
  href: string;
  badge?: string;
  roles?: string[]; // Which roles can see this item
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const role = session?.user?.role;

    // Platform Admin Navigation
    if (role === 'platform_admin') {
      return [
        { name: 'Platform Dashboard', icon: FiGrid, href: '/platform-admin/dashboard' },
        { name: 'All Tenants', icon: FiDatabase, href: '/platform-admin/tenants' },
        { name: 'Approval Queue', icon: FiCheckCircle, href: '/platform-admin/approval-queue', badge: '3' },
        { name: 'Platform Settings', icon: FiSliders, href: '/platform-admin/settings' },
      ];
    }

    // Tenant Admin Navigation
    if (role === 'admin') {
      return [
        { name: 'Dashboard', icon: FiHome, href: '/dashboard' },
        { name: 'Field Builder', icon: FiLayers, href: '/admin/field-builder' },
        { name: 'Workflow Builder', icon: FiGitBranch, href: '/admin/workflow-builder' },
        { name: 'Users & Teams', icon: FiUsers, href: '/admin/users' },
        { name: 'Settings', icon: FiSettings, href: '/admin/settings' },
        { name: 'Modules', icon: FiBox, href: '/dashboard', roles: ['admin'] },
      ];
    }

    // End User Navigation (default)
    return [
      { name: 'Dashboard', icon: FiHome, href: '/dashboard' },
      { name: 'Leads', icon: FiFileText, href: '/modules/Leads' },
      { name: 'Clients', icon: FiUsers, href: '/modules/Clients' },
      { name: 'Quotations', icon: FiFileText, href: '/modules/Quotations' },
      { name: 'Orders', icon: FiShoppingCart, href: '/modules/Orders' },
      { name: 'Invoices', icon: FiDollarSign, href: '/modules/Invoices' },
      { name: 'Payments', icon: FiCreditCard, href: '/modules/Payments' },
      { name: 'Finance Reports', icon: FiTrendingUp, href: '/dashboard/finance' },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  const SidebarContent = () => (
    <VStack
      h="full"
      w="240px"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      align="stretch"
      spacing={0}
    >
      {/* Logo Section */}
      <Box p={6} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <HStack spacing={2}>
          <Box fontSize="2xl">💼</Box>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              Easy2Work
            </Text>
            <Text fontSize="xs" color="gray.500">
              Workflow Platform
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation Links */}
      <VStack flex={1} align="stretch" spacing={1} p={3} overflowY="auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.name} label={item.name} placement="right">
              <Button
                onClick={() => router.push(item.href)}
                variant={isActive ? 'solid' : 'ghost'}
                colorScheme={isActive ? 'blue' : 'gray'}
                justifyContent="flex-start"
                leftIcon={<Icon as={item.icon} />}
                size="md"
                fontWeight={isActive ? 'bold' : 'normal'}
                position="relative"
              >
                <Text flex={1} textAlign="left" isTruncated>
                  {item.name}
                </Text>
                {item.badge && (
                  <Badge colorScheme="red" ml={2}>
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Tooltip>
          );
        })}
      </VStack>

      {/* User Profile Section */}
      <Box p={3} borderTop="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="full"
            h="auto"
            p={2}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={session?.user?.name || undefined} 
                src={session?.user?.image ?? undefined} 
              />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium" isTruncated maxW="140px">
                  {session?.user?.name}
                </Text>
                <Badge colorScheme="purple" fontSize="xs">
                  {session?.user?.role === 'platform_admin' ? 'Platform Admin' : 
                   session?.user?.role === 'admin' ? 'Tenant Admin' : 'User'}
                </Badge>
              </VStack>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiSettings />}>Profile Settings</MenuItem>
            <MenuItem icon={<FiSettings />}>Preferences</MenuItem>
            <MenuDivider />
            <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.500">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </VStack>
  );

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Desktop Sidebar */}
      <Box display={{ base: 'none', md: 'block' }}>
        <SidebarContent />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <SidebarContent />
        </DrawerContent>
      </Drawer>

      {/* Main Content Area */}
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Top Bar for Mobile */}
        <Box
          display={{ base: 'flex', md: 'none' }}
          p={4}
          borderBottom="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          bg={useColorModeValue('white', 'gray.900')}
          alignItems="center"
          justifyContent="space-between"
        >
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={onOpen}
            variant="ghost"
          />
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              Easy2Work
            </Text>
          </HStack>
          <Box w="40px" /> {/* Spacer for alignment */}
        </Box>

        {/* Page Content */}
        <Box flex={1} overflowY="auto" bg={useColorModeValue('gray.50', 'gray.800')}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
