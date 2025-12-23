import { Platform } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Platform-specific styling utilities
 */
export const platformStyles = {
  /**
   * Apply styles only on iOS
   */
  ios: (styles: string) => Platform.OS === 'ios' ? styles : '',
  
  /**
   * Apply styles only on Android
   */
  android: (styles: string) => Platform.OS === 'android' ? styles : '',
  
  /**
   * Apply different styles based on platform
   */
  select: (options: { ios?: string; android?: string; default?: string }) => {
    if (Platform.OS === 'ios' && options.ios) return options.ios;
    if (Platform.OS === 'android' && options.android) return options.android;
    return options.default || '';
  },
};

/**
 * Common shadow styles for both platforms
 */
export const shadows = {
  sm: cn(
    platformStyles.ios('shadow-sm'),
    platformStyles.android('elevation-1')
  ),
  md: cn(
    platformStyles.ios('shadow-md'),
    platformStyles.android('elevation-3')
  ),
  lg: cn(
    platformStyles.ios('shadow-lg'),
    platformStyles.android('elevation-6')
  ),
  xl: cn(
    platformStyles.ios('shadow-xl'),
    platformStyles.android('elevation-12')
  ),
};

/**
 * Common spacing and sizing utilities
 */
export const spacing = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const;

export const margins = {
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
} as const;

/**
 * Common border radius utilities
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Typography utilities
 */
export const typography = {
  heading: {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    h5: 'text-lg font-medium',
    h6: 'text-base font-medium',
  },
  body: {
    large: 'text-lg',
    base: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  },
} as const;