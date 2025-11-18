'use client';

import { Input, Textarea, NumberInput, NumberInputField, Select, Checkbox, FormControl, FormLabel, FormErrorMessage, FormHelperText, Spinner, HStack, Button, Box, VStack } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { TableField } from './TableField';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLookupOptions } from '@/lib/hooks/use-lookup-query';

interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  onCascadePopulate?: (fields: Record<string, any>) => void;
  error?: string;
}

export function DynamicField({ field, value, onChange, onCascadePopulate, error }: DynamicFieldProps) {
  const { data: session } = useSession();
  const selectRef = useRef<HTMLSelectElement>(null);
  const [internalValue, setInternalValue] = useState<any>(value);

  // Backward compatibility: support both config and lookupConfig
  const lookupConfig = field.config || field.lookupConfig || {};
  const targetModule = lookupConfig.targetModule;
  
  // Use React Query for lookup data - automatically cached and refreshed
  const lookupQueryParams = field.uiType === 'lookup' && targetModule && session?.user?.tenantId
    ? {
        tenantId: session.user.tenantId,
        targetModule: targetModule,
        displayField: lookupConfig.displayField || 'name',
        searchFields: lookupConfig.searchFields || ['name'],
      }
    : null;

  const { 
    data: lookupOptions = [], 
    isLoading: lookupLoading,
    error: lookupError 
  } = useLookupOptions(lookupQueryParams);

  // Debug: Track what causes re-renders
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  
  // Sync internal value when prop changes (but only if it's a real change, not a stale state)
  useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      console.log(`[DynamicField ${field.name}] � Syncing value from parent:`, internalValue, '→', value);
      setInternalValue(value);
    }
  }, [value, field.name]);
  
  useEffect(() => {
    if (field.uiType === 'lookup') {
      console.log(`[DynamicField ${field.name}] 🔄 COMPONENT RE-RENDER #${renderCountRef.current}`, {
        valueProp: value,
        internalValue: internalValue,
        optionsCount: lookupOptions.length,
        loading: lookupLoading
      });
    }
  });

  // Debug: Log when value prop changes (only for lookup fields with actual changes)
  useEffect(() => {
    if (field.uiType === 'lookup') {
      console.log(`[DynamicField ${field.name}] 🔔 VALUE PROP CHANGED (received from parent):`, {
        newValue: value,
        valueType: typeof value,
        isUndefined: value === undefined,
        isNull: value === null,
        isEmpty: value === '',
        hasMatchingOption: lookupOptions.some(o => o.value === value)
      });
    }
  }, [value, field.name, field.uiType, lookupOptions]);

  // Debug: Log field initialization (only once)
  useEffect(() => {
    if (field.uiType === 'lookup') {
      console.log(`[DynamicField ${field.name}] 🔧 Lookup field initialized:`, {
        targetModule: targetModule,
        displayField: lookupConfig.displayField,
        hasCascadeFields: !!lookupConfig.cascadeFields
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed loadLookupOptions - now handled by React Query hook above
  // The hook automatically:
  // - Fetches data when params change
  // - Caches results
  // - Refetches when invalidated
  // - Provides loading/error states

  const handleChange = (newValue: any) => {
    console.log(`[DynamicField ${field.name}] � handleChange CALLED:`, {
      fieldName: field.name,
      oldValue: internalValue,
      newValue: newValue,
      valueChanged: newValue !== internalValue,
      oldType: typeof internalValue,
      newType: typeof newValue
    });
    
    // Call parent's onChange
    onChange(field.name, newValue);
    
    console.log(`[DynamicField ${field.name}] ✅ onChange callback executed`);

    // Handle cascade population if lookup field
    if (field.uiType === 'lookup' && onCascadePopulate && newValue) {
      const selectedOption = lookupOptions.find((opt) => opt.value === newValue);
      
      if (selectedOption?.record && lookupConfig.cascadeFields) {
        const cascadeData: Record<string, any> = {};
        const record = selectedOption.record;
        Object.entries(lookupConfig.cascadeFields).forEach(([sourceField, targetField]) => {
          if (record[sourceField] !== undefined) {
            cascadeData[targetField as string] = record[sourceField];
          }
        });
        if (Object.keys(cascadeData).length > 0) {
          console.log(`[DynamicField ${field.name}] 🔗 Cascading data to ${Object.keys(cascadeData).length} fields:`, 
            Object.keys(cascadeData).map(k => `${k}=${cascadeData[k]}`).join(', ')
          );
          onCascadePopulate(cascadeData);
        }
      }
    }
  };

  const renderInput = () => {
    switch (field.uiType) {
      case 'lookup':
        // Use internal value to maintain state
        const selectValue = internalValue === null || internalValue === undefined ? '' : String(internalValue);
        const matchingOption = lookupOptions.find(o => String(o.value) === String(internalValue));
        
        console.log(`[DynamicField ${field.name}] 🎯 Rendering lookup field:`, {
          currentValue: internalValue,
          selectValue: selectValue,
          hasMatchingOption: !!matchingOption,
          matchingLabel: matchingOption?.label,
          optionsCount: lookupOptions.length,
          firstOption: lookupOptions[0] ? { label: lookupOptions[0].label, value: lookupOptions[0].value } : null
        });
        
        // Only log when there's a potential issue or during selection
        if (!lookupLoading && lookupOptions.length === 0 && !matchingOption && internalValue) {
          console.warn(`[DynamicField ${field.name}] ⚠️ Value set but no matching option:`, {
            currentValue: internalValue,
            valueType: typeof internalValue,
            optionsCount: lookupOptions.length
          });
        }
        
        return (
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Box flex={1} position="relative">
                <select
                  ref={selectRef}
                  name={field.name}
                  id={`select-${field.name}`}
                  value={selectValue}
                  onChange={(e) => {
                    console.log(`[DynamicField ${field.name}] 🚨 onChange TRIGGERED! Render #${renderCountRef.current}`);
                    
                    const selectedValue = e.target.value;
                    console.log(`[DynamicField ${field.name}] Raw value from event:`, selectedValue);
                    
                    const selectedOption = lookupOptions.find(o => String(o.value) === selectedValue);
                    
                    console.log(`[DynamicField ${field.name}] 📝 SELECT onChange FIRED:`, {
                      rawEventValue: e.target.value,
                      selectedValue: selectedValue,
                      isEmpty: selectedValue === '',
                      fromValue: internalValue,
                      toValue: selectedValue === '' ? null : selectedValue,
                      selectedLabel: selectedOption?.label || '(none)',
                      allOptions: lookupOptions.map(o => `${o.label}=${o.value}`)
                    });
                    
                    // Update internal state immediately
                    const newValue = selectedValue === '' ? null : selectedValue;
                    setInternalValue(newValue);
                    console.log(`[DynamicField ${field.name}] ⚡ Calling handleChange with:`, newValue);
                    handleChange(newValue);
                  }}
                  onFocus={(e) => {
                    console.log(`[DynamicField ${field.name}] 🎯 SELECT FOCUSED`);
                  }}
                  onBlur={(e) => {
                    console.log(`[DynamicField ${field.name}] 👋 SELECT BLURRED, value:`, e.target.value);
                  }}
                  onClick={(e) => {
                    console.log(`[DynamicField ${field.name}] 🖱️ SELECT CLICKED`);
                  }}
                  onMouseDown={(e) => {
                    console.log(`[DynamicField ${field.name}] 🖱️ SELECT MOUSE DOWN`);
                  }}
                  disabled={lookupLoading}
                  className="lookup-select"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '2px solid #3182CE',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    appearance: 'auto',
                    WebkitAppearance: 'menulist',
                    MozAppearance: 'menulist'
                  }}
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {lookupOptions.map((option: any) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Box>
              {lookupLoading && <Spinner size="sm" />}
            </HStack>
            {/* Show loading state */}
            {lookupLoading && (
              <Box fontSize="sm" color="gray.500">
                Loading {targetModule} records...
              </Box>
            )}
            {/* Show error if fetch failed */}
            {!lookupLoading && lookupError && (
              <Box fontSize="sm" color="red.500">
                ❌ Error loading {targetModule}: {lookupError instanceof Error ? lookupError.message : 'Unknown error'}
              </Box>
            )}
            {/* Show warning if no records but no error */}
            {!lookupLoading && !lookupError && lookupOptions.length === 0 && (
              <Box fontSize="sm" color="orange.500">
                ⚠️ No {targetModule} records found. Create one first.
              </Box>
            )}
            {/* Show success state */}
            {!lookupLoading && !lookupError && lookupOptions.length > 0 && (
              <Box fontSize="sm" color="green.500">
                ✓ Loaded {lookupOptions.length} {targetModule} record{lookupOptions.length === 1 ? '' : 's'}
              </Box>
            )}
          </VStack>
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
            <option value="">{field.placeholder || 'Select...'}</option>
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
