'use client';

import { VStack, SimpleGrid, Box, Button } from '@chakra-ui/react';
import { DynamicField } from './DynamicField';
import { ModuleConfig, LayoutConfig } from '@/types/metadata';
import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { GSTCalculationService } from '@/lib/services/gst-calculation-service';

interface DynamicFormProps {
  config: ModuleConfig;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onChange?: (data: Record<string, any>) => void;
}

export interface DynamicFormRef {
  submit: () => void;
}

export const DynamicForm = forwardRef<DynamicFormRef, DynamicFormProps>(
  ({ config, initialData = {}, onSubmit, onChange }, ref) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update formData when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('[DynamicForm] 🔄 Updating formData from initialData:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Debug: Track formData changes
  useEffect(() => {
    console.log('[DynamicForm] 📊 formData STATE CHANGED:', {
      keys: Object.keys(formData),
      values: formData,
      isEmpty: Object.keys(formData).length === 0
    });
  }, [formData]);

  // Auto-calculate GST whenever relevant fields change
  useEffect(() => {
    // Check if this module uses GST fields
    const hasGSTFields = config.fields.some(f => f.name === 'gstPercentage');
    if (!hasGSTFields) return;

    // Calculate subtotal from line items if present
    let subtotal = formData.subtotal || 0;
    if (formData.items && Array.isArray(formData.items)) {
      subtotal = formData.items.reduce((sum: number, item: any) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return sum + (quantity * unitPrice);
      }, 0);
    }

    // Get GST percentage
    const gstPercentage = parseFloat(formData.gstPercentage) || 0;

    // Get GSTINs for determining IGST vs CGST+SGST
    const clientGSTIN = formData.gstin || formData.clientGSTIN || '';
    
    // TODO: Get business GSTIN from tenant settings
    // For now, we'll use a default Karnataka GSTIN
    const businessGSTIN = '29AABCU9603R1ZM'; // Default: Karnataka

    // Calculate GST
    if (subtotal > 0 && gstPercentage > 0) {
      const gstResult = GSTCalculationService.calculateGST({
        subtotal,
        gstPercentage,
        businessGSTIN,
        clientGSTIN,
      });

      // Apply discount if present
      const discountAmount = parseFloat(formData.discountAmount) || 0;
      const shippingCharge = parseFloat(formData.shippingCharge) || 0;

      // Calculate final total
      const finalTotal = gstResult.totalAfterGST - discountAmount + shippingCharge;

      // Update form data with calculated values (only if changed)
      const gstUpdates: Record<string, any> = {};
      
      if (formData.subtotal !== subtotal) gstUpdates.subtotal = subtotal;
      if (formData.gstType !== gstResult.gstType) gstUpdates.gstType = gstResult.gstType;
      if (formData.cgstPercentage !== gstResult.cgstPercentage) gstUpdates.cgstPercentage = gstResult.cgstPercentage;
      if (formData.sgstPercentage !== gstResult.sgstPercentage) gstUpdates.sgstPercentage = gstResult.sgstPercentage;
      if (formData.igstPercentage !== gstResult.igstPercentage) gstUpdates.igstPercentage = gstResult.igstPercentage;
      if (formData.cgstAmount !== gstResult.cgstAmount) gstUpdates.cgstAmount = gstResult.cgstAmount;
      if (formData.sgstAmount !== gstResult.sgstAmount) gstUpdates.sgstAmount = gstResult.sgstAmount;
      if (formData.igstAmount !== gstResult.igstAmount) gstUpdates.igstAmount = gstResult.igstAmount;
      if (formData.totalGSTAmount !== gstResult.totalGSTAmount) gstUpdates.totalGSTAmount = gstResult.totalGSTAmount;
      if (formData.totalAmount !== finalTotal) gstUpdates.totalAmount = finalTotal;

      // Only update if there are changes
      if (Object.keys(gstUpdates).length > 0) {
        const newData = { ...formData, ...gstUpdates };
        setFormData(newData);
        onChange?.(newData);
      }
    }
  }, [
    formData.items,
    formData.gstPercentage,
    formData.discountAmount,
    formData.shippingCharge,
    formData.gstin,
    formData.clientGSTIN,
  ]);

  const handleFieldChange = (name: string, value: any) => {
    console.log(`[DynamicForm] 🔄 handleFieldChange CALLED:`, { 
      fieldName: name,
      oldValue: formData[name],
      newValue: value,
      valueChanged: formData[name] !== value,
      oldType: typeof formData[name],
      newType: typeof value
    });
    
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      console.log(`[DynamicForm] 📦 Setting new formData state:`, {
        fieldChanged: name,
        newFieldValue: value,
        fullFormData: newData
      });
      onChange?.(newData);
      return newData;
    });
    
    console.log(`[DynamicForm] ✅ State update dispatched for field: ${name}`);
    console.log(`[DynamicForm] 📊 Current formData after update:`, formData);
    
    // Verify the state will update in next render
    setTimeout(() => {
      console.log(`[DynamicForm] 🔍 FormData in next tick (${name}):`, formData[name], '→', value);
    }, 0);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCascadePopulate = (fields: Record<string, any>) => {
    setFormData(prevData => {
      const changedFields = Object.entries(fields)
        .filter(([key, val]) => prevData[key] !== val)
        .map(([key]) => key);
      
      if (changedFields.length > 0) {
        console.log(`[DynamicForm] 🔗 Cascade populating ${changedFields.length} fields:`, changedFields.join(', '));
      }
      
      const newData = { ...prevData, ...fields };
      onChange?.(newData);
      return newData;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    console.log('[DynamicForm] 🔍 VALIDATING - Current formData:', formData);

    config.fields.forEach(field => {
      const value = formData[field.name];

      console.log(`[DynamicForm] Validating field ${field.name}:`, {
        value: value,
        isRequired: field.isRequired,
        hasValue: !!value,
        willError: field.isRequired && !value
      });

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

    console.log('[DynamicForm] 🔍 VALIDATION COMPLETE:', {
      totalFields: config.fields.length,
      errorCount: Object.keys(newErrors).length,
      errors: newErrors,
      formDataKeys: Object.keys(formData),
      formDataSample: Object.entries(formData).slice(0, 5)
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
          {config.fields.map(field => {
            const fieldValue = formData[field.name];
            return (
              <DynamicField
                key={field.name}
                field={field}
                value={fieldValue}
                onChange={handleFieldChange}
                onCascadePopulate={handleCascadePopulate}
                error={errors[field.name]}
              />
            );
          })}
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

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (validate()) {
        onSubmit(formData);
      }
    }
  }));

  return (
    <Box as="form" onSubmit={handleSubmit}>
      {renderFields()}
      {/* Hidden submit button for form submission */}
      <Button type="submit" display="none" />
    </Box>
  );
});

DynamicForm.displayName = 'DynamicForm';
