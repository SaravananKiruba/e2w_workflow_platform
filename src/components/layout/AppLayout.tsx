'use client';

import React, { ReactNode, useEffect, useState } from 'react';
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
  Spinner,
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
  FiPackage,
  FiTag,
  FiClipboard,
  FiTruck,
  FiBriefcase,
} from 'react-icons/fi';

// Week 4: Icon mapping for dynamic sidebar
const iconMap: Record<string, any> = {
  FiHome, FiUsers, FiSettings, FiGrid, FiBox, FiFileText,
  FiShoppingCart, FiDollarSign, FiCreditCard, FiTrendingUp,
  FiLayers, FiGitBranch, FiCheckCircle, FiDatabase, FiSliders,
  FiPackage, FiTag, FiClipboard, FiTruck, FiBriefcase,
};

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

  // Week 4: Dynamic sidebar state
  const [dynamicSidebarItems, setDynamicSidebarItems] = useState<NavItem[] | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  const role = session?.user?.role;
  const isPlatformAdmin = role === 'platform_admin';
  const isTenantAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isOwner = role === 'owner';
  const isStaff = role === 'staff';

  // Week 4: Fetch dynamic sidebar configuration
  useEffect(() => {
    const fetchSidebarConfig = async () => {
      try {
        const response = await fetch(`/api/admin/sidebar?role=${role || 'staff'}`);
        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            // Map icon strings to actual icon components
            const mappedItems = data.items.map((item: any) => ({
              ...item,
              icon: iconMap[item.icon] || FiGrid,
            }));
            setDynamicSidebarItems(mappedItems);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sidebar config:', error);
      } finally {
        setSidebarLoading(false);
      }
    };

    if (session?.user) {
      fetchSidebarConfig();
    }
  }, [session, role]);

  // Core Business Modules - Available to Manager, Owner, and Staff (NOT Platform Admin or Tenant Admin)
  const coreModules: NavItem[] = [
    { name: 'Dashboard', icon: FiHome, href: '/dashboard' },
    { name: 'Leads', icon: FiFileText, href: '/modules/Leads' },
    { name: 'Clients', icon: FiUsers, href: '/modules/Clients' },
    { name: 'Quotations', icon: FiFileText, href: '/modules/Quotations' },
    { name: 'Orders', icon: FiShoppingCart, href: '/modules/Orders' },
    { name: 'Invoices', icon: FiDollarSign, href: '/modules/Invoices' },
    { name: 'Payments', icon: FiCreditCard, href: '/modules/Payments' },
    // Analytics only for Manager and Owner (NOT Staff)
    { name: 'Analytics', icon: FiTrendingUp, href: '/dashboard/finance', roles: ['manager', 'owner'] },
  ];

  // Purchase & Vendor Management Modules
  const purchaseModules: NavItem[] = [
    { name: 'Vendors', icon: FiUsers, href: '/modules/Vendors', roles: ['manager', 'owner'] },
    { name: 'Rate Catalogs', icon: FiTag, href: '/modules/RateCatalogs', roles: ['manager', 'owner'] },
    { name: 'Purchase Requests', icon: FiClipboard, href: '/modules/PurchaseRequests' }, // All staff can create PRs
    { name: 'Purchase Orders', icon: FiShoppingCart, href: '/modules/PurchaseOrders', roles: ['manager', 'owner'] },
    { name: 'Goods Receipts', icon: FiTruck, href: '/modules/GoodsReceipts', roles: ['manager', 'owner', 'staff'] }, // Staff can receive goods
    { name: 'Vendor Bills', icon: FiFileText, href: '/modules/VendorBills', roles: ['manager', 'owner'] },
  ];

  // Tenant Admin Tools - Only for Tenant Admin (admin role)
  const tenantAdminTools: NavItem[] = [
    { name: 'Users', icon: FiUsers, href: '/tenant-admin/users' },
    { name: 'Field Builder', icon: FiLayers, href: '/tenant-admin/field-builder' },
    { name: 'Workflow Builder', icon: FiGitBranch, href: '/tenant-admin/workflow-builder' },
  ];

  // Platform Admin Tools - Only for platform_admin (ONLY tenant management)
  const platformAdminTools: NavItem[] = [
    { name: 'Tenants', icon: FiDatabase, href: '/platform-admin/tenants' },
    { name: 'Approval Queue', icon: FiCheckCircle, href: '/platform-admin/approval-queue', badge: '3' },
    { name: 'Settings', icon: FiSliders, href: '/platform-admin/settings' },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  // Color schemes based on role
  const sidebarBg = useColorModeValue(
    isPlatformAdmin ? 'gray.800' : 'white',
    'gray.900'
  );
  const sidebarBorderColor = useColorModeValue(
    isPlatformAdmin ? 'gray.700' : 'gray.200',
    'gray.700'
  );
  const logoColor = isPlatformAdmin ? 'accent.200' : 'primary.600';
  const roleColors = {
    platform_admin: 'orange',
    admin: 'primary',
    user: 'gray',
  };

  const SidebarContent = () => (
    <VStack
      h="full"
      w="240px"
      bg={sidebarBg}
      borderRight="1px"
      borderColor={sidebarBorderColor}
      align="stretch"
      spacing={0}
    >
      {/* Logo Section with Role Indicator */}
      <Box 
        p={6} 
        borderBottom="1px" 
        borderColor={sidebarBorderColor}
        bg={isPlatformAdmin ? 'gray.900' : undefined}
      >
        <HStack spacing={2}>
          <Box fontSize="2xl">💼</Box>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={logoColor}>
              Easy2Work
            </Text>
            <Badge 
              colorScheme={isPlatformAdmin ? 'orange' : isTenantAdmin ? 'purple' : isManager ? 'green' : 'blue'} 
              fontSize="xs"
              variant={isPlatformAdmin ? 'solid' : 'subtle'}
            >
              {isPlatformAdmin ? 'Platform' : isTenantAdmin ? 'Tenant Admin' : isManager ? 'Manager' : isOwner ? 'Owner' : 'User'}
            </Badge>
          </VStack>
        </HStack>
      </Box>

      {/* Navigation Links */}
      <VStack 
        flex={1} 
        align="stretch" 
        spacing={1} 
        p={3} 
        overflowY="auto"
      >
        {/* Week 4: Dynamic Sidebar Loading State */}
        {sidebarLoading && (
          <Box textAlign="center" py={4}>
            <Spinner size="sm" color={isPlatformAdmin ? 'gray.400' : 'gray.500'} />
          </Box>
        )}

        {/* Loading complete - render sidebar */}
        {!sidebarLoading && (
          <>
            {/* Platform Admin Section - Always hardcoded for platform admin */}
            {isPlatformAdmin && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3} pt={2} pb={1}>
                  PLATFORM ADMIN
                </Text>
                {platformAdminTools.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'orange' : 'gray'}
                      justifyContent="flex-start"
                      leftIcon={<Icon as={item.icon} />}
                      size="md"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      color={!isActive ? 'gray.300' : undefined}
                      _hover={{ bg: 'gray.700' }}
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
                  );
                })}
              </>
            )}

            {/* Tenant Admin Section - Always hardcoded for tenant admin */}
            {isTenantAdmin && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="purple.600" px={3} pt={2} pb={1}>
                  ⚙️ TENANT CONFIGURATION
                </Text>
                {tenantAdminTools.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'purple' : 'gray'}
                      justifyContent="flex-start"
                      leftIcon={<Icon as={item.icon} />}
                      size="md"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      _hover={{ bg: 'purple.50' }}
                    >
                      <Text flex={1} textAlign="left" isTruncated>
                        {item.name}
                      </Text>
                    </Button>
                  );
                })}
              </>
            )}

            {/* Core Business Modules - Manager, Owner, Staff (NOT Platform Admin or Tenant Admin) */}
            {!isPlatformAdmin && !isTenantAdmin && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} pt={2} pb={1}>
                  📊 SALES MODULES
                </Text>
                {coreModules.map((item) => {
                  // Check if item has role restrictions
                  if (item.roles && item.roles.length > 0) {
                    // Skip if current user role is not in allowed roles
                    if (!item.roles.includes(role || '')) {
                      return null;
                    }
                  }
                  
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'blue' : 'gray'}
                      justifyContent="flex-start"
                      leftIcon={<Icon as={item.icon} />}
                      size="md"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      _hover={{ bg: 'gray.100' }}
                    >
                      <Text flex={1} textAlign="left" isTruncated>
                        {item.name}
                      </Text>
                    </Button>
                  );
                })}

                {/* Purchase & Vendor Management Section */}
                <Text fontSize="xs" fontWeight="bold" color="green.600" px={3} pt={4} pb={1}>
                  🛒 PURCHASE MODULES
                </Text>
                {purchaseModules.map((item) => {
                  // Check if item has role restrictions
                  if (item.roles && item.roles.length > 0) {
                    // Skip if current user role is not in allowed roles
                    if (!item.roles.includes(role || '')) {
                      return null;
                    }
                  }
                  
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'green' : 'gray'}
                      justifyContent="flex-start"
                      leftIcon={<Icon as={item.icon} />}
                      size="md"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      _hover={{ bg: 'green.50' }}
                    >
                      <Text flex={1} textAlign="left" isTruncated>
                        {item.name}
                      </Text>
                    </Button>
                  );
                })}
              </>
            )}
          </>
        )}
      </VStack>

      {/* User Profile Section */}
      <Box 
        p={3} 
        borderTop="1px" 
        borderColor={sidebarBorderColor}
        bg={isPlatformAdmin ? 'gray.900' : undefined}
      >
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="full"
            h="auto"
            p={2}
            _hover={{ bg: isPlatformAdmin ? 'gray.700' : 'gray.100' }}
          >
            <HStack spacing={3}>
              <Avatar 
                size="sm" 
                name={session?.user?.name || undefined} 
                src={session?.user?.image ?? undefined}
                bg={isPlatformAdmin ? 'orange.500' : isTenantAdmin ? 'purple.500' : isManager ? 'green.500' : 'blue.500'}
              />
              <VStack align="start" spacing={0} flex={1}>
                <Text 
                  fontSize="sm" 
                  fontWeight="medium" 
                  isTruncated 
                  maxW="140px"
                  color={isPlatformAdmin ? 'white' : undefined}
                >
                  {session?.user?.name}
                </Text>
                  <Tooltip 
                  label={
                    isPlatformAdmin ? 'Manages entire platform and all tenants' : 
                    isTenantAdmin ? 'Manages tenant configuration and users' : 
                    isManager ? 'Manages business operations and reports' :
                    isOwner ? 'Company owner with full business access' :
                    'Regular user with module access'
                  }
                  placement="top"
                >
                  <Badge 
                    colorScheme={
                      isPlatformAdmin ? 'orange' : 
                      isTenantAdmin ? 'purple' : 
                      isManager ? 'green' : 
                      'gray'
                    } 
                    fontSize="xs"
                    variant={isPlatformAdmin ? 'solid' : 'subtle'}
                  >
                    {isPlatformAdmin ? 'Platform Admin' : 
                     isTenantAdmin ? 'Tenant Admin' : 
                     isManager ? 'Manager' :
                     isOwner ? 'Owner' : 'User'}
                  </Badge>
                </Tooltip>
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
          bg={isPlatformAdmin ? 'gray.800' : useColorModeValue('white', 'gray.900')}
          alignItems="center"
          justifyContent="space-between"
        >
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={onOpen}
            variant="ghost"
            color={isPlatformAdmin ? 'white' : undefined}
          />
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="bold" color={logoColor}>
              Easy2Work
            </Text>
            <Badge 
              colorScheme={isPlatformAdmin ? 'orange' : isTenantAdmin ? 'purple' : isManager ? 'green' : 'blue'} 
              fontSize="xs"
              variant={isPlatformAdmin ? 'solid' : 'subtle'}
            >
              {isPlatformAdmin ? 'Platform' : isTenantAdmin ? 'Tenant Admin' : isManager ? 'Manager' : isOwner ? 'Owner' : 'User'}
            </Badge>
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
