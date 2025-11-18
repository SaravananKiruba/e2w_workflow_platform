'use client';

import { 
  Box, 
  Button, 
  Container, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  VStack, 
  Text, 
  useToast, 
  HStack,
  Checkbox,
  Link,
  Fade,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Dashboard will handle role-based redirect
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
      position="relative"
      overflow="hidden"
      bgGradient="linear(135deg, primary.500, secondary.600, accent.500)"
      px={4}
    >
      <Container maxW={{ base: "full", sm: "md" }} position="relative" zIndex={1}>
        <Fade in={true}>
          <VStack spacing={{ base: 6, md: 8 }}>
            {/* Logo & Branding */}
            <VStack spacing={2} textAlign="center">
              <Text
                fontSize={{ base: "4xl", md: "5xl" }}
                fontWeight="bold"
                color="white"
                textShadow="0 2px 10px rgba(0,0,0,0.2)"
              >
                💼 Easy2Work
              </Text>
              <Heading
                as="h1"
                size={{ base: "md", md: "lg" }}
                color="white"
                fontWeight="600"
                textShadow="0 1px 5px rgba(0,0,0,0.15)"
              >
                Multi-Tenant SaaS Platform
              </Heading>
            </VStack>

            {/* Login Card */}
            <Box
              w="full"
              p={{ base: 6, md: 8 }}
              borderRadius="2xl"
              bg="white"
              shadow="2xl"
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="gray.800">
                    Sign In
                  </Text>

                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontWeight="600" fontSize="sm">
                      Email Address
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiMail} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        borderRadius="lg"
                        focusBorderColor="primary.500"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.700" fontWeight="600" fontSize="sm">
                      Password
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        borderRadius="lg"
                        focusBorderColor="primary.500"
                      />
                    </InputGroup>
                  </FormControl>

                  <HStack w="full" justify="space-between" flexWrap="wrap">
                    <Checkbox
                      colorScheme="primary"
                      isChecked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size={{ base: "sm", md: "md" }}
                    >
                      <Text fontSize="sm" color="gray.600">Remember me</Text>
                    </Checkbox>
                    <Link
                      fontSize="sm"
                      color="primary.600"
                      fontWeight="600"
                      _hover={{ textDecoration: 'underline', color: 'primary.700' }}
                    >
                      Forgot password?
                    </Link>
                  </HStack>

                  <Button
                    type="submit"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    borderRadius="lg"
                    bgGradient="linear(to-r, primary.500, accent.500)"
                    color="white"
                    fontWeight="bold"
                    rightIcon={<Icon as={FiArrowRight} />}
                    _hover={{
                      bgGradient: 'linear(to-r, primary.600, accent.600)',
                      transform: 'translateY(-2px)',
                      shadow: 'xl',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </Box>

          
           
          </VStack>
        </Fade>
      </Container>
    </Box>
  );
}
