'use client';

import { VStack, SimpleGrid, Box } from '@chakra-ui/react';
import { DynamicField } from './DynamicField';
import { ModuleConfig, LayoutConfig } from '@/types/metadata';
import { useState } from 'react';

interface DynamicFormProps {
  config: ModuleConfig;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onChange?: (data: Record<string, any>) => void;
}

export function DynamicForm({ config, initialData = {}, onSubmit, onChange }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onChange?.(newData);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCascadePopulate = (fields: Record<string, any>) => {
    const newData = { ...formData, ...fields };
    setFormData(newData);
    onChange?.(newData);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    config.fields.forEach(field => {
      const value = formData[field.name];

      // Required validation
      if (field.isRequired && !value) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Additional validations
      if (field.validation) {
        field.validation.forEach(rule => {
          if (rule.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              newErrors[field.name] = 'Invalid email format';
            }
          }
          if (rule.type === 'min_length' && value) {
            const min = rule.config?.min || 0;
            if (value.length < min) {
              newErrors[field.name] = `Minimum ${min} characters required`;
            }
          }
          if (rule.type === 'max_length' && value) {
            const max = rule.config?.max || 255;
            if (value.length > max) {
              newErrors[field.name] = `Maximum ${max} characters allowed`;
            }
          }
        });
      }

      // Lookup field validation - reference must exist
      if (field.dataType === 'lookup' && field.isRequired && value) {
        // Validate reference exists (can be done async in a separate step)
        // For now, just validate that value is not empty
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const renderFields = () => {
    const layout = config.layouts;

    if (!layout || layout.type === 'single_column') {
      return (
        <VStack spacing={4} align="stretch">
          {config.fields.map(field => (
            <DynamicField
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={handleFieldChange}
              onCascadePopulate={handleCascadePopulate}
              error={errors[field.name]}
            />
          ))}
        </VStack>
      );
    }

    if (layout.type === 'two_column') {
      return (
        <SimpleGrid columns={2} spacing={4}>
          {config.fields.map(field => (
            <DynamicField
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={handleFieldChange}
              onCascadePopulate={handleCascadePopulate}
              error={errors[field.name]}
            />
          ))}
        </SimpleGrid>
      );
    }

    // Default to single column
    return (
      <VStack spacing={4} align="stretch">
        {config.fields.map(field => (
          <DynamicField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleFieldChange}
            onCascadePopulate={handleCascadePopulate}
            error={errors[field.name]}
          />
        ))}
      </VStack>
    );
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      {renderFields()}
    </Box>
  );
}
