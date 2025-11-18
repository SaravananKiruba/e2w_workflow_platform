/**
 * Theme Showcase Component
 * 
 * A visual demonstration of the Easy2Work theme system.
 * This component showcases all color variations, components, and role-based theming.
 * 
 * To view: Import and render in any page during development
 */

'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

export default function ThemeShowcase() {
  const colorSchemes = [
    { name: 'Primary', value: 'primary', hex: '#0485e2' },
    { name: 'Secondary', value: 'secondary', hex: '#0458c9' },
    { name: 'Accent', value: 'accent', hex: '#46d3c0' },
    { name: 'Olive', value: 'olive', hex: '#566b17' },
    { name: 'Dark', value: 'dark', hex: '#1a260b' },
  ];

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={10} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" mb={2} className="text-gradient-primary">
            Easy2Work Theme System
          </Heading>
          <Text fontSize="lg" color="gray.600">
            A unique, professionally designed color palette for multi-tenant SaaS
          </Text>
        </Box>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <Heading size="lg">Color Palette</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={8} align="stretch">
              {colorSchemes.map((scheme) => (
                <Box key={scheme.value}>
                  <HStack justify="space-between" mb={3}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xl" fontWeight="bold">
                        {scheme.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {scheme.hex}
                      </Text>
                    </VStack>
                  </HStack>
                  <SimpleGrid columns={10} spacing={2}>
                    {shades.map((shade) => (
                      <Box
                        key={shade}
                        bg={`${scheme.value}.${shade}`}
                        h="60px"
                        borderRadius="md"
                        display="flex"
                        alignItems="flex-end"
                        justifyContent="center"
                        pb={1}
                        position="relative"
                        _hover={{
                          transform: 'scale(1.05)',
                          shadow: 'lg',
                          zIndex: 1,
                        }}
                        transition="all 0.2s"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color={shade >= 500 ? 'white' : 'gray.700'}
                        >
                          {shade}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <Heading size="lg">Button Variants</Heading>
          </CardHeader>
          <CardBody>
            <Tabs colorScheme="primary">
              <TabList>
                <Tab>Solid</Tab>
                <Tab>Outline</Tab>
                <Tab>Ghost</Tab>
                <Tab>Sizes</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={5} spacing={4}>
                    {colorSchemes.map((scheme) => (
                      <Button key={scheme.value} colorScheme={scheme.value} variant="solid">
                        {scheme.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                <TabPanel>
                  <SimpleGrid columns={5} spacing={4}>
                    {colorSchemes.map((scheme) => (
                      <Button key={scheme.value} colorScheme={scheme.value} variant="outline">
                        {scheme.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                <TabPanel>
                  <SimpleGrid columns={5} spacing={4}>
                    {colorSchemes.map((scheme) => (
                      <Button key={scheme.value} colorScheme={scheme.value} variant="ghost">
                        {scheme.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                <TabPanel>
                  <VStack align="stretch" spacing={4}>
                    {['xs', 'sm', 'md', 'lg'].map((size) => (
                      <HStack key={size} spacing={4}>
                        <Text w="60px" fontWeight="bold">
                          {size}:
                        </Text>
                        <Button colorScheme="primary" size={size as any}>
                          Button
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <Heading size="lg">Badge Variants</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Solid
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  {colorSchemes.map((scheme) => (
                    <Badge key={scheme.value} colorScheme={scheme.value} variant="solid" px={3} py={1}>
                      {scheme.name}
                    </Badge>
                  ))}
                </HStack>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Subtle
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  {colorSchemes.map((scheme) => (
                    <Badge key={scheme.value} colorScheme={scheme.value} variant="subtle" px={3} py={1}>
                      {scheme.name}
                    </Badge>
                  ))}
                </HStack>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Role Badges
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Badge colorScheme="accent" variant="solid" px={3} py={1}>
                    Platform Admin
                  </Badge>
                  <Badge colorScheme="primary" variant="solid" px={3} py={1}>
                    Tenant Admin
                  </Badge>
                  <Badge colorScheme="olive" variant="subtle" px={3} py={1}>
                    Manager
                  </Badge>
                  <Badge colorScheme="olive" variant="subtle" px={3} py={1}>
                    Owner
                  </Badge>
                  <Badge colorScheme="secondary" variant="subtle" px={3} py={1}>
                    User
                  </Badge>
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <Heading size="lg">Form Elements</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Input
                </Text>
                <Input placeholder="Focus to see primary.500 border" />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Select
                </Text>
                <Select placeholder="Select option">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </Select>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Textarea
                </Text>
                <Textarea placeholder="Type something..." />
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Gradients */}
        <Card>
          <CardHeader>
            <Heading size="lg">Gradient Backgrounds</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box
                bgGradient="linear(to-r, primary.500, secondary.600)"
                p={6}
                borderRadius="xl"
                color="white"
                textAlign="center"
              >
                <Text fontWeight="bold" fontSize="lg">
                  Primary → Secondary
                </Text>
              </Box>
              <Box
                bgGradient="linear(to-r, primary.500, accent.500)"
                p={6}
                borderRadius="xl"
                color="white"
                textAlign="center"
              >
                <Text fontWeight="bold" fontSize="lg">
                  Primary → Accent
                </Text>
              </Box>
              <Box
                bgGradient="linear(to-r, accent.500, olive.500)"
                p={6}
                borderRadius="xl"
                color="white"
                textAlign="center"
              >
                <Text fontWeight="bold" fontSize="lg">
                  Accent → Olive
                </Text>
              </Box>
              <Box
                bgGradient="linear(to-r, olive.500, dark.500)"
                p={6}
                borderRadius="xl"
                color="white"
                textAlign="center"
              >
                <Text fontWeight="bold" fontSize="lg">
                  Olive → Dark
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Tailwind Classes */}
        <Card>
          <CardHeader>
            <Heading size="lg">Custom Tailwind Classes</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Button Classes
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <button className="btn-primary">Primary</button>
                  <button className="btn-secondary">Secondary</button>
                  <button className="btn-accent">Accent</button>
                  <button className="btn-olive">Olive</button>
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Badge Classes
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  <span className="badge-primary">Primary</span>
                  <span className="badge-accent">Accent</span>
                  <span className="badge-olive">Olive</span>
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3}>
                  Text Gradients
                </Text>
                <VStack align="start" spacing={2}>
                  <Text fontSize="3xl" fontWeight="bold" className="text-gradient-primary">
                    Primary Gradient Text
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" className="text-gradient-accent">
                    Accent Gradient Text
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Footer */}
        <Box textAlign="center" py={6}>
          <Text color="gray.600">
            See <strong>THEME-GUIDE.md</strong> for complete documentation
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
