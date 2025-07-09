import { Alert } from 'react-native';
import { logError, addBreadcrumb } from '../lib/sentry';

export interface ErrorWithContext extends Error {
  context?: Record<string, any>;
  userMessage?: string;
}

// Enhanced error handler with user-friendly messages
export const handleError = (error: ErrorWithContext, showAlert: boolean = true) => {
  // Log to Sentry
  logError(error, error.context);

  // Add breadcrumb
  addBreadcrumb(
    error.message,
    'error',
    'error'
  );

  // Show user-friendly message
  if (showAlert) {
    const userMessage = getUserFriendlyMessage(error);
    Alert.alert('Error', userMessage);
  }

  // Log to console in development
  if (__DEV__) {
    console.error('Error handled:', error);
    if (error.context) {
      console.error('Error context:', error.context);
    }
  }
};

// Convert technical errors to user-friendly messages
const getUserFriendlyMessage = (error: ErrorWithContext): string => {
  if (error.userMessage) {
    return error.userMessage;
  }

  // Network errors
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (error.message.includes('auth') || error.message.includes('unauthorized')) {
    return 'Authentication error. Please log in again.';
  }

  // Supabase errors
  if (error.message.includes('supabase')) {
    return 'Server error. Please try again later.';
  }

  // API rate limit errors
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // File upload errors
  if (error.message.includes('upload') || error.message.includes('storage')) {
    return 'Failed to upload file. Please try again.';
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.';
};

// Async operation wrapper with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  userMessage?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const enhancedError: ErrorWithContext = error as ErrorWithContext;
    enhancedError.context = context;
    enhancedError.userMessage = userMessage;
    
    handleError(enhancedError);
    return null;
  }
};

// Network request wrapper with error handling
export const withNetworkErrorHandling = async <T>(
  request: () => Promise<T>,
  operation: string
): Promise<T | null> => {
  return withErrorHandling(
    request,
    { operation, timestamp: new Date().toISOString() },
    'Network request failed. Please check your connection and try again.'
  );
};

// Form submission wrapper with error handling
export const withFormErrorHandling = async <T>(
  submission: () => Promise<T>,
  formName: string
): Promise<T | null> => {
  return withErrorHandling(
    submission,
    { form: formName, timestamp: new Date().toISOString() },
    'Failed to submit form. Please check your input and try again.'
  );
};

// Create custom error with context
export const createError = (
  message: string,
  context?: Record<string, any>,
  userMessage?: string
): ErrorWithContext => {
  const error: ErrorWithContext = new Error(message);
  error.context = context;
  error.userMessage = userMessage;
  return error;
};