'use client';

import { Box, Button, Container, FormControl, FormLabel, Heading, Input, VStack, Text, useToast, HStack } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: callbackUrl,
      });

      if (!result || result.error) {
        console.log('[SIGNIN] Login failed:', result?.error);
        toast({
          title: 'Authentication failed',
          description: 'Invalid email or password',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[SIGNIN] Error during login:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-br, blue.50, purple.50, pink.50)"
      px={4}
    >
      <Container maxW="md">
        <VStack spacing={8}>
          {/* Logo & Branding */}
          <VStack spacing={2} textAlign="center">
            <Box
              fontSize="5xl"
              fontWeight="bold"
              bgGradient="linear(to-r, blue.500, purple.600)"
              bgClip="text"
            >
              💼 Easy2Work
            </Box>
            <Heading
              as="h1"
              size="lg"
              color="gray.700"
              fontWeight="600"
            >
              Workflow Automation Platform
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Automate your entire business workflow without code
            </Text>
          </VStack>

          {/* Login Card */}
          <Box
            w="full"
            p={8}
            borderRadius="2xl"
            bg="white"
            shadow="2xl"
            border="1px"
            borderColor="gray.100"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={5}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
                  Sign In
                </Text>

                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="500">Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    size="lg"
                    borderRadius="lg"
                    focusBorderColor="blue.500"
                    _hover={{ borderColor: 'gray.300' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="500">Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    size="lg"
                    borderRadius="lg"
                    focusBorderColor="blue.500"
                    _hover={{ borderColor: 'gray.300' }}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  borderRadius="lg"
                  bgGradient="linear(to-r, blue.500, purple.600)"
                  _hover={{
                    bgGradient: 'linear(to-r, blue.600, purple.700)',
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
              </VStack>
            </form>
          </Box>

          {/* Demo Credentials */}
          <Box
            p={4}
            bg="white"
            borderRadius="lg"
            border="1px"
            borderColor="blue.100"
            w="full"
          >
            <VStack spacing={2} align="start">
              <HStack>
                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                  🔑 Demo Credentials:
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.600" fontFamily="mono">
                📧 demo@easy2work.com
              </Text>
              <Text fontSize="sm" color="gray.600" fontFamily="mono">
                🔒 demo@123
              </Text>
            </VStack>
          </Box>

          {/* Footer */}
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Lead → Client → Quotation → Order → Invoice → Payment
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
