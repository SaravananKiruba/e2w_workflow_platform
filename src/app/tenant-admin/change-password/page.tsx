'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { FiLock, FiCheck, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
      });
      return false;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'New password must be at least 6 characters',
        status: 'warning',
        duration: 3000,
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirm password must be the same',
        status: 'error',
        duration: 3000,
      });
      return false;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Invalid password',
        description: 'New password cannot be the same as current password',
        status: 'warning',
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Password changed successfully',
          description: 'Your password has been updated. Please use your new password for your next login.',
          status: 'success',
          duration: 4000,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        try {
          const error = await res.json();
          toast({
            title: 'Failed to change password',
            description: error.error || error.message || 'Failed to change password',
            status: 'error',
            duration: 4000,
          });
        } catch (jsonError) {
          // If response is not valid JSON, show status text
          toast({
            title: 'Failed to change password',
            description: res.statusText || 'An error occurred',
            status: 'error',
            duration: 4000,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while processing your request',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={2} align="start">
          <HStack spacing={3}>
            <Box fontSize="2xl">🔐</Box>
            <VStack spacing={0} align="start">
              <Heading size="lg">Change Password</Heading>
              <Text color="gray.600" fontSize="sm">
                Update your account password
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Form Card */}
        <Card bg="white" boxShadow="sm" border="1px" borderColor="gray.200">
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Info Box */}
              <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
                <HStack spacing={2} align="flex-start">
                  <Icon as={FiAlertCircle} color="blue.600" mt={1} />
                  <Text fontSize="sm" color="blue.800">
                    For security, you'll need to enter your current password to set a new one.
                  </Text>
                </HStack>
              </Box>

              {/* Current Password */}
              <FormControl isRequired>
                <FormLabel fontWeight="600" color="gray.700">
                  Current Password
                </FormLabel>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  size="md"
                  borderColor="gray.300"
                  _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.5)' }}
                />
              </FormControl>

              <Divider />

              {/* New Password */}
              <FormControl isRequired>
                <FormLabel fontWeight="600" color="gray.700">
                  New Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password (min 6 characters)"
                    size="md"
                    borderColor="gray.300"
                    _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.5)' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      icon={<Icon as={showNewPassword ? FiEyeOff : FiEye} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Must be at least 6 characters long
                </Text>
              </FormControl>

              {/* Confirm Password */}
              <FormControl isRequired>
                <FormLabel fontWeight="600" color="gray.700">
                  Confirm Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    size="md"
                    borderColor="gray.300"
                    _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.5)' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      icon={<Icon as={showConfirmPassword ? FiEyeOff : FiEye} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Submit Button */}
              <Button
                colorScheme="purple"
                size="lg"
                onClick={handleChangePassword}
                isLoading={loading}
                leftIcon={<Icon as={FiLock} />}
                mt={4}
              >
                Change Password
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Security Tips */}
        <Card bg="green.50" border="1px" borderColor="green.200">
          <CardHeader pb={3}>
            <HStack spacing={2}>
              <Icon as={FiCheck} color="green.600" fontSize="lg" />
              <Heading size="sm" color="green.900">
                Security Tips
              </Heading>
            </HStack>
          </CardHeader>
          <Divider borderColor="green.200" />
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="green.900">
                ✓ Use a mix of uppercase, lowercase, numbers and special characters
              </Text>
              <Text fontSize="sm" color="green.900">
                ✓ Avoid using personal information like names or birthdates
              </Text>
              <Text fontSize="sm" color="green.900">
                ✓ Don't reuse passwords from other accounts
              </Text>
              <Text fontSize="sm" color="green.900">
                ✓ Never share your password with anyone
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
