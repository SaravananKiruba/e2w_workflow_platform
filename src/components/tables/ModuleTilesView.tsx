'use client';

import {
  Box,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
  Flex,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { ModuleConfig, FieldDefinition } from '@/types/metadata';

interface ModuleRecord {
  id: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
  [key: string]: any;
}

interface ModuleTilesViewProps {
  records: ModuleRecord[];
  moduleConfig: ModuleConfig;
  moduleName: string;
  onView: (record: ModuleRecord) => void;
  onEdit: (record: ModuleRecord) => void;
  onDelete: (recordId: string) => void;
  onConvert?: (recordId: string, conversionType: string) => void;
  isConverting?: boolean;
}

export default function ModuleTilesView({
  records,
  moduleConfig,
  moduleName,
  onView,
  onEdit,
  onDelete,
  onConvert,
  isConverting = false,
}: ModuleTilesViewProps) {
  
  // Helper function to get field value from record
  const getFieldValue = (record: ModuleRecord, fieldName: string) => {
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      return record.data[fieldName];
    }
    return (record as any)[fieldName];
  };

  // Helper to extract string value from potentially object values
  const getStringValue = (value: any): string => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value.label || value.value || value.name || '';
    }
    return value ? String(value) : '';
  };

  // Helper to get display value
  const getDisplayValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.label) return value.label;
      if (value.value) return value.value;
      if (value.name) return value.name;
      return '-';
    }

    switch (field.dataType) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(value);
      case 'date':
      case 'datetime':
        return new Date(value).toLocaleDateString('en-IN');
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'table':
        return `${Array.isArray(value) ? value.length : 0} items`;
      default:
        return String(value).substring(0, 100);
    }
  };

  // Helper to get status badge color (dynamic from config)
  const getStatusColor = (status: any, moduleName: string) => {
    const statusStr = typeof status === 'object' ? (status?.label || status?.value || '') : (status || '');
    
    if (moduleName === 'Leads') {
      // Get status field config to check for color settings
      const statusField = moduleConfig.fields.find(f => f.name === 'status');
      const statusOption = statusField?.config?.options?.find((opt: any) => 
        (opt.label || opt.value) === statusStr
      );
      
      // Use configured color if available, otherwise use defaults
      if (statusOption?.color) {
        return statusOption.color;
      }
      
      // Fallback to smart defaults based on status name
      const lowerStatus = statusStr.toLowerCase();
      if (lowerStatus.includes('convert') || lowerStatus.includes('won')) return 'green';
      if (lowerStatus.includes('lost') || lowerStatus.includes('reject')) return 'red';
      if (lowerStatus.includes('qualify') || lowerStatus.includes('progress')) return 'purple';
      if (lowerStatus.includes('contact')) return 'cyan';
      if (lowerStatus.includes('new')) return 'blue';
      return 'gray';
    }
    
    // Generic status colors for other modules
    return statusStr === 'Converted' || statusStr === 'Paid' || statusStr === 'Completed' ? 'green' : 'blue';
  };

  // Helper to get priority color
  const getPriorityColor = (priority: any) => {
    const priorityStr = typeof priority === 'object' ? (priority?.label || priority?.value || '') : (priority || '');
    
    switch (priorityStr) {
      case 'Low': return 'gray';
      case 'Medium': return 'blue';
      case 'High': return 'orange';
      case 'Urgent': return 'red';
      default: return 'gray';
    }
  };

  // Get key fields to display on tile (name, email, phone, amount, status, etc.)
  const getKeyFields = () => {
    return moduleConfig.fields.filter((f) => {
      // Always show these important fields
      const importantFields = ['status', 'priority', 'name', 'email', 'phone', 'amount', 'totalAmount', 'clientName', 'leadName'];
      if (importantFields.some(important => f.name.toLowerCase().includes(important.toLowerCase()))) {
        return true;
      }
      // Show text, email, phone, currency, date fields
      return ['text', 'email', 'phone', 'currency', 'date', 'dropdown', 'lookup'].includes(f.dataType);
    }).slice(0, 6); // Show max 6 fields per tile
  };

  const keyFields = getKeyFields();

  // Get the primary field (usually first name field)
  const getPrimaryField = (record: ModuleRecord) => {
    const nameField = moduleConfig.fields.find(f => 
      f.name.toLowerCase().includes('name') && f.dataType === 'text'
    );
    if (nameField) {
      const value = getFieldValue(record, nameField.name);
      return getDisplayValue(nameField, value);
    }
    return 'Untitled';
  };

  const showConversionButton = (record: ModuleRecord) => {
    const status = getStringValue(getFieldValue(record, 'status'));
    
    if (moduleName === 'Leads' && status !== 'Converted') return 'Convert to Client';
    if (moduleName === 'Quotations' && status !== 'Converted') return 'Convert to Order';
    if (moduleName === 'Orders' && status !== 'Invoiced') return 'Convert to Invoice';
    return null;
  };

  const handleConversion = (recordId: string, record: ModuleRecord) => {
    if (!onConvert) return;
    
    if (moduleName === 'Leads') {
      onConvert(recordId, 'lead-to-client');
    } else if (moduleName === 'Quotations') {
      onConvert(recordId, 'quotation-to-order');
    } else if (moduleName === 'Orders') {
      onConvert(recordId, 'order-to-invoice');
    }
  };

  if (records.length === 0) {
    return (
      <Card bg="white">
        <CardBody textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500">
            No records found
          </Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Create your first {moduleConfig.displayName.toLowerCase()} to get started
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        md: 'repeat(2, 1fr)',
        lg: 'repeat(3, 1fr)',
        xl: 'repeat(4, 1fr)',
      }}
      gap={4}
    >
      {records.map((record) => {
        const statusValue = getFieldValue(record, 'status');
        const priorityValue = getFieldValue(record, 'priority');
        const conversionButton = showConversionButton(record);

        return (
          <GridItem key={record.id}>
            <Card
              bg="white"
              shadow="md"
              borderRadius="lg"
              transition="all 0.2s"
              _hover={{
                shadow: 'lg',
                transform: 'translateY(-2px)',
              }}
              height="100%"
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <Heading size="sm" color="primary.700" noOfLines={2}>
                      {getPrimaryField(record)}
                    </Heading>
                    <HStack spacing={2}>
                      {statusValue && (
                        <Badge colorScheme={getStatusColor(statusValue, moduleName)} fontSize="xs">
                          {getDisplayValue(
                            moduleConfig.fields.find(f => f.name === 'status')!,
                            statusValue
                          )}
                        </Badge>
                      )}
                      {priorityValue && (
                        <Badge colorScheme={getPriorityColor(priorityValue)} fontSize="xs">
                          {getDisplayValue(
                            moduleConfig.fields.find(f => f.name === 'priority')!,
                            priorityValue
                          )}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </Flex>
              </CardHeader>

              <CardBody pt={2}>
                <VStack align="stretch" spacing={2}>
                  {/* Key Fields */}
                  {keyFields.map((field) => {
                    const value = getFieldValue(record, field.name);
                    if (!value && value !== 0) return null;
                    if (field.name === 'status' || field.name === 'priority') return null; // Already shown in header
                    
                    return (
                      <Flex key={field.name} justify="space-between" fontSize="sm">
                        <Text color="gray.600" fontWeight="medium" noOfLines={1}>
                          {field.label}:
                        </Text>
                        <Text 
                          color="gray.800" 
                          fontWeight={field.dataType === 'currency' ? 'bold' : 'normal'}
                          noOfLines={1}
                          ml={2}
                        >
                          {getDisplayValue(field, value)}
                        </Text>
                      </Flex>
                    );
                  })}

                  <Divider my={2} />

                  {/* Metadata */}
                  <Text fontSize="xs" color="gray.500">
                    Created: {new Date(record.createdAt).toLocaleDateString('en-IN')}
                  </Text>

                  {/* Actions */}
                  <HStack spacing={1} pt={2}>
                    <Tooltip label="View Details">
                      <IconButton
                        aria-label="View"
                        icon={<Text>👁️</Text>}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => onView(record)}
                        flex={1}
                      />
                    </Tooltip>
                    <Tooltip label="Edit">
                      <IconButton
                        aria-label="Edit"
                        icon={<Text>✏️</Text>}
                        size="sm"
                        variant="ghost"
                        colorScheme="primary"
                        onClick={() => onEdit(record)}
                        flex={1}
                      />
                    </Tooltip>
                    {conversionButton && onConvert && (
                      <Tooltip label={conversionButton}>
                        <IconButton
                          aria-label={conversionButton}
                          icon={<Text>✓</Text>}
                          size="sm"
                          variant="ghost"
                          colorScheme="green"
                          isLoading={isConverting}
                          onClick={() => handleConversion(record.id, record)}
                          flex={1}
                        />
                      </Tooltip>
                    )}
                    <Tooltip label="Delete">
                      <IconButton
                        aria-label="Delete"
                        icon={<Text>🗑️</Text>}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => onDelete(record.id)}
                        flex={1}
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        );
      })}
    </Grid>
  );
}
