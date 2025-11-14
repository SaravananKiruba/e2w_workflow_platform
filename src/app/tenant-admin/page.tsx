'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Icon,
  Text,
  Button,
  Container,
  Divider,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiGrid,
  FiGitBranch,
  FiUsers,
} from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function TenantAdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tenantName, setTenantName] = useState('Organization');

  useEffect(() => {
    // Fetch tenant name from API
    const fetchTenantName = async () => {
      try {
        const res = await fetch('/api/tenant/info', {
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          setTenantName(data.name || 'Organization');
        }
      } catch (error) {
        console.error('Failed to fetch tenant info:', error);
      }
    };

    fetchTenantName();
  }, []);

  const quickLinks = [
    {
      title: 'Field Builder',
      description: 'Create and manage custom fields',
      icon: FiGrid,
      color: 'blue',
      href: '/tenant-admin/field-builder',
    },
    {
      title: 'Workflow Builder',
      description: 'Automate your processes',
      icon: FiGitBranch,
      color: 'green',
      href: '/tenant-admin/workflow-builder',
    },
    {
      title: 'User Management',
      description: 'Manage your team',
      icon: FiUsers,
      color: 'orange',
      href: '/tenant-admin/users',
    },
  ];

  return (
    <Box minH="100vh" bg="gradient.light" py={{ base: 8, md: 16 }}>
      <Container maxW="4xl">
        <VStack spacing={12} align="center" textAlign="center" py={12}>
          {/* Welcome Hero Section */}
          <VStack spacing={6} align="center">
            <Box>
              <Text fontSize="lg" fontWeight="500" color="blue.600" mb={2}>
                Welcome back, {session?.user?.name}! 👋
              </Text>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, blue.600, purple.600)"
                bgClip="text"
                mb={4}
              >
                {tenantName}
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
                You're all set! Let's get started configuring your organization
              </Text>
            </Box>

            {/* Status Badge */}
            <HStack
              bg="green.50"
              px={4}
              py={2}
              borderRadius="full"
              border="1px"
              borderColor="green.200"
            >
              <Box w={2} h={2} bg="green.500" borderRadius="full" />
              <Text fontSize="sm" fontWeight="500" color="green.700">
                Your account is active and ready to use
              </Text>
            </HStack>
          </VStack>

          <Divider />

          {/* Quick Links */}
          <VStack spacing={4} w="full" align="stretch">
            <Heading size="md" textAlign="left">
              What would you like to do?
            </Heading>

            <HStack spacing={4} align="stretch" wrap="wrap" justify="center">
              {quickLinks.map((link) => (
                <Box
                  key={link.title}
                  flex={{ base: '1', md: 'auto' }}
                  minW={{ base: 'full', md: '200px' }}
                  bg="white"
                  p={6}
                  borderRadius="lg"
                  border="1px"
                  borderColor="gray.200"
                  boxShadow="sm"
                  _hover={{
                    borderColor: `${link.color}.300`,
                    boxShadow: 'md',
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => router.push(link.href)}
                >
                  <VStack spacing={3} h="full" justify="space-between">
                    <Icon as={link.icon} boxSize={8} color={`${link.color}.500`} />
                    <VStack spacing={1}>
                      <Text fontWeight="600" fontSize="sm">
                        {link.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {link.description}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme={link.color}
                      variant="ghost"
                      rightIcon={<Icon as={FiArrowRight} />}
                      w="full"
                    >
                      Go
                    </Button>
                  </VStack>
                </Box>
              ))}
            </HStack>
          </VStack>

          {/* Help Section */}
          <Box
            bg="blue.50"
            p={6}
            borderRadius="lg"
            border="1px"
            borderColor="blue.200"
            w="full"
            textAlign="left"
          >
            <Heading size="sm" mb={2} color="blue.900">
              💡 Getting Started Tips
            </Heading>
            <VStack align="start" spacing={2} fontSize="sm" color="blue.800">
              <Text>1. Start by creating custom fields for your modules</Text>
              <Text>2. Set up workflows to automate your business processes</Text>
              <Text>3. Invite your team members and assign roles</Text>
              <Text>4. Access your core modules from the main dashboard</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
