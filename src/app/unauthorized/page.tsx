'use client';

import { Box, Container, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiShield } from 'react-icons/fi';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <Container maxW="container.sm" py={20}>
      <VStack spacing={6} textAlign="center">
        <Icon as={FiShield} boxSize={20} color="red.500" />
        <Heading size="2xl" color="red.500">403</Heading>
        <Heading size="lg">Access Denied</Heading>
        <Text fontSize="lg" color="gray.600">
          You don't have permission to access this page.
        </Text>
        <Text fontSize="sm" color="gray.500">
          If you believe this is an error, please contact your system administrator.
        </Text>
        <Button 
          colorScheme="blue" 
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </VStack>
    </Container>
  );
}
