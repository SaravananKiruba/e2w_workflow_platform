import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#f0f7e8',
      100: '#d4eecd',
      200: '#b7db25',
      300: '#a8d01f',
      400: '#8fc316',
      500: '#7dbd07',
      600: '#589507',
      700: '#50732f',
      800: '#3d5723',
      900: '#2a3b18',
    },
    primary: {
      50: '#f0f7e8',
      100: '#d4eecd',
      200: '#b7db25',
      300: '#a8d01f',
      400: '#8fc316',
      500: '#7dbd07',
      600: '#589507',
      700: '#50732f',
      800: '#3d5723',
      900: '#2a3b18',
    },
    accent: {
      50: '#fcfde8',
      100: '#f5f8b8',
      200: '#e8f087',
      300: '#dae956',
      400: '#cde225',
      500: '#b7db25',
      600: '#9abd1d',
      700: '#7d9f16',
      800: '#60810e',
      900: '#436307',
    },
    success: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#589507',
      600: '#50732f',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },
    warning: {
      50: '#fff3e0',
      100: '#ffe0b2',
      500: '#ff9800',
      600: '#fb8c00',
    },
    danger: {
      50: '#ffebee',
      100: '#ffcdd2',
      500: '#f44336',
      600: '#e53935',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : undefined,
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.600' : undefined,
          },
          _active: {
            bg: props.colorScheme === 'primary' ? 'primary.700' : undefined,
          },
        }),
      },
    },
    Badge: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : undefined,
          color: 'white',
        }),
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
    },
    Tabs: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
  },
});
