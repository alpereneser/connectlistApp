import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  View,
  StyleSheet,
  AccessibilityRole,
  AccessibilityState,
  Platform,
} from 'react-native';

interface AccessibleButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  focusable?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
  hasTVPreferredFocus?: boolean;
  nextFocusDown?: number;
  nextFocusForward?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  nextFocusUp?: number;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  focusable = true,
  importantForAccessibility = 'yes',
  testID,
  hasTVPreferredFocus,
  nextFocusDown,
  nextFocusForward,
  nextFocusLeft,
  nextFocusRight,
  nextFocusUp,
  style,
  disabled,
  onPress,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const handleFocus = React.useCallback((event: any) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = React.useCallback((event: any) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handlePressIn = React.useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = React.useCallback(() => {
    setIsPressed(false);
  }, []);

  const finalAccessibilityState = React.useMemo(() => ({
    disabled: disabled || false,
    ...accessibilityState,
  }), [disabled, accessibilityState]);

  const buttonStyle = React.useMemo(() => [
    styles.button,
    style,
    isFocused && styles.focused,
    isPressed && styles.pressed,
    disabled && styles.disabled,
  ], [style, isFocused, isPressed, disabled]);

  return (
    <TouchableOpacity
      {...props}
      style={buttonStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={finalAccessibilityState}
      focusable={focusable && !disabled}
      importantForAccessibility={importantForAccessibility}
      testID={testID}
      hasTVPreferredFocus={hasTVPreferredFocus}
      nextFocusDown={nextFocusDown}
      nextFocusForward={nextFocusForward}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      nextFocusUp={nextFocusUp}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Base button styles
  },
  focused: {
    // Focus indicator styles
    ...Platform.select({
      web: {
        outline: '2px solid #F97316',
        outlineOffset: '2px',
      },
      default: {
        borderWidth: 2,
        borderColor: '#F97316',
      },
    }),
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AccessibleButton;