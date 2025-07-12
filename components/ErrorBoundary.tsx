import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WarningCircle, ArrowClockwise, Bug, Info } from 'phosphor-react-native';
import { logError } from '../lib/sentry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ 
  error, 
  errorInfo, 
  errorId, 
  resetError 
}) => (
  <View style={styles.errorContainer}>
    <WarningCircle size={64} color="#DC2626" />
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>
      We're sorry, but something unexpected happened. The error has been logged and we'll work on fixing it.
    </Text>
    
    {errorId && (
      <View style={styles.errorIdContainer}>
        <Info size={16} color="#6B7280" />
        <Text style={styles.errorIdText}>Error ID: {errorId}</Text>
      </View>
    )}

    {__DEV__ && error && (
      <View style={styles.errorDetails}>
        <View style={styles.errorHeader}>
          <Bug size={16} color="#DC2626" />
          <Text style={styles.errorDetailTitle}>Error Details (Dev Mode)</Text>
        </View>
        <Text style={styles.errorDetailText}>
          <Text style={styles.errorLabel}>Message: </Text>
          {error.message}
        </Text>
        {error.stack && (
          <Text style={styles.errorStack} numberOfLines={10}>
            <Text style={styles.errorLabel}>Stack: </Text>
            {error.stack}
          </Text>
        )}
      </View>
    )}

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
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    });
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: string) => {
    console.error('Manual error report:', error);
    logError(error, {
      manual: true,
      additionalInfo: errorInfo,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return handleError;
};

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
  errorIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 16,
    gap: 6,
  },
  errorIdText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  errorDetails: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    maxWidth: '100%',
    width: '100%',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  errorDetailTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#DC2626',
  },
  errorLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#991B1B',
  },
  errorDetailText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#7F1D1D',
    marginBottom: 8,
    lineHeight: 16,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#7F1D1D',
    marginBottom: 8,
    lineHeight: 14,
  },
});

export default ErrorBoundary;