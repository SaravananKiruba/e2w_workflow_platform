'use client';

import { Box, Container, Heading, Text, VStack, HStack, Button, useToast } from '@chakra-ui/react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Container maxW="container.lg" py={20}>
        <VStack spacing={4}>
          <Heading>Loading...</Heading>
        </VStack>
      </Container>
    );
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  return (
    <Container maxW="container.lg" py={20}>
      <VStack spacing={8} align="start">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            Welcome to Easy2Work
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Multi-Tenant Configurable SaaS Platform
          </Text>
        </Box>

        {session && (
          <Box w="full" p={8} borderWidth={1} borderRadius="lg" bg="gray.50">
            <VStack align="start" spacing={4}>
              <Heading as="h2" size="md">
                User Information
              </Heading>
              <HStack spacing={8}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Name
                  </Text>
                  <Text fontSize="lg">{session.user?.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Email
                  </Text>
                  <Text fontSize="lg">{session.user?.email}</Text>
                </Box>
              </HStack>

              <HStack spacing={8}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Role
                  </Text>
                  <Text fontSize="lg">{session.user?.role}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Tenant ID
                  </Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {session.user?.tenantId}
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}

        <Box w="full" p={8} borderWidth={1} borderRadius="lg" bg="blue.50">
          <VStack align="start" spacing={4}>
            <Heading as="h2" size="md">
              Quick Actions
            </Heading>
            <Text color="gray.700">
              Your authentication is working! You're successfully logged in.
            </Text>
            <Button colorScheme="red" onClick={handleLogout}>
              Sign Out
            </Button>
          </VStack>
        </Box>

        <Box w="full" p={8} borderWidth={1} borderRadius="lg">
          <VStack align="start" spacing={4}>
            <Heading as="h2" size="md">
              Next Steps
            </Heading>
            <VStack align="start" color="gray.700" spacing={2}>
              <Text>• Configure your tenant settings</Text>
              <Text>• Create modules and workflows</Text>
              <Text>• Invite team members</Text>
              <Text>• Set up integrations</Text>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
