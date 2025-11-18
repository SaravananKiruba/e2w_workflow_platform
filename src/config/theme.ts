import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Custom color palette based on: #0485e2, #0458c9, #46d3c0, #566b17, #1a260b
export const theme = extendTheme({
  config,
  colors: {
    // Primary Blue - Main brand color (#0485e2)
    brand: {
      50: '#e6f5fd',
      100: '#b8e3f9',
      200: '#8ad1f5',
      300: '#5cbff1',
      400: '#2eaded',
      500: '#0485e2',  // Main brand color
      600: '#036bb5',
      700: '#025088',
      800: '#02365a',
      900: '#011b2d',
    },
    primary: {
      50: '#e6f5fd',
      100: '#b8e3f9',
      200: '#8ad1f5',
      300: '#5cbff1',
      400: '#2eaded',
      500: '#0485e2',  // Main primary color
      600: '#036bb5',
      700: '#025088',
      800: '#02365a',
      900: '#011b2d',
    },
    // Secondary Blue - Darker accent (#0458c9)
    secondary: {
      50: '#e6f0fc',
      100: '#b8d5f7',
      200: '#8abaf2',
      300: '#5c9fed',
      400: '#2e84e8',
      500: '#0458c9',  // Secondary color
      600: '#0347a1',
      700: '#033579',
      800: '#022351',
      900: '#011228',
    },
    // Accent Cyan - Bright highlight (#46d3c0)
    accent: {
      50: '#ebfaf7',
      100: '#c5f0e8',
      200: '#9fe6d9',
      300: '#79dcca',
      400: '#53d2bb',
      500: '#46d3c0',  // Accent color
      600: '#38a99a',
      700: '#2a7f73',
      800: '#1c544d',
      900: '#0e2a26',
    },
    // Olive Green - Natural earth tone (#566b17)
    olive: {
      50: '#f3f5e9',
      100: '#dce2c0',
      200: '#c5cf97',
      300: '#aebc6e',
      400: '#97a945',
      500: '#566b17',  // Olive color
      600: '#455613',
      700: '#34400e',
      800: '#232b0a',
      900: '#121505',
    },
    // Dark Base - Deep background (#1a260b)
    dark: {
      50: '#e9ebe7',
      100: '#c1c6bb',
      200: '#99a18f',
      300: '#717c63',
      400: '#495737',
      500: '#1a260b',  // Dark base color
      600: '#151e09',
      700: '#101707',
      800: '#0b0f04',
      900: '#050802',
    },
    // Success - Enhanced with olive tones
    success: {
      50: '#f0f8ea',
      100: '#d6edc4',
      200: '#bce19e',
      300: '#a2d678',
      400: '#88ca52',
      500: '#6ebe2c',
      600: '#566b17',
      700: '#45560f',
      800: '#34400e',
      900: '#232b0a',
    },
    // Warning - Accent cyan variations
    warning: {
      50: '#ebfaf7',
      100: '#c5f0e8',
      200: '#9fe6d9',
      300: '#79dcca',
      400: '#53d2bb',
      500: '#46d3c0',
      600: '#38a99a',
      700: '#2a7f73',
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
    // Info - Primary blue
    info: {
      50: '#e6f5fd',
      100: '#b8e3f9',
      200: '#8ad1f5',
      300: '#5cbff1',
      400: '#2eaded',
      500: '#0485e2',
      600: '#036bb5',
      700: '#025088',
    },
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'dark.800',
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
