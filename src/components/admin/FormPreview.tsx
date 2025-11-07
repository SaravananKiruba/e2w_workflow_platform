'use client';

import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { DynamicField } from '@/components/forms/DynamicField';

interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  dataType: string;
  uiType: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  defaultValue?: any;
  validation?: any[];
  options?: any[];
  lookupConfig?: any;
  tableConfig?: any;
}

interface FormPreviewProps {
  fields: FieldDefinition[];
  moduleName?: string;
}

export default function FormPreview({ fields, moduleName = 'Preview' }: FormPreviewProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const formBgColor = useColorModeValue('gray.50', 'gray.900');

  // Filter out hidden fields
  const visibleFields = fields.filter((f) => !f.hidden);

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Heading size="md" mb={1}>
          Live Preview
        </Heading>
        <Text fontSize="sm" color="gray.500">
          This is how the form will appear to users
        </Text>
      </Box>

      {/* Preview Content */}
      <Box flex={1} overflowY="auto" p={6}>
        {visibleFields.length === 0 ? (
          <Box
            bg={formBgColor}
            borderRadius="md"
            p={12}
            textAlign="center"
            border="1px dashed"
            borderColor={borderColor}
          >
            <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
              No fields to preview
            </Text>
            <Text fontSize="sm" color="gray.400">
              Add fields to see the preview
            </Text>
          </Box>
        ) : (
          <Box
            bg={formBgColor}
            borderRadius="md"
            p={6}
            border="1px solid"
            borderColor={borderColor}
          >
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="lg" mb={2}>
                  {moduleName}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Fill out the form below
                </Text>
              </Box>

              <Divider />

              <VStack spacing={5} align="stretch">
                {visibleFields.map((field) => (
                  <Box key={field.id}>
                    <DynamicField
                      field={{
                        name: field.name,
                        label: field.label,
                        dataType: field.dataType,
                        uiType: field.uiType,
                        placeholder: field.placeholder,
                        helpText: field.helpText,
                        isRequired: field.required,
                        defaultValue: field.defaultValue,
                        validation: field.validation,
                        config: {
                          options: field.options,
                          targetModule: field.lookupConfig?.targetModule,
                          displayField: field.lookupConfig?.displayField,
                          columns: field.tableConfig?.columns,
                        },
                      }}
                      value={''}
                      onChange={() => {
                        // Preview only - no actual state management
                      }}
                      error={undefined}
                    />
                  </Box>
                ))}
              </VStack>
            </VStack>
          </Box>
        )}
      </Box>

      {/* Footer Info */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Preview mode - form is not functional
        </Text>
      </Box>
    </Box>
  );
}
