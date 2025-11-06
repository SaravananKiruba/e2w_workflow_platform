'use client';

import { Input, Textarea, NumberInput, NumberInputField, Select, Checkbox, FormControl, FormLabel, FormErrorMessage, FormHelperText } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';

interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
}

export function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  const renderInput = () => {
    switch (field.uiType) {
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

  return (
    <FormControl isRequired={field.isRequired} isInvalid={!!error}>
      <FormLabel>{field.label}</FormLabel>
      {renderInput()}
      {field.helpText && <FormHelperText>{field.helpText}</FormHelperText>}
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}
