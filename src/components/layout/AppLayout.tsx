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
  FiFileText,
  FiShoppingCart,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiLayers,
  FiGitBranch,
  FiDatabase,
  FiTag,
  FiClipboard,
  FiTruck,
} from 'react-icons/fi';

// Icon mapping for dynamic modules
const iconMap: Record<string, any> = {
  FiHome, FiUsers, FiSettings, FiGrid, FiFileText,
  FiShoppingCart, FiDollarSign, FiCreditCard, FiTrendingUp,
  FiLayers, FiGitBranch, FiDatabase, FiTag, FiClipboard, FiTruck,
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

  const [tenantName, setTenantName] = useState<string>('');
  const [dynamicModules, setDynamicModules] = useState<Record<string, NavItem[]>>({});
  const [loadingModules, setLoadingModules] = useState(true);

  const role = session?.user?.role;
  const isPlatformAdmin = role === 'platform_admin';
  const isTenantAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isOwner = role === 'owner';
  const isStaff = role === 'staff';

  // Fetch tenant name for tenant admins
  useEffect(() => {
    if (isTenantAdmin && !isPlatformAdmin) {
      const fetchTenantName = async () => {
        try {
          const res = await fetch('/api/tenant/info', { credentials: 'same-origin' });
          if (res.ok) {
            const data = await res.json();
            setTenantName(data.name || '');
          }
        } catch (error) {
          console.error('Failed to fetch tenant name:', error);
        }
      };
      fetchTenantName();
    }
  }, [isTenantAdmin, isPlatformAdmin]);

  // Fetch dynamic modules grouped by workflow for manager/owner/staff
  useEffect(() => {
    if (isPlatformAdmin) {
      setLoadingModules(false);
      return;
    }

    if (isManager || isOwner || isStaff) {
      const fetchModules = async () => {
        try {
          const res = await fetch('/api/modules');
          if (res.ok) {
            const data = await res.json();
            const groupedModules: Record<string, NavItem[]> = {};
            
            // Convert API response to NavItem format grouped by workflow
            Object.entries(data.groupedByWorkflow || {}).forEach(([workflow, modules]) => {
              groupedModules[workflow] = (modules as any[]).map(mod => ({
                name: mod.displayName,
                icon: iconMap[mod.icon] || FiGrid,
                href: `/modules/${mod.moduleName}`,
              }));
            });

            setDynamicModules(groupedModules);
          }
        } catch (error) {
          console.error('Failed to fetch modules:', error);
        } finally {
          setLoadingModules(false);
        }
      };
      fetchModules();
    } else {
      setLoadingModules(false);
    }
  }, [isManager, isOwner, isStaff, isPlatformAdmin]);

  // Platform Admin Tools
  const platformAdminModules: NavItem[] = [
    { name: 'Tenants', icon: FiDatabase, href: '/platform-admin/tenants' },
  ];

  // Tenant Admin Configuration Tools
  const tenantAdminModules: NavItem[] = [
    { name: 'Dashboard', icon: FiHome, href: '/tenant-admin' },
    { name: 'Users', icon: FiUsers, href: '/tenant-admin/users' },
    { name: 'Module Builder', icon: FiGrid, href: '/tenant-admin/modules' },
    { name: 'Fields', icon: FiLayers, href: '/tenant-admin/field-builder' },
    { name: 'Workflows', icon: FiGitBranch, href: '/tenant-admin/workflow-builder' },
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
        {isPlatformAdmin ? (
          <HStack spacing={2}>
            <Box fontSize="2xl">💼</Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={logoColor}>
                Easy2Work
              </Text>
              <Badge 
                colorScheme="orange" 
                fontSize="xs"
                variant="solid"
              >
                Platform
              </Badge>
            </VStack>
          </HStack>
        ) : isTenantAdmin ? (
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="600" color="gray.500">
              e2w platform
            </Text>
            <Text fontSize="md" fontWeight="bold" color="primary.600" isTruncated maxW="100%">
              {tenantName}
            </Text>
          </VStack>
        ) : (
          <HStack spacing={2}>
            <Box fontSize="2xl">💼</Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={logoColor}>
                Easy2Work
              </Text>
              <Badge 
                colorScheme={isManager ? 'green' : isOwner ? 'green' : 'blue'} 
                fontSize="xs"
                variant="subtle"
              >
                {isManager ? 'Manager' : isOwner ? 'Owner' : 'User'}
              </Badge>
            </VStack>
          </HStack>
        )}
      </Box>

      {/* Navigation Links */}
      <VStack 
        flex={1} 
        align="stretch" 
        spacing={1} 
        p={3} 
        overflowY="auto"
      >
        {/* ================================================
            PLATFORM ADMIN - Platform Configuration
            ================================================ */}
        {isPlatformAdmin && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3} pt={2} pb={1}>
                  🏢 PLATFORM ADMIN
                </Text>
                {platformAdminModules.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
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

            {/* ================================================
                TENANT ADMIN - Tenant Configuration
                ================================================ */}
            {isTenantAdmin && (
              <>
                <Text fontSize="xs" fontWeight="bold" color="purple.600" px={3} pt={2} pb={1}>
                  ⚙️ TENANT CONFIGURATION
                </Text>
                {tenantAdminModules.map((item) => {
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

            {/* ================================================
                DYNAMIC BUSINESS MODULES - Manager/Owner/Staff
                Grouped by Workflow (Sales, Purchase, Custom)
                ================================================ */}
            {(isManager || isOwner || isStaff) && (
              <>
                {loadingModules ? (
                  <Box textAlign="center" py={4}>
                    <Text fontSize="xs" color="gray.500">Loading modules...</Text>
                  </Box>
                ) : (
                  <>
                    {Object.entries(dynamicModules).map(([workflow, modules]) => (
                      <React.Fragment key={workflow}>
                        <Text fontSize="xs" fontWeight="bold" color={workflow === 'Purchase' ? 'green.600' : 'blue.600'} px={3} pt={workflow === Object.keys(dynamicModules)[0] ? 2 : 4} pb={1}>
                          {workflow === 'Sales' && '📊 SALES MODULES'}
                          {workflow === 'Purchase' && '🛒 PURCHASE MODULES'}
                          {workflow !== 'Sales' && workflow !== 'Purchase' && `🎯 ${workflow.toUpperCase()}`}
                        </Text>
                        {modules.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Button
                              key={item.name}
                              onClick={() => router.push(item.href)}
                              variant={isActive ? 'solid' : 'ghost'}
                              colorScheme={isActive ? (workflow === 'Purchase' ? 'green' : workflow === 'Sales' ? 'blue' : 'purple') : 'gray'}
                              justifyContent="flex-start"
                              leftIcon={<Icon as={item.icon} />}
                              size="md"
                              fontWeight={isActive ? 'bold' : 'normal'}
                              _hover={{ bg: workflow === 'Purchase' ? 'green.50' : workflow === 'Sales' ? 'blue.50' : 'purple.50' }}
                            >
                              <Text flex={1} textAlign="left" isTruncated>
                                {item.name}
                              </Text>
                            </Button>
                          );
                        })}
                      </React.Fragment>
                    ))}
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
            {isPlatformAdmin ? (
              <MenuItem 
                icon={<FiSettings />}
                onClick={() => router.push('/platform-admin/change-password')}
              >
                Change Password
              </MenuItem>
            ) : isTenantAdmin ? (
              <MenuItem 
                icon={<FiSettings />}
                onClick={() => router.push('/tenant-admin/change-password')}
              >
                Change Password
              </MenuItem>
            ) : (
              <>
                <MenuItem icon={<FiSettings />}>Profile Settings</MenuItem>
                <MenuItem icon={<FiSettings />}>Preferences</MenuItem>
              </>
            )}
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
