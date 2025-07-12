import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

interface AccessibleTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  error,
  required = false,
  containerStyle,
  labelStyle,
  errorStyle,
  accessibilityLabel,
  accessibilityHint,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const inputId = React.useId();

  const handleFocus = React.useCallback((event: any) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = React.useCallback((event: any) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const accessibilityLabelText = React.useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;
    if (label) return `${label}${required ? ', required' : ''}`;
    return props.placeholder || 'Text input';
  }, [accessibilityLabel, label, required, props.placeholder]);

  const accessibilityHintText = React.useMemo(() => {
    if (accessibilityHint) return accessibilityHint;
    if (error) return `Error: ${error}`;
    return undefined;
  }, [accessibilityHint, error]);

  const inputStyle = React.useMemo(() => [
    styles.input,
    style,
    isFocused && styles.focused,
    error && styles.error,
  ], [style, isFocused, error]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text 
          style={[styles.label, labelStyle, required && styles.requiredLabel]}
          nativeID={`${inputId}-label`}
        >
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      )}
      
      <TextInput
        ref={inputRef}
        {...props}
        style={inputStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessible={true}
        accessibilityLabel={accessibilityLabelText}
        accessibilityHint={accessibilityHintText}
        accessibilityRequired={required}
        accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
        accessibilityDescribedBy={error ? `${inputId}-error` : undefined}
        importantForAccessibility="yes"
        {...Platform.select({
          web: {
            'aria-label': accessibilityLabelText,
            'aria-describedby': error ? `${inputId}-error` : undefined,
            'aria-required': required,
            'aria-invalid': !!error,
          } as any,
        })}
      />
      
      {error && (
        <Text 
          style={[styles.errorText, errorStyle]}
          nativeID={`${inputId}-error`}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  requiredLabel: {
    // Additional styles for required fields
  },
  asterisk: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 48, // Ensure minimum touch target size
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  focused: {
    borderColor: '#F97316',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)',
      },
    }),
  },
  error: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#EF4444',
    marginTop: 4,
  },
});

export default AccessibleTextInput;