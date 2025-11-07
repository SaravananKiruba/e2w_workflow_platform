'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Divider,
  Code,
  Badge,
} from '@chakra-ui/react';
import { FiPlay, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ValidationRule } from './ValidationRuleBuilder';

interface ValidationRuleTesterProps {
  rules: ValidationRule[];
  fieldName: string;
  dataType: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  passedRules: number;
  totalRules: number;
}

export default function ValidationRuleTester({
  rules,
  fieldName,
  dataType,
}: ValidationRuleTesterProps) {
  const [testValue, setTestValue] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const validateValue = (value: string): ValidationResult => {
    const errors: string[] = [];
    let passedRules = 0;

    for (const rule of rules) {
      let isValid = true;
      let errorMessage = rule.message || getDefaultMessage(rule.type, rule.value);

      // Skip conditional validations if condition not met
      if (rule.condition) {
        // In a real implementation, you'd check the actual field values
        // For testing, we'll just apply all rules
      }

      switch (rule.type) {
        case 'required':
          isValid = value.trim().length > 0;
          break;

        case 'minLength':
          isValid = value.length >= Number(rule.value || 0);
          break;

        case 'maxLength':
          isValid = value.length <= Number(rule.value || 0);
          break;

        case 'min':
          const numValue = Number(value);
          isValid = !isNaN(numValue) && numValue >= Number(rule.value || 0);
          break;

        case 'max':
          const maxNumValue = Number(value);
          isValid = !isNaN(maxNumValue) && maxNumValue <= Number(rule.value || 0);
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(value);
          break;

        case 'url':
          try {
            new URL(value);
            isValid = true;
          } catch {
            isValid = false;
          }
          break;

        case 'phone':
          // Indian phone number format
          const phoneRegex = /^[+]?[0-9]{10,15}$/;
          isValid = phoneRegex.test(value.replace(/[\s-]/g, ''));
          break;

        case 'pattern':
          if (rule.value) {
            try {
              const regex = new RegExp(rule.value as string);
              isValid = regex.test(value);
            } catch (e) {
              errors.push(`Invalid regex pattern: ${rule.value}`);
              isValid = false;
            }
          }
          break;

        case 'custom':
          // For custom formulas, we'd need to evaluate them
          // For now, just show a warning
          errors.push(`Custom formula validation not supported in tester: ${rule.value}`);
          isValid = false;
          break;
      }

      if (isValid) {
        passedRules++;
      } else {
        errors.push(errorMessage);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      passedRules,
      totalRules: rules.length,
    };
  };

  const handleTest = () => {
    const result = validateValue(testValue);
    setResult(result);
  };

  const getDefaultMessage = (type: string, value?: string | number): string => {
    const messages: Record<string, string> = {
      required: 'This field is required',
      minLength: `Minimum ${value || 0} characters required`,
      maxLength: `Maximum ${value || 0} characters allowed`,
      min: `Value must be at least ${value || 0}`,
      max: `Value must be at most ${value || 0}`,
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      phone: 'Please enter a valid phone number',
      pattern: 'Invalid format',
      custom: 'Validation failed',
    };
    return messages[type] || 'Validation error';
  };

  const getInputType = (): string => {
    switch (dataType) {
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'date':
        return 'date';
      case 'datetime':
        return 'datetime-local';
      default:
        return 'text';
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box
        p={4}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="md"
        bg={bgColor}
      >
        <VStack spacing={3} align="stretch">
          <HStack>
            <Text fontSize="sm" fontWeight="medium">
              Test Validation Rules
            </Text>
            <Badge colorScheme="blue" fontSize="xs">
              {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
            </Badge>
          </HStack>

          {rules.length === 0 && (
            <Alert status="info" fontSize="sm">
              <AlertIcon />
              <Text>No validation rules configured to test</Text>
            </Alert>
          )}

          {rules.length > 0 && (
            <>
              <Divider />

              <FormControl>
                <FormLabel fontSize="sm">
                  Test Value for: <Code fontSize="sm">{fieldName}</Code>
                </FormLabel>
                <Input
                  type={getInputType()}
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder={`Enter ${dataType} value to test...`}
                  size="sm"
                />
              </FormControl>

              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<FiPlay />}
                onClick={handleTest}
              >
                Test Validation
              </Button>

              {result && (
                <>
                  <Divider />

                  <Alert
                    status={result.valid ? 'success' : 'error'}
                    variant="left-accent"
                  >
                    <AlertIcon as={result.valid ? FiCheckCircle : FiXCircle} />
                    <Box flex="1">
                      <AlertTitle fontSize="sm">
                        {result.valid ? 'All Validations Passed' : 'Validation Failed'}
                      </AlertTitle>
                      <AlertDescription fontSize="xs">
                        {result.passedRules} of {result.totalRules} rules passed
                      </AlertDescription>
                    </Box>
                  </Alert>

                  {!result.valid && result.errors.length > 0 && (
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" fontWeight="medium" color="red.500">
                        Error Messages:
                      </Text>
                      {result.errors.map((error, index) => (
                        <Alert key={index} status="error" fontSize="xs" py={2}>
                          <AlertIcon boxSize={3} />
                          <Text>{error}</Text>
                        </Alert>
                      ))}
                    </VStack>
                  )}

                  {result.valid && (
                    <Alert status="success" fontSize="xs" py={2}>
                      <AlertIcon boxSize={3} />
                      <Text>✓ The value passes all validation rules</Text>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}
