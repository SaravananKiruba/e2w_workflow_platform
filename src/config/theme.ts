import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    success: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      500: '#4caf50',
      600: '#43a047',
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
        colorScheme: 'brand',
      },
    },
  },
});
