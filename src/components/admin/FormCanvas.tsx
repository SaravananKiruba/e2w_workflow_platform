'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  Tooltip,
  Icon,
  useColorModeValue,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FiTrash2, 
  FiEdit2, 
  FiMove,
  FiType,
  FiHash,
  FiCalendar,
  FiToggleLeft,
  FiMail,
  FiLink,
  FiList,
  FiTable,
} from 'react-icons/fi';

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

interface FormCanvasProps {
  fields: FieldDefinition[];
  selectedFieldId?: string;
  onFieldSelect: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldsReorder?: (fields: FieldDefinition[]) => void;
}

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

interface SortableFieldItemProps {
  field: FieldDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableFieldItem({ field, isSelected, onSelect, onDelete }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.500');

  const FieldIcon = FIELD_ICONS[field.dataType] || FiType;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      <Box
        ref={setNodeRef}
        style={style}
        bg={isSelected ? selectedBgColor : bgColor}
        border="2px solid"
        borderColor={isSelected ? selectedBorderColor : borderColor}
        borderRadius="md"
        p={3}
        cursor="pointer"
        onClick={onSelect}
        _hover={{ borderColor: 'blue.300' }}
        transition="all 0.2s"
      >
        <HStack spacing={3}>
          <Box {...attributes} {...listeners} cursor="grab" _active={{ cursor: 'grabbing' }}>
            <Icon as={FiMove} color="gray.400" />
          </Box>

          <Icon as={FieldIcon} color="blue.500" boxSize={5} />

          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontWeight="semibold" fontSize="sm">
                {field.label}
              </Text>
              {field.required && (
                <Badge colorScheme="red" fontSize="xs">
                  Required
                </Badge>
              )}
              {field.readOnly && (
                <Badge colorScheme="gray" fontSize="xs">
                  Read Only
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {field.name} ({field.dataType})
            </Text>
          </VStack>

          <HStack spacing={1}>
            <Tooltip label="Edit Field">
              <IconButton
                aria-label="Edit field"
                icon={<FiEdit2 />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
              />
            </Tooltip>
            <Tooltip label="Delete Field">
              <IconButton
                aria-label="Delete field"
                icon={<FiTrash2 />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Field
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete the field &quot;{field.label}&quot;? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
}: FormCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'form-canvas',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const emptyBgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box
      ref={setNodeRef}
      bg={bgColor}
      border="2px dashed"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      minH="500px"
      h="full"
      overflowY="auto"
    >
      {fields.length === 0 ? (
        <Box
          bg={emptyBgColor}
          borderRadius="md"
          p={12}
          textAlign="center"
          border="1px dashed"
          borderColor={borderColor}
        >
          <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
            No fields added yet
          </Text>
          <Text fontSize="sm" color="gray.400">
            Drag and drop fields from the library to get started
          </Text>
        </Box>
      ) : (
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <VStack spacing={3} align="stretch">
            {fields.map((field) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                isSelected={field.id === selectedFieldId}
                onSelect={() => onFieldSelect(field.id)}
                onDelete={() => onFieldDelete(field.id)}
              />
            ))}
          </VStack>
        </SortableContext>
      )}
    </Box>
  );
}
