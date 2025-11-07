'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Select,
  FormControl,
  FormLabel,
  Text,
  SimpleGrid,
  IconButton,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import {
  FiLayout,
  FiColumns,
  FiGrid,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiMove,
} from 'react-icons/fi';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export interface LayoutSection {
  id: string;
  name: string;
  title: string;
  columns: number;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface LayoutTab {
  id: string;
  name: string;
  label: string;
  sections: LayoutSection[];
}

export interface FormLayout {
  type: 'single' | 'two-column' | 'three-column' | 'tabbed' | 'wizard';
  tabs?: LayoutTab[];
  sections?: LayoutSection[];
}

interface LayoutDesignerProps {
  layout: FormLayout;
  onChange: (layout: FormLayout) => void;
  availableFields: string[];
}

const LAYOUT_TEMPLATES = [
  {
    value: 'single',
    label: 'Single Column',
    icon: FiLayout,
    description: 'Traditional form layout with one column',
  },
  {
    value: 'two-column',
    label: 'Two Columns',
    icon: FiColumns,
    description: 'Split form into two columns',
  },
  {
    value: 'three-column',
    label: 'Three Columns',
    icon: FiGrid,
    description: 'Advanced layout with three columns',
  },
  {
    value: 'tabbed',
    label: 'Tabbed Layout',
    icon: FiLayers,
    description: 'Organize sections into tabs',
  },
  {
    value: 'wizard',
    label: 'Wizard (Multi-Step)',
    icon: FiMove,
    description: 'Step-by-step form wizard',
  },
];

const COLUMN_OPTIONS = [
  { value: 1, label: 'Full Width (1 column)' },
  { value: 2, label: '2 Columns' },
  { value: 3, label: '3 Columns' },
  { value: 4, label: '4 Columns' },
];

export default function LayoutDesigner({
  layout,
  onChange,
  availableFields,
}: LayoutDesignerProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const changeLayoutType = (type: FormLayout['type']) => {
    const newLayout: FormLayout = { type };
    
    if (type === 'tabbed' || type === 'wizard') {
      newLayout.tabs = [{
        id: `tab-${Date.now()}`,
        name: 'tab1',
        label: 'General Information',
        sections: [{
          id: `section-${Date.now()}`,
          name: 'section1',
          title: 'Basic Details',
          columns: 1,
          fields: [],
        }],
      }];
    } else {
      newLayout.sections = [{
        id: `section-${Date.now()}`,
        name: 'section1',
        title: 'Basic Details',
        columns: type === 'single' ? 1 : type === 'two-column' ? 2 : 3,
        fields: [],
      }];
    }
    
    onChange(newLayout);
  };

  const addSection = (tabId?: string) => {
    const newSection: LayoutSection = {
      id: `section-${Date.now()}`,
      name: `section${(layout.sections?.length || 0) + 1}`,
      title: 'New Section',
      columns: 1,
      fields: [],
    };

    if (tabId && layout.tabs) {
      const updatedTabs = layout.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, sections: [...tab.sections, newSection] }
          : tab
      );
      onChange({ ...layout, tabs: updatedTabs });
    } else if (layout.sections) {
      onChange({ ...layout, sections: [...layout.sections, newSection] });
    }
  };

  const removeSection = (sectionId: string, tabId?: string) => {
    if (tabId && layout.tabs) {
      const updatedTabs = layout.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, sections: tab.sections.filter(s => s.id !== sectionId) }
          : tab
      );
      onChange({ ...layout, tabs: updatedTabs });
    } else if (layout.sections) {
      onChange({
        ...layout,
        sections: layout.sections.filter(s => s.id !== sectionId),
      });
    }
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<LayoutSection>, tabId?: string) => {
    if (tabId && layout.tabs) {
      const updatedTabs = layout.tabs.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              sections: tab.sections.map(s =>
                s.id === sectionId ? { ...s, ...updates } : s
              ),
            }
          : tab
      );
      onChange({ ...layout, tabs: updatedTabs });
    } else if (layout.sections) {
      onChange({
        ...layout,
        sections: layout.sections.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      });
    }
  };

  const addTab = () => {
    if (!layout.tabs) return;
    
    const newTab: LayoutTab = {
      id: `tab-${Date.now()}`,
      name: `tab${layout.tabs.length + 1}`,
      label: 'New Tab',
      sections: [{
        id: `section-${Date.now()}`,
        name: 'section1',
        title: 'Section',
        columns: 1,
        fields: [],
      }],
    };
    
    onChange({ ...layout, tabs: [...layout.tabs, newTab] });
  };

  const removeTab = (tabId: string) => {
    if (!layout.tabs) return;
    onChange({
      ...layout,
      tabs: layout.tabs.filter(t => t.id !== tabId),
    });
    if (selectedTab === tabId) {
      setSelectedTab(null);
    }
  };

  const updateTab = (tabId: string, updates: Partial<LayoutTab>) => {
    if (!layout.tabs) return;
    onChange({
      ...layout,
      tabs: layout.tabs.map(t =>
        t.id === tabId ? { ...t, ...updates } : t
      ),
    });
  };

  const renderSection = (section: LayoutSection, tabId?: string) => {
    const isSelected = selectedSection === section.id;
    
    return (
      <Box
        key={section.id}
        p={3}
        borderWidth={2}
        borderColor={isSelected ? 'blue.500' : borderColor}
        borderRadius="md"
        bg={isSelected ? useColorModeValue('blue.50', 'blue.900') : bgColor}
        cursor="pointer"
        onClick={() => setSelectedSection(section.id)}
        _hover={{ borderColor: 'blue.400' }}
      >
        <HStack justify="space-between" mb={2}>
          <HStack>
            <Badge colorScheme="purple" fontSize="xs">
              {section.columns} {section.columns === 1 ? 'col' : 'cols'}
            </Badge>
            <Text fontSize="sm" fontWeight="medium">
              {section.title}
            </Text>
          </HStack>
          <HStack spacing={1}>
            <Tooltip label="Edit section">
              <IconButton
                aria-label="Edit"
                icon={<FiEdit2 />}
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSection(section.id);
                }}
              />
            </Tooltip>
            <Tooltip label="Delete section">
              <IconButton
                aria-label="Delete"
                icon={<FiTrash2 />}
                size="xs"
                colorScheme="red"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSection(section.id, tabId);
                }}
              />
            </Tooltip>
          </HStack>
        </HStack>

        <Box
          p={2}
          borderWidth={1}
          borderStyle="dashed"
          borderColor={borderColor}
          borderRadius="md"
          minH="60px"
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <SimpleGrid columns={section.columns} spacing={2}>
            {section.fields.map((field, idx) => (
              <Box
                key={idx}
                p={2}
                bg={bgColor}
                borderWidth={1}
                borderColor={borderColor}
                borderRadius="sm"
                fontSize="xs"
              >
                {field}
              </Box>
            ))}
          </SimpleGrid>
          {section.fields.length === 0 && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Drag fields here
            </Text>
          )}
        </Box>
      </Box>
    );
  };

  const renderSectionEditor = () => {
    if (!selectedSection) {
      return (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm">Select a section to edit its properties</Text>
        </Box>
      );
    }

    let section: LayoutSection | undefined;
    let tabId: string | undefined;

    if (layout.tabs) {
      for (const tab of layout.tabs) {
        const foundSection = tab.sections.find(s => s.id === selectedSection);
        if (foundSection) {
          section = foundSection;
          tabId = tab.id;
          break;
        }
      }
    } else if (layout.sections) {
      section = layout.sections.find(s => s.id === selectedSection);
    }

    if (!section) return null;

    return (
      <VStack spacing={3} align="stretch" p={4}>
        <Text fontSize="sm" fontWeight="bold">Section Properties</Text>
        
        <FormControl>
          <FormLabel fontSize="xs">Section Name (ID)</FormLabel>
          <Input
            size="sm"
            value={section.name}
            onChange={(e) => updateSection(section.id, { name: e.target.value }, tabId)}
            placeholder="e.g., basicDetails"
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs">Section Title</FormLabel>
          <Input
            size="sm"
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value }, tabId)}
            placeholder="e.g., Basic Information"
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="xs">Number of Columns</FormLabel>
          <Select
            size="sm"
            value={section.columns}
            onChange={(e) => updateSection(section.id, { columns: Number(e.target.value) }, tabId)}
          >
            {COLUMN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <input
            type="checkbox"
            checked={section.collapsible || false}
            onChange={(e) => updateSection(section.id, { collapsible: e.target.checked }, tabId)}
          />
          <FormLabel fontSize="xs" mb={0} ml={2}>
            Collapsible Section
          </FormLabel>
        </FormControl>

        {section.collapsible && (
          <FormControl display="flex" alignItems="center">
            <input
              type="checkbox"
              checked={section.defaultCollapsed || false}
              onChange={(e) => updateSection(section.id, { defaultCollapsed: e.target.checked }, tabId)}
            />
            <FormLabel fontSize="xs" mb={0} ml={2}>
              Collapsed by Default
            </FormLabel>
          </FormControl>
        )}
      </VStack>
    );
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Layout Template Selector */}
      <Box>
        <FormLabel fontSize="sm" mb={2}>Layout Template</FormLabel>
        <SimpleGrid columns={5} spacing={2}>
          {LAYOUT_TEMPLATES.map(template => {
            const Icon = template.icon;
            const isSelected = layout.type === template.value;
            
            return (
              <Tooltip key={template.value} label={template.description} placement="top">
                <Box
                  p={3}
                  borderWidth={2}
                  borderColor={isSelected ? 'blue.500' : borderColor}
                  borderRadius="md"
                  bg={isSelected ? useColorModeValue('blue.50', 'blue.900') : bgColor}
                  cursor="pointer"
                  textAlign="center"
                  onClick={() => changeLayoutType(template.value as FormLayout['type'])}
                  _hover={{ borderColor: 'blue.400', bg: hoverBg }}
                >
                  <Icon size={24} style={{ margin: '0 auto 8px' }} />
                  <Text fontSize="xs" fontWeight={isSelected ? 'bold' : 'normal'}>
                    {template.label}
                  </Text>
                </Box>
              </Tooltip>
            );
          })}
        </SimpleGrid>
      </Box>

      <Divider />

      {/* Layout Canvas */}
      <HStack align="start" spacing={4}>
        {/* Main Canvas */}
        <Box flex={1}>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium">
              Layout Canvas
            </Text>
          </HStack>

          {(layout.type === 'tabbed' || layout.type === 'wizard') && layout.tabs ? (
            <VStack spacing={3} align="stretch">
              <HStack>
                <Text fontSize="xs" fontWeight="medium">Tabs:</Text>
                <Button size="xs" leftIcon={<FiPlus />} onClick={addTab}>
                  Add Tab
                </Button>
              </HStack>
              
              <Tabs variant="enclosed" size="sm">
                <TabList>
                  {layout.tabs.map(tab => (
                    <Tab key={tab.id}>
                      <HStack spacing={2}>
                        <Text>{tab.label}</Text>
                        <IconButton
                          aria-label="Remove tab"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTab(tab.id);
                          }}
                        />
                      </HStack>
                    </Tab>
                  ))}
                </TabList>

                <TabPanels>
                  {layout.tabs.map(tab => (
                    <TabPanel key={tab.id}>
                      <VStack spacing={3} align="stretch">
                        <Input
                          size="sm"
                          value={tab.label}
                          onChange={(e) => updateTab(tab.id, { label: e.target.value })}
                          placeholder="Tab label"
                        />
                        
                        {tab.sections.map(section => renderSection(section, tab.id))}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<FiPlus />}
                          onClick={() => addSection(tab.id)}
                        >
                          Add Section
                        </Button>
                      </VStack>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              {layout.sections?.map(section => renderSection(section))}
              
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiPlus />}
                onClick={() => addSection()}
              >
                Add Section
              </Button>
            </VStack>
          )}
        </Box>

        {/* Properties Panel */}
        <Box
          w="300px"
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="md"
          bg={bgColor}
        >
          {renderSectionEditor()}
        </Box>
      </HStack>
    </VStack>
  );
}
