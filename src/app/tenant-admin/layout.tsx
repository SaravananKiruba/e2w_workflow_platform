'use client';

import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Link as ChakraLink,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import {
  FiHome,
  FiGrid,
  FiGitBranch,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', href: '/tenant-admin', icon: FiHome },
  { name: 'Field Builder', href: '/tenant-admin/field-builder', icon: FiGrid },
  { name: 'Workflow Builder', href: '/tenant-admin/workflow-builder', icon: FiGitBranch },
  { name: 'User Management', href: '/tenant-admin/users', icon: FiUsers },
];

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Flex h="100vh" overflow="hidden">
      {/* Sidebar */}
      <Box
        w="250px"
        bg="purple.700"
        color="white"
        p={4}
        overflowY="auto"
        display={{ base: 'none', md: 'block' }}
      >
        <VStack align="stretch" spacing={1}>
          <Text fontSize="lg" fontWeight="bold" mb={4} px={3}>
            ⚙️ Tenant Admin
          </Text>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} passHref legacyBehavior>
                <ChakraLink
                  display="flex"
                  alignItems="center"
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={isActive ? 'purple.800' : 'transparent'}
                  _hover={{ bg: 'purple.600' }}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  <Icon as={item.icon} mr={3} />
                  <Text fontSize="sm">{item.name}</Text>
                </ChakraLink>
              </Link>
            );
          })}
        </VStack>

        <Box mt={8} p={3} bg="purple.800" borderRadius="md">
          <Text fontSize="xs" color="purple.200">
            Admin tools for configuring your workspace
          </Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flex="1" overflowY="auto" bg="gray.50">
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={3} px={6}>
          <HStack justify="space-between">
            <Breadcrumb fontSize="sm">
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink color="purple.600" fontWeight="600">
                  Tenant Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </HStack>
        </Box>
        <Container maxW="container.xl" py={6}>
          {children}
        </Container>
      </Box>
    </Flex>
  );
}
