import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Custom color palette based on: #ce9466, #4d2b1e, #a06a4a, #281915, #5d4035
export const theme = extendTheme({
  config,
  colors: {
    // Primary Tan - Main brand color (#ce9466)
    brand: {
      50: '#faf6f2',
      100: '#f0e6d9',
      200: '#e5d6bf',
      300: '#dbc6a6',
      400: '#d0b68c',
      500: '#ce9466',  // Main brand color
      600: '#b87a52',
      700: '#a1613d',
      800: '#8b4729',
      900: '#742e14',
    },
    primary: {
      50: '#faf6f2',
      100: '#f0e6d9',
      200: '#e5d6bf',
      300: '#dbc6a6',
      400: '#d0b68c',
      500: '#ce9466',  // Main primary color
      600: '#b87a52',
      700: '#a1613d',
      800: '#8b4729',
      900: '#742e14',
    },
    // Secondary Brown - Dark chocolate (#4d2b1e)
    secondary: {
      50: '#f2ede9',
      100: '#d9ccc3',
      200: '#c0ab9d',
      300: '#a78a77',
      400: '#8e6951',
      500: '#4d2b1e',  // Secondary color
      600: '#3e2218',
      700: '#2f1912',
      800: '#20110c',
      900: '#110806',
    },
    // Accent Mid Brown - Warm highlight (#a06a4a)
    accent: {
      50: '#f7f2ed',
      100: '#e7d9ce',
      200: '#d7c0af',
      300: '#c7a790',
      400: '#b78e71',
      500: '#a06a4a',  // Accent color
      600: '#80553b',
      700: '#60402c',
      800: '#402b1d',
      900: '#20150e',
    },
    // Deep Brown - Darkest base (#281915)
    olive: {
      50: '#ede9e8',
      100: '#cfc3c0',
      200: '#b19d98',
      300: '#937770',
      400: '#755148',
      500: '#5d4035',  // Rich brown
      600: '#4a332a',
      700: '#37261f',
      800: '#241a15',
      900: '#110d0a',
    },
    // Almost Black - Deep background (#281915)
    dark: {
      50: '#ede9e7',
      100: '#cfc3bf',
      200: '#b19d97',
      300: '#93776f',
      400: '#755147',
      500: '#281915',  // Dark base color
      600: '#201411',
      700: '#180f0d',
      800: '#100a08',
      900: '#080504',
    },
    // Success - Enhanced with brown tones
    success: {
      50: '#f7f2ed',
      100: '#e7d9ce',
      200: '#d7c0af',
      300: '#c7a790',
      400: '#b78e71',
      500: '#a06a4a',
      600: '#80553b',
      700: '#60402c',
      800: '#402b1d',
      900: '#20150e',
    },
    // Warning - Tan variations
    warning: {
      50: '#faf6f2',
      100: '#f0e6d9',
      200: '#e5d6bf',
      300: '#dbc6a6',
      400: '#d0b68c',
      500: '#ce9466',
      600: '#b87a52',
      700: '#a1613d',
    },
    // Danger - Secondary blue tinted red
    danger: {
      50: '#fee7f0',
      100: '#fcbdd6',
      200: '#fa93bc',
      300: '#f869a2',
      400: '#f63f88',
      500: '#e63462',
      600: '#c72952',
      700: '#a81e42',
    },
    // Info - Primary tan
    info: {
      50: '#faf6f2',
      100: '#f0e6d9',
      200: '#e5d6bf',
      300: '#dbc6a6',
      400: '#d0b68c',
      500: '#ce9466',
      600: '#b87a52',
      700: '#a1613d',
    },
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: '#faf6f2',
        color: 'dark.500',
      },
      '*::placeholder': {
        color: 'gray.400',
      },
      '*, *::before, *::after': {
        borderColor: 'gray.200',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : 
              props.colorScheme === 'secondary' ? 'secondary.500' :
              props.colorScheme === 'accent' ? 'accent.500' :
              props.colorScheme === 'olive' ? 'olive.500' : undefined,
          color: 'white',
          fontWeight: '600',
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.600' : 
                props.colorScheme === 'secondary' ? 'secondary.600' :
                props.colorScheme === 'accent' ? 'accent.600' :
                props.colorScheme === 'olive' ? 'olive.600' : undefined,
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: props.colorScheme === 'primary' ? 'primary.700' : 
                props.colorScheme === 'secondary' ? 'secondary.700' :
                props.colorScheme === 'accent' ? 'accent.700' :
                props.colorScheme === 'olive' ? 'olive.700' : undefined,
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        }),
        outline: (props: any) => ({
          borderColor: props.colorScheme === 'primary' ? 'primary.500' : 
                      props.colorScheme === 'secondary' ? 'secondary.500' :
                      props.colorScheme === 'accent' ? 'accent.500' : undefined,
          color: props.colorScheme === 'primary' ? 'primary.500' : 
                props.colorScheme === 'secondary' ? 'secondary.500' :
                props.colorScheme === 'accent' ? 'accent.500' : undefined,
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.50' : 
                props.colorScheme === 'secondary' ? 'secondary.50' :
                props.colorScheme === 'accent' ? 'accent.50' : undefined,
          },
        }),
        ghost: (props: any) => ({
          color: props.colorScheme === 'primary' ? 'primary.600' : 
                props.colorScheme === 'secondary' ? 'secondary.600' :
                props.colorScheme === 'accent' ? 'accent.600' : undefined,
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.50' : 
                props.colorScheme === 'secondary' ? 'secondary.50' :
                props.colorScheme === 'accent' ? 'accent.50' : undefined,
          },
        }),
      },
    },
    Badge: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : 
              props.colorScheme === 'accent' ? 'accent.500' :
              props.colorScheme === 'olive' ? 'olive.500' : undefined,
          color: 'white',
        }),
        subtle: (props: any) => ({
          bg: props.colorScheme === 'primary' ? 'primary.100' : 
              props.colorScheme === 'accent' ? 'accent.100' :
              props.colorScheme === 'olive' ? 'olive.100' : undefined,
          color: props.colorScheme === 'primary' ? 'primary.700' : 
                props.colorScheme === 'accent' ? 'accent.700' :
                props.colorScheme === 'olive' ? 'olive.700' : undefined,
        }),
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
      variants: {
        outline: {
          field: {
            borderColor: 'gray.300',
            _hover: {
              borderColor: 'primary.400',
            },
            _focus: {
              borderColor: 'primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
            },
          },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
      variants: {
        outline: {
          field: {
            borderColor: 'gray.300',
            _hover: {
              borderColor: 'primary.400',
            },
            _focus: {
              borderColor: 'primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
            },
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'primary.500',
      },
      variants: {
        outline: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'primary.400',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
          },
        },
      },
    },
    Tabs: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        line: {
          tab: {
            _selected: {
              color: 'primary.600',
              borderColor: 'primary.500',
              fontWeight: '600',
            },
          },
        },
        enclosed: {
          tab: {
            _selected: {
              color: 'primary.600',
              bg: 'white',
              borderColor: 'primary.500',
              borderBottomColor: 'white',
              fontWeight: '600',
            },
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
          borderWidth: '1px',
          borderColor: 'gray.200',
          _hover: {
            boxShadow: 'md',
          },
          transition: 'all 0.2s',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderColor: 'gray.200',
          boxShadow: 'lg',
        },
        item: {
          _hover: {
            bg: 'primary.50',
            color: 'primary.700',
          },
          _focus: {
            bg: 'primary.50',
            color: 'primary.700',
          },
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'gray.200',
            color: 'dark.700',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontSize: 'xs',
            letterSpacing: 'wider',
            bg: 'gray.50',
          },
          td: {
            borderColor: 'gray.200',
          },
        },
        striped: {
          tbody: {
            tr: {
              '&:nth-of-type(odd)': {
                'td, th': {
                  bg: 'gray.50',
                },
              },
              _hover: {
                'td, th': {
                  bg: 'primary.50',
                },
              },
            },
          },
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'white',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'gray.200',
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'gray.200',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'white',
          borderRadius: 'lg',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'gray.200',
          fontWeight: '700',
          color: 'dark.800',
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'gray.200',
        },
      },
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(4, 133, 226, 0.4)',
  },
});
