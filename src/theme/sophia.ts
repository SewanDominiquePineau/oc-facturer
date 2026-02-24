export const sophiaTheme = {
  colors: {
    brand: {
      primary: '#A0EBF0',
      hover: '#8DE5EB',
      active: '#7AD9E0',
      light: '#CCE0FF',
    },
    bg: {
      body: '#F2F4F5',
      white: '#FFFFFF',
      sidebarActive: '#CCE0FF',
      hover: '#F9FAFB',
    },
    text: {
      primary: '#191F22',
      secondary: '#333F44',
      tertiary: '#9CA3AF',
      link: '#3B82F6',
    },
    border: {
      default: '#D9DEE1',
      light: '#E5E7EB',
      focus: '#A0EBF0',
    },
    status: {
      success: '#10B981',
      successBg: '#E6F8EB',
      warning: '#F59E0B',
      warningBg: '#FFDC99',
      error: '#EF4444',
      errorBg: '#FFDDDD',
      info: '#3B82F6',
      infoBg: '#CCE0FF',
    },
    destructive: '#D21C1C',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
} as const;

export type SophiaTheme = typeof sophiaTheme;
