import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
  EdgeInsets,
} from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
  statusBarTranslucent?: boolean;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor,
  statusBarTranslucent = false,
}) => {
  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor || backgroundColor}
        translucent={statusBarTranslucent}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor },
          style,
        ]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

// Hook to get safe area insets for custom implementations
export const useSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  const safeAreaStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const leftInset = insets.left;
  const rightInset = insets.right;

  return {
    insets,
    safeAreaStyle,
    topInset,
    bottomInset,
    leftInset,
    rightInset,
  };
};

// Component for handling notch-aware header
export const NotchAwareHeader: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}> = ({ children, style, backgroundColor = '#FFFFFF' }) => {
  const { topInset } = useSafeArea();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor,
          paddingTop: topInset,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Component for handling home indicator aware bottom area
export const HomeIndicatorAwareFooter: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}> = ({ children, style, backgroundColor = '#FFFFFF' }) => {
  const { bottomInset } = useSafeArea();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor,
          paddingBottom: Math.max(bottomInset, 16), // Minimum 16px padding
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Component for modal/overlay safe area handling
export const ModalSafeAreaWrapper: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}> = ({ children, style, backgroundColor = '#FFFFFF' }) => {
  const { insets } = useSafeArea();

  return (
    <View
      style={[
        styles.modalContainer,
        {
          backgroundColor,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Helper function to check if device has notch/dynamic island
export const hasNotch = () => {
  const { top } = useSafeAreaInsets();
  return Platform.OS === 'ios' && top > 20;
};

// Helper function to check if device has home indicator
export const hasHomeIndicator = () => {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === 'ios' && bottom > 0;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    zIndex: 1000,
  },
  footer: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
  },
});

export default SafeAreaWrapper;