import { Box, Heading, Text, Button, Container, VStack } from '@chakra-ui/react';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading as="h1" size="2xl" bgGradient="linear(to-r, brand.400, brand.600)" bgClip="text">
          Easy2Work
        </Heading>
        <Heading as="h2" size="lg" fontWeight="normal">
          Multi-Tenant Configurable SaaS Platform
        </Heading>
        <Text fontSize="xl" color="gray.600" maxW="2xl">
          Automate your Lead-to-Cash lifecycle with fully configurable modules, 
          dynamic workflows, and enterprise-grade security.
        </Text>
        <Box pt={4}>
          <Link href="/auth/signin">
            <Button colorScheme="brand" size="lg" mr={4}>
              Get Started
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Documentation
            </Button>
          </Link>
        </Box>
        <Box pt={8}>
          <Text fontSize="sm" color="gray.500">
            Version 1.3.0 - Stable Configurable Core
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
