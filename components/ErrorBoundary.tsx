import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WarningCircle, ArrowClockwise } from 'phosphor-react-native';
import { logError } from '../lib/sentry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => (
  <View style={styles.errorContainer}>
    <WarningCircle size={64} color="#DC2626" />
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>
      {__DEV__ && error ? error.message : 'An unexpected error occurred. Please try again.'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={resetError}>
      <ArrowClockwise size={20} color="#FFFFFF" />
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      errorInfo,
      component: 'ErrorBoundary',
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ErrorBoundary;