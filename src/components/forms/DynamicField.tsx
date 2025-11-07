'use client';

import { Input, Textarea, NumberInput, NumberInputField, Select, Checkbox, FormControl, FormLabel, FormErrorMessage, FormHelperText, Spinner, HStack, Button, Box, VStack } from '@chakra-ui/react';
import { FieldDefinition } from '@/types/metadata';
import { TableField } from './TableField';
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const selectRef = useRef<HTMLSelectElement>(null);
  const [internalValue, setInternalValue] = useState<any>(value);

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
