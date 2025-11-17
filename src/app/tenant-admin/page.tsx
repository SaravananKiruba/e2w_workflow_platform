'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TenantAdminDashboard() {
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

  return (
    <Box 
      h="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gradient.light"
      overflow="hidden"
    >
      <VStack spacing={6} align="center" textAlign="center">
        <Box>
          <Text fontSize="xl" fontWeight="500" color="blue.600" mb={3}>
            Welcome back, {session?.user?.name}! 👋
          </Text>
          <Heading
            size="3xl"
            bgGradient="linear(to-r, blue.600, purple.600)"
            bgClip="text"
            mb={4}
          >
            {tenantName}
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            You're all set! Use the sidebar to navigate and manage your organization
          </Text>
        </Box>

        {/* Status Badge */}
        <HStack
          bg="green.50"
          px={6}
          py={3}
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
    </Box>
  );
}
