'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Tooltip,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import { 
  FiType, 
  FiHash, 
  FiCalendar, 
  FiToggleLeft, 
  FiMail, 
  FiLink,
  FiList,
  FiTable,
  FiSearch,
} from 'react-icons/fi';

interface FieldType {
  id: string;
  category: string;
  name: string;
  label: string;
  description?: string;
  config: {
    icon?: string;
    defaultProps?: any;
  };
  isSystem: boolean;
}

interface FieldLibraryProps {
  onFieldSelect?: (fieldType: FieldType) => void;
}

// Icon mapping for field types
const FIELD_ICONS: Record<string, any> = {
  text: FiType,
  number: FiHash,
  date: FiCalendar,
  datetime: FiCalendar,
  boolean: FiToggleLeft,
  email: FiMail,
  url: FiLink,
  select: FiList,
  multiselect: FiList,
  lookup: FiLink,
  table: FiTable,
};

function DraggableFieldType({ fieldType }: { fieldType: FieldType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-type-${fieldType.id}`,
    data: { type: 'fieldType', fieldType },
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const FieldIcon = FIELD_ICONS[fieldType.name] || FiType;

  return (
    <Tooltip label={fieldType.description || fieldType.label} placement="top">
      <Box
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        p={3}
        cursor="grab"
        _hover={{ bg: hoverBgColor, borderColor: 'blue.400' }}
        _active={{ cursor: 'grabbing' }}
        transition="all 0.2s"
      >
        <VStack spacing={2} align="center">
          <Icon as={FieldIcon} boxSize={6} color="blue.500" />
          <Text fontSize="sm" fontWeight="medium" textAlign="center" noOfLines={2}>
            {fieldType.label}
          </Text>
          {fieldType.isSystem && (
            <Badge colorScheme="purple" fontSize="xs">
              System
            </Badge>
          )}
        </VStack>
      </Box>
    </Tooltip>
  );
}

export default function FieldLibrary({ onFieldSelect }: FieldLibraryProps) {
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchFieldTypes();
  }, []);

  async function fetchFieldTypes() {
    try {
      const response = await fetch('/api/metadata/library?category=field_types');
      if (response.ok) {
        const data = await response.json();
        setFieldTypes(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching field types:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group field types by category
  const groupedFieldTypes = fieldTypes.reduce((acc, fieldType) => {
    // Categorize based on data type
    let category = 'Other';
    if (['text', 'email', 'url'].includes(fieldType.name)) {
      category = 'Text Fields';
    } else if (['number'].includes(fieldType.name)) {
      category = 'Number Fields';
    } else if (['date', 'datetime'].includes(fieldType.name)) {
      category = 'Date/Time Fields';
    } else if (['boolean'].includes(fieldType.name)) {
      category = 'Boolean Fields';
    } else if (['select', 'multiselect'].includes(fieldType.name)) {
      category = 'Selection Fields';
    } else if (['lookup'].includes(fieldType.name)) {
      category = 'Relationship Fields';
    } else if (['table'].includes(fieldType.name)) {
      category = 'Complex Fields';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(fieldType);
    return acc;
  }, {} as Record<string, FieldType[]>);

  // Filter based on search query
  const filteredFieldTypes = fieldTypes.filter(
    (ft) =>
      ft.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ft.description && ft.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGroupedFieldTypes = filteredFieldTypes.reduce((acc, fieldType) => {
    let category = 'Other';
    if (['text', 'email', 'url'].includes(fieldType.name)) {
      category = 'Text Fields';
    } else if (['number'].includes(fieldType.name)) {
      category = 'Number Fields';
    } else if (['date', 'datetime'].includes(fieldType.name)) {
      category = 'Date/Time Fields';
    } else if (['boolean'].includes(fieldType.name)) {
      category = 'Boolean Fields';
    } else if (['select', 'multiselect'].includes(fieldType.name)) {
      category = 'Selection Fields';
    } else if (['lookup'].includes(fieldType.name)) {
      category = 'Relationship Fields';
    } else if (['table'].includes(fieldType.name)) {
      category = 'Complex Fields';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(fieldType);
    return acc;
  }, {} as Record<string, FieldType[]>);

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading field types...</Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      h="full"
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size="md" mb={2}>
            Field Library
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Drag fields from here to the canvas
          </Text>
        </Box>

        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5, 6]}>
          {Object.entries(filteredGroupedFieldTypes).map(([category, fields]) => (
            <AccordionItem key={category}>
              <h3>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="semibold">
                    {category} ({fields.length})
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4}>
                <SimpleGrid columns={2} spacing={3}>
                  {fields.map((fieldType) => (
                    <DraggableFieldType key={fieldType.id} fieldType={fieldType} />
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredFieldTypes.length === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No field types found matching &quot;{searchQuery}&quot;
          </Text>
        )}
      </VStack>
    </Box>
  );
}
