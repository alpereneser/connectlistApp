import { useEffect, useRef, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export interface BackHandlerOptions {
  enabled?: boolean;
  onBackPress?: () => boolean | void;
  priority?: number;
}

export const useBackHandler = (options: BackHandlerOptions = {}) => {
  const { enabled = true, onBackPress, priority = 0 } = options;
  const router = useRouter();
  const handlerRef = useRef<(() => boolean) | null>(null);

  const defaultBackHandler = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    return false;
  }, [router]);

  const backHandler = useCallback(() => {
    if (onBackPress) {
      const result = onBackPress();
      return result === true;
    }
    return defaultBackHandler();
  }, [onBackPress, defaultBackHandler]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return;
    }

    handlerRef.current = backHandler;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      subscription.remove();
      handlerRef.current = null;
    };
  }, [enabled, backHandler]);

  return {
    canGoBack: router.canGoBack(),
    goBack: router.back,
  };
};

// Specialized hook for modal/overlay back handling
export const useModalBackHandler = (
  isVisible: boolean, 
  onClose: () => void,
  preventClose: boolean = false
) => {
  const handleBackPress = useCallback(() => {
    if (isVisible) {
      if (!preventClose) {
        onClose();
      }
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  }, [isVisible, onClose, preventClose]);

  useBackHandler({
    enabled: isVisible,
    onBackPress: handleBackPress,
    priority: 10, // Higher priority for modals
  });
};

// Hook for handling back button in specific screens
export const useScreenBackHandler = (
  screenName: string,
  customHandler?: () => boolean | void
) => {
  const router = useRouter();

  const handleBackPress = useCallback(() => {
    console.log(`Back pressed on ${screenName}`);
    
    if (customHandler) {
      const result = customHandler();
      if (result === true) {
        return true; // Custom handler handled the back press
      }
    }

    // Default behavior: navigate back if possible
    if (router.canGoBack()) {
      router.back();
      return true;
    }

    // If can't go back, let the system handle it (exit app)
    return false;
  }, [screenName, customHandler, router]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Hook for handling unsaved changes confirmation
export const useUnsavedChangesBackHandler = (
  hasUnsavedChanges: boolean,
  onConfirmExit: () => void,
  confirmationMessage: string = 'You have unsaved changes. Are you sure you want to leave?'
) => {
  const router = useRouter();

  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      const { Alert } = require('react-native');
      Alert.alert(
        'Unsaved Changes',
        confirmationMessage,
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              onConfirmExit();
              if (router.canGoBack()) {
                router.back();
              }
            },
          },
        ]
      );
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  }, [hasUnsavedChanges, confirmationMessage, onConfirmExit, router]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Hook for stack navigation back handling
export const useStackBackHandler = (
  stackLevel: number,
  onBackToRoot?: () => void
) => {
  const router = useRouter();

  const handleBackPress = useCallback(() => {
    if (stackLevel > 1) {
      // Navigate back one level
      if (router.canGoBack()) {
        router.back();
        return true;
      }
    } else if (stackLevel === 1 && onBackToRoot) {
      // At root level, call custom handler
      onBackToRoot();
      return true;
    }
    
    return false; // Let system handle (exit app)
  }, [stackLevel, onBackToRoot, router]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Hook for tab navigation back handling
export const useTabBackHandler = (
  currentTab: string,
  defaultTab: string = 'home',
  onTabSwitch?: (tab: string) => void
) => {
  const handleBackPress = useCallback(() => {
    if (currentTab !== defaultTab) {
      // Navigate to default tab instead of exiting
      if (onTabSwitch) {
        onTabSwitch(defaultTab);
      }
      return true;
    }
    return false; // At default tab, allow exit
  }, [currentTab, defaultTab, onTabSwitch]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Hook for search screen back handling
export const useSearchBackHandler = (
  hasSearchQuery: boolean,
  onClearSearch: () => void,
  onNavigateBack?: () => void
) => {
  const handleBackPress = useCallback(() => {
    if (hasSearchQuery) {
      // Clear search first
      onClearSearch();
      return true;
    } else if (onNavigateBack) {
      // Custom navigation
      onNavigateBack();
      return true;
    }
    return false; // Default navigation
  }, [hasSearchQuery, onClearSearch, onNavigateBack]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Hook for form back handling with validation
export const useFormBackHandler = (
  isDirty: boolean,
  isSubmitting: boolean,
  onDiscardChanges: () => void
) => {
  const handleBackPress = useCallback(() => {
    if (isSubmitting) {
      // Prevent back during submission
      return true;
    }

    if (isDirty) {
      const { Alert } = require('react-native');
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onDiscardChanges,
          },
        ]
      );
      return true;
    }

    return false; // Allow default back
  }, [isDirty, isSubmitting, onDiscardChanges]);

  useBackHandler({
    onBackPress: handleBackPress,
  });
};

// Double back to exit handler
export const useDoubleBackToExit = (
  enabled: boolean = true,
  message: string = 'Press back again to exit'
) => {
  const backPressedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBackPress = useCallback(() => {
    if (!enabled) return false;

    if (backPressedRef.current) {
      // Second back press - exit app
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return false; // Allow system to handle (exit)
    }

    // First back press - show message and set timer
    backPressedRef.current = true;
    
    const { ToastAndroid } = require('react-native');
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }

    timeoutRef.current = setTimeout(() => {
      backPressedRef.current = false;
    }, 2000);

    return true; // Prevent default back action
  }, [enabled, message]);

  useBackHandler({
    onBackPress: handleBackPress,
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};

export default useBackHandler;