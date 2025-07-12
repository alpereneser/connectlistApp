// Conditional import for Sentry
let Sentry: any = null;

try {
  Sentry = require('@sentry/react-native');
} catch (error) {
  console.warn('Sentry not installed, error tracking disabled');
}

// Initialize Sentry
export const initSentry = () => {
  if (!Sentry) return;
  
  // Skip Sentry in development or if no DSN is provided
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || __DEV__) {
    console.log('Sentry disabled in development mode');
    return;
  }
  
  Sentry.init({
    dsn,
    debug: false, // Disable debug to reduce logs
    tracesSampleRate: 0.1, // Reduce sampling in production
    environment: 'production',
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.headers;
      }
      
      // Remove sensitive URLs
      if (event.request?.url) {
        const url = new URL(event.request.url);
        if (url.searchParams.has('apikey')) {
          url.searchParams.set('apikey', '[Filtered]');
          event.request.url = url.toString();
        }
      }

      return event;
    },
  });
};

// Enhanced error logging
export const logError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
  
  if (!Sentry) return;
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Performance monitoring
export const startTransaction = (name: string, operation: string) => {
  if (!Sentry) return null;
  return Sentry.startTransaction({ name, op: operation });
};

// User context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  if (!Sentry) return;
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Clear user context on logout
export const clearUserContext = () => {
  if (!Sentry) return;
  Sentry.setUser(null);
};

// Breadcrumb logging
export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!Sentry) return;
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

export default Sentry;