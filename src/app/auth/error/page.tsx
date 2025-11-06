'use client';

import { Box, Container, Heading, Text, VStack, Button } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'AccessDenied':
        return 'Access denied. Your account may not be active.';
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'Error connecting to OAuth provider. Please try again.';
      case 'EmailSignInError':
        return 'Could not send sign in email. Please try again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={8}>
        <Heading as="h1" size="2xl" color="red.600">
          Authentication Error
        </Heading>
        <Box w="full" p={8} borderWidth={1} borderRadius="lg" bg="red.50">
          <VStack align="start" spacing={6}>
            <Box>
              <Text fontSize="lg" mb={2}>
                {getErrorMessage(error)}
              </Text>
              {error && (
                <Text fontSize="sm" color="gray.600" fontFamily="mono">
                  Error Code: {error}
                </Text>
              )}
            </Box>
            <VStack spacing={3} w="full">
              <Link href="/auth/signin" style={{ width: '100%' }}>
                <Button colorScheme="brand" w="full">
                  Try Again
                </Button>
              </Link>
              <Link href="/" style={{ width: '100%' }}>
                <Button variant="outline" w="full">
                  Back to Home
                </Button>
              </Link>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
