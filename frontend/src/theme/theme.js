import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Modern color palette - Deep Purple & Teal theme
    primary: '#6366F1', // Modern Indigo - vibrant and professional
    secondary: '#10B981', // Emerald Green - fresh and food-related
    accent: '#F59E0B', // Amber - warm accent for highlights
    background: '#F8FAFC', // Very light blue-gray
    surface: '#FFFFFF',
    text: '#1E293B', // Dark slate
    disabled: '#CBD5E1',
    placeholder: '#64748B',
    backdrop: 'rgba(15, 23, 42, 0.6)', // Dark semi-transparent
    
    // Custom modern colors
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber  
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    
    // Light variants with modern opacity
    successLight: 'rgba(16, 185, 129, 0.1)',
    warningLight: 'rgba(245, 158, 11, 0.1)', 
    errorLight: 'rgba(239, 68, 68, 0.1)',
    infoLight: 'rgba(59, 130, 246, 0.1)',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    secondaryLight: 'rgba(16, 185, 129, 0.1)',
    
    // Additional semantic colors
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1E293B',
    
    // Pantry related colors - more modern
    pantryEmpty: '#F1F5F9',
    pantryFull: 'rgba(16, 185, 129, 0.05)',
    
    // Modern gradient colors
    gradientStart: '#6366F1',
    gradientEnd: '#8B5CF6',
    
    // Recipe analysis colors - updated
    scoreExcellent: '#10B981', // 80-100%
    scoreGood: '#22C55E', // 60-79%
    scoreFair: '#F59E0B', // 40-59%
    scorePoor: '#F97316', // 20-39%
    scoreVeryPoor: '#EF4444', // 0-19%
    
    // Modern card colors
    cardBackground: '#FFFFFF',
    cardBorder: 'rgba(226, 232, 240, 0.8)',
    
    // Modern chip colors
    chipBackground: 'rgba(99, 102, 241, 0.08)',
    chipText: '#6366F1',
    chipSelected: '#6366F1',
    chipSelectedText: '#FFFFFF',
  },
  
  // Increased spacing for modern feel
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Modern typography
  fonts: {
    ...DefaultTheme.fonts,
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1E293B',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: '600', 
      color: '#334155',
      letterSpacing: -0.3,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: '#1E293B',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      color: '#64748B',
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      color: '#475569',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  },
  
  // Increased border radius for modern curved look
  roundness: 16, // Increased from 8 to 16
  
  // Modern shadows with better depth
  shadows: {
    small: {
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.20,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  
  // Modern component styles
  components: {
    button: {
      primary: {
        backgroundColor: '#6366F1',
        borderRadius: 20, // Very rounded buttons
        paddingVertical: 16,
        paddingHorizontal: 32,
        shadowColor: '#6366F1',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#6366F1',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 30,
      },
      outlined: {
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20, // Increased border radius
      padding: 20,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.6)',
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    chip: {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderRadius: 25, // Very rounded chips
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    chipSelected: {
      backgroundColor: '#6366F1',
      borderRadius: 25,
      paddingVertical: 8,
      paddingHorizontal: 16,
      shadowColor: '#6366F1',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    fab: {
      backgroundColor: '#6366F1',
      borderRadius: 28, // Perfect circle for FABs
      shadowColor: '#6366F1',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    modal: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      shadowColor: '#64748B',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 16,
    },
  },
};

// Helper function to get score color
export const getScoreColor = (score) => {
  if (score >= 80) return theme.colors.scoreExcellent;
  if (score >= 60) return theme.colors.scoreGood;
  if (score >= 40) return theme.colors.scoreFair;
  if (score >= 20) return theme.colors.scorePoor;
  return theme.colors.scoreVeryPoor;
};

// Helper function to get score label
export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
};

// Modern gradient helper
export const getGradientColors = (type = 'primary') => {
  switch (type) {
    case 'primary':
      return ['#6366F1', '#8B5CF6'];
    case 'secondary':
      return ['#10B981', '#22C55E'];
    case 'success':
      return ['#10B981', '#34D399'];
    case 'warning':
      return ['#F59E0B', '#FBBF24'];
    case 'error':
      return ['#EF4444', '#F87171'];
    default:
      return ['#6366F1', '#8B5CF6'];
  }
}; 