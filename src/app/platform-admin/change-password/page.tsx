'use client';

import React, { useState } from 'react';
import {
  Container,
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  InputGroup,
  InputRightElement,
  Icon,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Password changed successfully',
          description: 'Your password has been updated.',
          status: 'success',
          duration: 3000,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        // Redirect back after a short delay
        setTimeout(() => {
          router.push('/platform-admin/tenants');
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to change password',
          status: 'error',
          duration: 3000,
        });
        if (data.error === 'Current password is incorrect') {
          setErrors({ currentPassword: data.error });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 3000,
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
          <HStack
            spacing={3}
            cursor="pointer"
            onClick={() => router.back()}
            _hover={{ opacity: 0.7 }}
          >
            <Icon as={FiArrowLeft} boxSize={5} />
            <Text fontSize="sm" color="gray.600">
              Back
            </Text>
          </HStack>
          <Heading size="lg">Change Password</Heading>
          <Text color="gray.600">
            Update your account password. Make sure to use a strong password.
          </Text>
        </VStack>

        {/* Form */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor="gray.200"
          boxShadow="sm"
        >
          <VStack spacing={5}>
            {/* Current Password */}
            <FormControl isInvalid={!!errors.currentPassword}>
              <FormLabel>Current Password</FormLabel>
              <InputGroup>
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword) {
                      setErrors({ ...errors, currentPassword: '' });
                    }
                  }}
                  placeholder="Enter your current password"
                  pr="2.5rem"
                  autoComplete="current-password"
                />
                <InputRightElement>
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    <Icon as={showCurrentPassword ? FiEyeOff : FiEye} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
            </FormControl>

            {/* New Password */}
            <FormControl isInvalid={!!errors.newPassword}>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: '' });
                    }
                  }}
                  placeholder="Enter new password (min 8 characters)"
                  pr="2.5rem"
                  autoComplete="new-password"
                />
                <InputRightElement>
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    <Icon as={showNewPassword ? FiEyeOff : FiEye} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
            </FormControl>

            {/* Confirm Password */}
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder="Confirm new password"
                  pr="2.5rem"
                  autoComplete="new-password"
                />
                <InputRightElement>
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    <Icon as={showConfirmPassword ? FiEyeOff : FiEye} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            {/* Password Requirements */}
            <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px" borderColor="blue.500">
              <Text fontSize="sm" fontWeight="600" color="blue.900" mb={2}>
                Password Requirements:
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="blue.800">
                  • At least 8 characters long
                </Text>
                <Text fontSize="xs" color="blue.800">
                  • Different from current password
                </Text>
              </VStack>
            </Box>

            {/* Submit Button */}
            <HStack spacing={3} w="full" pt={4}>
              <Button
                variant="outline"
                onClick={() => router.back()}
                isDisabled={loading}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                loadingText="Updating..."
                flex={1}
              >
                Update Password
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
