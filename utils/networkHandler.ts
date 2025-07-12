import NetInfo from '@react-native-community/netinfo';
import React from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../lib/sentry';

export interface NetworkError extends Error {
  isNetworkError: boolean;
  status?: number;
  statusText?: string;
  retryable: boolean;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: NetworkError) => boolean;
}

class NetworkHandler {
  private isOnline: boolean = true;
  private retryQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline && wasOffline) {
        this.processRetryQueue();
      }
    });
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  public createNetworkError(
    message: string, 
    status?: number, 
    retryable: boolean = true
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.status = status;
    error.retryable = retryable;
    return error;
  }

  public isNetworkError(error: any): error is NetworkError {
    return error && error.isNetworkError === true;
  }

  public getRetryDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      retryCondition = (error: NetworkError) => error.retryable && error.status !== 401 && error.status !== 403
    } = config;

    let lastError: NetworkError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check connection before attempting
        if (!await this.checkConnection()) {
          throw this.createNetworkError('No internet connection');
        }

        return await operation();
      } catch (error) {
        const networkError = this.normalizeError(error);
        lastError = networkError;

        // Don't retry on last attempt or if retry condition fails
        if (attempt === maxRetries || !retryCondition(networkError)) {
          throw networkError;
        }

        // Wait before retrying
        const delay = this.getRetryDelay(attempt, baseDelay, maxDelay);
        await this.sleep(delay);

        logError(networkError, {
          attempt: attempt + 1,
          maxRetries,
          willRetry: attempt < maxRetries,
        });
      }
    }

    throw lastError!;
  }

  public normalizeError(error: any): NetworkError {
    if (this.isNetworkError(error)) {
      return error;
    }

    // Handle fetch/axios errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return this.createNetworkError('Network connection failed', undefined, true);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return this.createNetworkError('Server unreachable', undefined, true);
    }

    // Handle HTTP status errors
    if (error.response?.status) {
      const status = error.response.status;
      const retryable = status >= 500 || status === 408 || status === 429;
      return this.createNetworkError(
        error.response.statusText || `HTTP ${status}`,
        status,
        retryable
      );
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return this.createNetworkError('Request timeout', 408, true);
    }

    // Default network error
    return this.createNetworkError(error.message || 'Unknown network error', undefined, false);
  }

  public addToRetryQueue(operation: () => Promise<any>): void {
    this.retryQueue.push(operation);
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isProcessingQueue || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      while (this.retryQueue.length > 0) {
        const operation = this.retryQueue.shift()!;
        try {
          await operation();
        } catch (error) {
          logError(error as Error, {
            context: 'retry_queue_processing',
          });
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  public showNetworkError(error: NetworkError): void {
    if (!this.isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    switch (error.status) {
      case 401:
        Alert.alert(
          'Authentication Error',
          'Please log in again to continue.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 403:
        Alert.alert(
          'Access Denied',
          'You don\'t have permission to perform this action.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 404:
        Alert.alert(
          'Not Found',
          'The requested resource could not be found.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 429:
        Alert.alert(
          'Too Many Requests',
          'Please wait a moment before trying again.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        Alert.alert(
          'Server Error',
          'Our servers are experiencing issues. Please try again later.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      default:
        Alert.alert(
          'Network Error',
          error.message || 'Something went wrong. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache management for offline support
  public async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;
      
      if (isExpired) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

export const networkHandler = new NetworkHandler();

// React Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isLoading };
};

// React Hook for handling network operations
export const useNetworkOperation = () => {
  const executeWithRetry = React.useCallback(async <T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ): Promise<T> => {
    try {
      return await networkHandler.withRetry(operation, config);
    } catch (error) {
      const networkError = networkHandler.normalizeError(error);
      networkHandler.showNetworkError(networkError);
      throw networkError;
    }
  }, []);

  return { executeWithRetry };
};

export default networkHandler;