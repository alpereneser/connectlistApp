import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Inter',
  },
});

// Global font configuration
export const fontConfig = {
  default: 'Inter',
  thin: 'Inter',
  light: 'Inter',
  regular: 'Inter',
  medium: 'Inter',
  semibold: 'Inter',
  semiBold: 'Inter',
  bold: 'Inter',
  extrabold: 'Inter',
  extraBold: 'Inter',
  black: 'Inter',
};

// Font weights for styling
export const fontWeights = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  extraBold: '800' as const,
  black: '900' as const,
};