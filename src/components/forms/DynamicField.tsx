'use client';

import { Input, Textarea, NumberInput, NumberInputField, Select, Checkbox, FormControl, FormLabel, FormErrorMessage, FormHelperText, Spinner, HStack, Button, Box, VStack } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { TableField } from './TableField';
import { useEffect, useState, useCallback } from 'react';
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
        targetModule: field.config?.targetModule,
        displayField: field.config?.displayField,
        hasCascadeFields: !!field.config?.cascadeFields
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLookupOptions = useCallback(async () => {
    console.log(`[DynamicField ${field.name}] loadLookupOptions called`);
    console.log(`[DynamicField ${field.name}] Session:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      tenantId: session?.user?.tenantId,
      email: session?.user?.email,
      fullUser: session?.user
    });
    console.log(`[DynamicField ${field.name}] Field config:`, {
      uiType: field.uiType,
      targetModule: field.config?.targetModule,
      displayField: field.config?.displayField,
      searchFields: field.config?.searchFields
    });
    
    if (!session?.user?.tenantId) {
      console.error(`[DynamicField ${field.name}] ❌ Missing tenantId in session!`);
      console.error(`[DynamicField ${field.name}] Session object:`, JSON.stringify(session, null, 2));
      return;
    }
    
    if (!field.config?.targetModule) {
      console.error(`[DynamicField ${field.name}] ❌ Missing targetModule in field config!`);
      return;
    }

    setLookupLoading(true);
    try {
      const url = `/api/metadata/lookup?tenantId=${session.user.tenantId}&targetModule=${field.config.targetModule}&displayField=${field.config.displayField || 'name'}&searchFields=${(field.config.searchFields || ['name']).join(',')}`;
      console.log(`[DynamicField ${field.name}] 🌐 Fetching from:`, url);
      
      const response = await fetch(url);
      console.log(`[DynamicField ${field.name}] Response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[DynamicField ${field.name}] ✅ Raw response data:`, data);
        console.log(`[DynamicField ${field.name}] Response type:`, Array.isArray(data) ? 'Array' : typeof data);
        
        // Handle both array and {records: []} format
        const options = Array.isArray(data) ? data : (data.records || []);
        console.log(`[DynamicField ${field.name}] ✅ Processed options:`, options);
        console.log(`[DynamicField ${field.name}] ✅ Setting ${options.length} options in state`);
        setLookupOptions(options);
      } else {
        const errorText = await response.text();
        console.error(`[DynamicField ${field.name}] ❌ HTTP ${response.status}:`, errorText);
        setLookupOptions([]);
      }
    } catch (error) {
      console.error(`[DynamicField ${field.name}] ❌ Exception:`, error);
      setLookupOptions([]);
    } finally {
      setLookupLoading(false);
      console.log(`[DynamicField ${field.name}] Loading complete`);
    }
  }, [session, field.name, field.config?.targetModule, field.config?.displayField, field.config?.searchFields]);

  // Load lookup options when component mounts or field changes
  useEffect(() => {
    console.log(`[DynamicField ${field.name}] useEffect triggered`, {
      uiType: field.uiType,
      targetModule: field.config?.targetModule,
      tenantId: session?.user?.tenantId,
      hasSession: !!session,
      sessionStatus: session ? 'loaded' : 'not loaded'
    });
    
    if (field.uiType === 'lookup' && field.config?.targetModule && session?.user?.tenantId) {
      console.log(`[DynamicField ${field.name}] ✓ All conditions met, calling loadLookupOptions`);
      loadLookupOptions();
    } else {
      console.log(`[DynamicField ${field.name}] ✗ Conditions not met:`, {
        isLookup: field.uiType === 'lookup',
        hasTargetModule: !!field.config?.targetModule,
        hasTenantId: !!session?.user?.tenantId
      });
    }
  }, [field.name, field.uiType, field.config?.targetModule, session?.user?.tenantId, loadLookupOptions]);

  const handleChange = (newValue: any) => {
    console.log(`[DynamicField ${field.name}] � handleChange CALLED:`, {
      fieldName: field.name,
      oldValue: value,
      newValue: newValue,
      valueChanged: newValue !== value,
      oldType: typeof value,
      newType: typeof newValue
    });
    
    // Call parent's onChange
    onChange(field.name, newValue);
    
    console.log(`[DynamicField ${field.name}] ✅ onChange callback executed`);

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
        // Normalize value to string for select element
        const selectValue = value === null || value === undefined ? '' : String(value);
        const matchingOption = lookupOptions.find(o => o.value === value);
        
        // Only log when there's a potential issue or during selection
        if (!lookupLoading && lookupOptions.length === 0 && !matchingOption && value) {
          console.warn(`[DynamicField ${field.name}] ⚠️ Value set but no matching option:`, {
            currentValue: value,
            valueType: typeof value,
            optionsCount: lookupOptions.length
          });
        }
        
        return (
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Box flex={1}>
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const selectedOption = lookupOptions.find(o => o.value === selectedValue);
                    
                    console.log(`[DynamicField ${field.name}] 📝 SELECT onChange FIRED:`, {
                      rawEventValue: e.target.value,
                      selectedValue: selectedValue,
                      isEmpty: selectedValue === '',
                      fromValue: value,
                      toValue: selectedValue || null,
                      selectedLabel: selectedOption?.label || '(none)',
                      allOptions: lookupOptions.map(o => `${o.label}=${o.value}`)
                    });
                    
                    // Pass empty string as-is or the selected value
                    // The form will handle empty strings appropriately
                    handleChange(selectedValue || null);
                  }}
                  disabled={lookupLoading}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {lookupOptions.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Box>
              {lookupLoading && <Spinner size="sm" />}
              <Button 
                size="sm" 
                onClick={loadLookupOptions}
                isDisabled={lookupLoading}
                title="Refresh options"
              >
                ↻
              </Button>
            </HStack>
            {!lookupLoading && lookupOptions.length === 0 && (
              <Box fontSize="sm" color="orange.500">
                ⚠️ No {field.config?.targetModule} records found. Check browser console for details.
              </Box>
            )}
            {!lookupLoading && lookupOptions.length > 0 && (
              <Box fontSize="sm" color="green.500">
                ✓ Loaded {lookupOptions.length} {field.config?.targetModule} records
              </Box>
            )}
            {lookupLoading && (
              <Box fontSize="sm" color="gray.500">
                Loading {field.config?.targetModule} records...
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
