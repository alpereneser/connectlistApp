import { useEffect, useRef, MutableRefObject } from 'react';
import { Platform, findNodeHandle } from 'react-native';

interface KeyboardNavigationOptions {
  focusOnMount?: boolean;
  trapFocus?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
}

interface FocusableElement {
  ref: MutableRefObject<any>;
  order: number;
  disabled?: boolean;
}

export const useKeyboardNavigation = (
  elements: FocusableElement[],
  options: KeyboardNavigationOptions = {}
) => {
  const { focusOnMount = false, trapFocus = false, onEscape, onEnter } = options;
  const currentFocusIndex = useRef<number>(0);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const sortedElements = elements
      .filter(el => el.ref.current && !el.disabled)
      .sort((a, b) => a.order - b.order);

    if (sortedElements.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, shiftKey } = event;

      switch (key) {
        case 'Tab':
          if (trapFocus) {
            event.preventDefault();
            const direction = shiftKey ? -1 : 1;
            const nextIndex = (currentFocusIndex.current + direction + sortedElements.length) % sortedElements.length;
            const nextElement = sortedElements[nextIndex];
            if (nextElement?.ref.current?.focus) {
              nextElement.ref.current.focus();
              currentFocusIndex.current = nextIndex;
            }
          }
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndexDown = Math.min(currentFocusIndex.current + 1, sortedElements.length - 1);
          const nextElementDown = sortedElements[nextIndexDown];
          if (nextElementDown?.ref.current?.focus) {
            nextElementDown.ref.current.focus();
            currentFocusIndex.current = nextIndexDown;
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const nextIndexUp = Math.max(currentFocusIndex.current - 1, 0);
          const nextElementUp = sortedElements[nextIndexUp];
          if (nextElementUp?.ref.current?.focus) {
            nextElementUp.ref.current.focus();
            currentFocusIndex.current = nextIndexUp;
          }
          break;

        case 'Home':
          event.preventDefault();
          const firstElement = sortedElements[0];
          if (firstElement?.ref.current?.focus) {
            firstElement.ref.current.focus();
            currentFocusIndex.current = 0;
          }
          break;

        case 'End':
          event.preventDefault();
          const lastElement = sortedElements[sortedElements.length - 1];
          if (lastElement?.ref.current?.focus) {
            lastElement.ref.current.focus();
            currentFocusIndex.current = sortedElements.length - 1;
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
        case ' ':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    // Focus first element on mount if requested
    if (focusOnMount && sortedElements.length > 0) {
      const firstElement = sortedElements[0];
      if (firstElement?.ref.current?.focus) {
        setTimeout(() => {
          firstElement.ref.current.focus();
          currentFocusIndex.current = 0;
        }, 100);
      }
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [elements, trapFocus, focusOnMount, onEscape, onEnter]);

  const focusElement = (index: number) => {
    const sortedElements = elements
      .filter(el => el.ref.current && !el.disabled)
      .sort((a, b) => a.order - b.order);

    if (index >= 0 && index < sortedElements.length) {
      const element = sortedElements[index];
      if (element?.ref.current?.focus) {
        element.ref.current.focus();
        currentFocusIndex.current = index;
      }
    }
  };

  const focusFirst = () => focusElement(0);
  const focusLast = () => {
    const sortedElements = elements
      .filter(el => el.ref.current && !el.disabled)
      .sort((a, b) => a.order - b.order);
    focusElement(sortedElements.length - 1);
  };

  return {
    containerRef,
    focusElement,
    focusFirst,
    focusLast,
    currentFocusIndex: currentFocusIndex.current,
  };
};

// Hook for managing focus within a modal or overlay
export const useModalFocus = (isVisible: boolean, onClose?: () => void) => {
  const previousFocusRef = useRef<any>(null);
  const modalRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (isVisible) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal container
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Trap focus within modal
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onClose) {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        
        // Restore focus to previous element
        if (previousFocusRef.current && previousFocusRef.current.focus) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isVisible, onClose]);

  return { modalRef };
};

// Hook for skip links accessibility feature
export const useSkipLinks = () => {
  const skipLinksRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Show skip links on Tab key press
      if (event.key === 'Tab' && !event.shiftKey) {
        if (skipLinksRef.current) {
          skipLinksRef.current.style.display = 'block';
        }
      }
    };

    const handleFocusOut = () => {
      // Hide skip links when focus moves away
      if (skipLinksRef.current) {
        setTimeout(() => {
          if (!skipLinksRef.current?.contains(document.activeElement)) {
            skipLinksRef.current.style.display = 'none';
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return { skipLinksRef };
};

// Hook for announcing live updates to screen readers
export const useLiveRegion = () => {
  const liveRegionRef = useRef<any>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (Platform.OS !== 'web') return;

    if (liveRegionRef.current) {
      // Clear previous message
      liveRegionRef.current.textContent = '';
      
      // Set new message after a brief delay to ensure it's announced
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
          liveRegionRef.current.setAttribute('aria-live', priority);
        }
      }, 100);
    }
  };

  return { liveRegionRef, announce };
};