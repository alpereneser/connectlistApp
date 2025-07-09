import { StyleSheet, Platform } from 'react-native';

// Platform-specific font family function
const getInterFontFamily = () => {
  if (Platform.OS === 'web') {
    // For web, use the loaded Google Fonts Inter
    return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  
  // For React Native (iOS/Android), use system Inter font
  // iOS has Inter as a system font, Android will fall back to Roboto
  if (Platform.OS === 'ios') {
    return 'Inter, -apple-system, San Francisco';
  }
  
  // For Android, use Roboto as fallback to Inter
  return 'Inter, Roboto, sans-serif';
};

export const globalStyles = StyleSheet.create({
  defaultText: {
    fontFamily: getInterFontFamily(),
  },
});

// Global font configuration - returns objects for spreading
export const fontConfig = {
  default: { fontFamily: getInterFontFamily() },
  thin: { fontFamily: getInterFontFamily(), fontWeight: '100' as const },
  light: { fontFamily: getInterFontFamily(), fontWeight: '300' as const },
  regular: { fontFamily: getInterFontFamily(), fontWeight: '400' as const },
  medium: { fontFamily: getInterFontFamily(), fontWeight: '500' as const },
  semibold: { fontFamily: getInterFontFamily(), fontWeight: '600' as const },
  semiBold: { fontFamily: getInterFontFamily(), fontWeight: '600' as const },
  bold: { fontFamily: getInterFontFamily(), fontWeight: '700' as const },
  extrabold: { fontFamily: getInterFontFamily(), fontWeight: '800' as const },
  extraBold: { fontFamily: getInterFontFamily(), fontWeight: '800' as const },
  black: { fontFamily: getInterFontFamily(), fontWeight: '900' as const },
};

// Font weights for styling (kept for backward compatibility)
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

// Utility function to get complete font style
export const getInterFontStyle = (weight: keyof typeof fontWeights) => {
  return {
    fontFamily: getInterFontFamily(),
    fontWeight: fontWeights[weight],
  };
};