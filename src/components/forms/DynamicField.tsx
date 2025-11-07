'use client';

import { Input, Textarea, NumberInput, NumberInputField, Select, Checkbox, FormControl, FormLabel, FormErrorMessage, FormHelperText, Spinner, HStack, Button, Box, VStack } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { TableField } from './TableField';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  onCascadePopulate?: (fields: Record<string, any>) => void;
  error?: string;
}

export function DynamicField({ field, value, onChange, onCascadePopulate, error }: DynamicFieldProps) {
  const { data: session } = useSession();
  const [lookupOptions, setLookupOptions] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Load lookup options when component mounts or field changes
  useEffect(() => {
    if (field.uiType === 'lookup' && field.config?.targetModule && session?.user?.tenantId) {
      loadLookupOptions();
    }
  }, [field, session?.user?.tenantId]);

  const loadLookupOptions = async () => {
    if (!session?.user?.tenantId || !field.config?.targetModule) return;

    setLookupLoading(true);
    try {
      const response = await fetch(
        `/api/metadata/lookup?tenantId=${session.user.tenantId}&targetModule=${field.config.targetModule}&displayField=${field.config.displayField || 'name'}&searchFields=${(field.config.searchFields || ['name']).join(',')}`
      );
      
      if (response.ok) {
        const options = await response.json();
        setLookupOptions(options);
      }
    } catch (error) {
      console.error('Error loading lookup options:', error);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);

    // Handle cascade population if lookup field
    if (field.uiType === 'lookup' && onCascadePopulate && newValue) {
      const selectedOption = lookupOptions.find((opt) => opt.value === newValue);
      if (selectedOption?.record && field.config?.cascadeFields) {
        const cascadeData: Record<string, any> = {};
        Object.entries(field.config.cascadeFields).forEach(([sourceField, targetField]) => {
          if (selectedOption.record[sourceField] !== undefined) {
            cascadeData[targetField as string] = selectedOption.record[sourceField];
          }
        });
        if (Object.keys(cascadeData).length > 0) {
          onCascadePopulate(cascadeData);
        }
      }
    }
  };

  const renderInput = () => {
    switch (field.uiType) {
      case 'lookup':
        return (
          <HStack>
            <Select
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || 'Select...'}
              isDisabled={lookupLoading}
            >
              {lookupOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {lookupLoading && <Spinner size="sm" />}
          </HStack>
        );

      case 'table':
        return (
          <TableField
            field={field}
            value={value}
            onChange={onChange}
            error={error}
          />
        );

      case 'textbox':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.config?.maxLength}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.config?.maxLength}
          />
        );

      case 'number':
        return (
          <NumberInput
            value={value || ''}
            onChange={(valueString) => handleChange(Number(valueString))}
            min={field.config?.min ?? undefined}
            max={field.config?.max ?? undefined}
          >
            <NumberInputField placeholder={field.placeholder} />
          </NumberInput>
        );

      case 'dropdown':
        return (
          <Select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || 'Select...'}
          >
            {field.config?.options?.map((option: any) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            isChecked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
          >
            {field.label}
          </Checkbox>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'currency':
        return (
          <NumberInput
            value={value || ''}
            onChange={(valueString) => handleChange(Number(valueString))}
            precision={field.config?.decimals || 2}
            min={0}
          >
            <NumberInputField placeholder={field.placeholder} />
          </NumberInput>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (field.uiType === 'checkbox') {
    return (
      <FormControl isInvalid={!!error}>
        {renderInput()}
        {field.helpText && <FormHelperText>{field.helpText}</FormHelperText>}
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>
    );
  }

  if (field.uiType === 'table') {
    return (
      <FormControl isRequired={field.isRequired} isInvalid={!!error}>
        <FormLabel>{field.label}</FormLabel>
        {renderInput()}
        {field.helpText && <FormHelperText>{field.helpText}</FormHelperText>}
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>
    );
  }

  return (
    <FormControl isRequired={field.isRequired} isInvalid={!!error}>
      <FormLabel>{field.label}</FormLabel>
      {renderInput()}
      {field.helpText && <FormHelperText>{field.helpText}</FormHelperText>}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
