import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export enum HapticFeedbackType {
  // iOS Haptic Feedback Types
  LIGHT_IMPACT = 'lightImpact',
  MEDIUM_IMPACT = 'mediumImpact',
  HEAVY_IMPACT = 'heavyImpact',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  
  // Custom combinations
  BUTTON_PRESS = 'buttonPress',
  TOGGLE_ON = 'toggleOn',
  TOGGLE_OFF = 'toggleOff',
  SWIPE = 'swipe',
  REFRESH = 'refresh',
  DELETE = 'delete',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  LIKE = 'like',
  UNLIKE = 'unlike',
  SEND_MESSAGE = 'sendMessage',
  RECEIVE_MESSAGE = 'receiveMessage',
  TAB_SWITCH = 'tabSwitch',
  MODAL_OPEN = 'modalOpen',
  MODAL_CLOSE = 'modalClose',
}

class HapticFeedbackManager {
  private isEnabled: boolean = true;
  private isSupported: boolean = Platform.OS === 'ios';

  constructor() {
    this.checkSupport();
  }

  private async checkSupport() {
    if (Platform.OS === 'ios') {
      try {
        // Check if haptics are supported
        this.isSupported = true;
      } catch (error) {
        this.isSupported = false;
        console.warn('Haptic feedback not supported on this device');
      }
    } else {
      this.isSupported = false;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  private async triggerHaptic(hapticType: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType) {
    if (!this.isHapticEnabled()) return;

    try {
      if (typeof hapticType === 'string') {
        // Notification feedback
        await Haptics.notificationAsync(hapticType as Haptics.NotificationFeedbackType);
      } else {
        // Impact feedback
        await Haptics.impactAsync(hapticType as Haptics.ImpactFeedbackStyle);
      }
    } catch (error) {
      console.warn('Failed to trigger haptic feedback:', error);
    }
  }

  private async triggerSelectionFeedback() {
    if (!this.isHapticEnabled()) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Failed to trigger selection feedback:', error);
    }
  }

  public async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.isHapticEnabled()) return;

    switch (type) {
      // Basic iOS haptics
      case HapticFeedbackType.LIGHT_IMPACT:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.MEDIUM_IMPACT:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      
      case HapticFeedbackType.HEAVY_IMPACT:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      
      case HapticFeedbackType.SUCCESS:
        return this.triggerHaptic(Haptics.NotificationFeedbackType.Success);
      
      case HapticFeedbackType.WARNING:
        return this.triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      
      case HapticFeedbackType.ERROR:
        return this.triggerHaptic(Haptics.NotificationFeedbackType.Error);
      
      case HapticFeedbackType.SELECTION:
        return this.triggerSelectionFeedback();

      // Custom combinations
      case HapticFeedbackType.BUTTON_PRESS:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.TOGGLE_ON:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      
      case HapticFeedbackType.TOGGLE_OFF:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.SWIPE:
        return this.triggerSelectionFeedback();
      
      case HapticFeedbackType.REFRESH:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      
      case HapticFeedbackType.DELETE:
        return this.triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      
      case HapticFeedbackType.CONFIRM:
        return this.triggerHaptic(Haptics.NotificationFeedbackType.Success);
      
      case HapticFeedbackType.CANCEL:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.LIKE:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      
      case HapticFeedbackType.UNLIKE:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.SEND_MESSAGE:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.RECEIVE_MESSAGE:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      case HapticFeedbackType.TAB_SWITCH:
        return this.triggerSelectionFeedback();
      
      case HapticFeedbackType.MODAL_OPEN:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      
      case HapticFeedbackType.MODAL_CLOSE:
        return this.triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      
      default:
        console.warn('Unknown haptic feedback type:', type);
    }
  }

  // Convenience methods for common use cases
  public async success() {
    return this.trigger(HapticFeedbackType.SUCCESS);
  }

  public async error() {
    return this.trigger(HapticFeedbackType.ERROR);
  }

  public async warning() {
    return this.trigger(HapticFeedbackType.WARNING);
  }

  public async buttonPress() {
    return this.trigger(HapticFeedbackType.BUTTON_PRESS);
  }

  public async selection() {
    return this.trigger(HapticFeedbackType.SELECTION);
  }

  public async like() {
    return this.trigger(HapticFeedbackType.LIKE);
  }

  public async unlike() {
    return this.trigger(HapticFeedbackType.UNLIKE);
  }

  public async delete() {
    return this.trigger(HapticFeedbackType.DELETE);
  }

  public async confirm() {
    return this.trigger(HapticFeedbackType.CONFIRM);
  }

  public async cancel() {
    return this.trigger(HapticFeedbackType.CANCEL);
  }

  public async tabSwitch() {
    return this.trigger(HapticFeedbackType.TAB_SWITCH);
  }

  public async modalOpen() {
    return this.trigger(HapticFeedbackType.MODAL_OPEN);
  }

  public async modalClose() {
    return this.trigger(HapticFeedbackType.MODAL_CLOSE);
  }

  public async sendMessage() {
    return this.trigger(HapticFeedbackType.SEND_MESSAGE);
  }

  public async receiveMessage() {
    return this.trigger(HapticFeedbackType.RECEIVE_MESSAGE);
  }

  // Sequence patterns for complex interactions
  public async doublePress() {
    await this.trigger(HapticFeedbackType.LIGHT_IMPACT);
    setTimeout(() => this.trigger(HapticFeedbackType.LIGHT_IMPACT), 100);
  }

  public async successSequence() {
    await this.trigger(HapticFeedbackType.LIGHT_IMPACT);
    setTimeout(() => this.trigger(HapticFeedbackType.SUCCESS), 150);
  }

  public async errorSequence() {
    await this.trigger(HapticFeedbackType.WARNING);
    setTimeout(() => this.trigger(HapticFeedbackType.ERROR), 100);
  }
}

// Create a singleton instance
export const hapticFeedback = new HapticFeedbackManager();

// React Hook for haptic feedback
export const useHapticFeedback = () => {
  const trigger = async (type: HapticFeedbackType) => {
    return hapticFeedback.trigger(type);
  };

  const isSupported = hapticFeedback.isHapticEnabled();

  return {
    trigger,
    isSupported,
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    warning: hapticFeedback.warning.bind(hapticFeedback),
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    selection: hapticFeedback.selection.bind(hapticFeedback),
    like: hapticFeedback.like.bind(hapticFeedback),
    unlike: hapticFeedback.unlike.bind(hapticFeedback),
    delete: hapticFeedback.delete.bind(hapticFeedback),
    confirm: hapticFeedback.confirm.bind(hapticFeedback),
    cancel: hapticFeedback.cancel.bind(hapticFeedback),
    tabSwitch: hapticFeedback.tabSwitch.bind(hapticFeedback),
    modalOpen: hapticFeedback.modalOpen.bind(hapticFeedback),
    modalClose: hapticFeedback.modalClose.bind(hapticFeedback),
    sendMessage: hapticFeedback.sendMessage.bind(hapticFeedback),
    receiveMessage: hapticFeedback.receiveMessage.bind(hapticFeedback),
    doublePress: hapticFeedback.doublePress.bind(hapticFeedback),
    successSequence: hapticFeedback.successSequence.bind(hapticFeedback),
    errorSequence: hapticFeedback.errorSequence.bind(hapticFeedback),
  };
};

export default hapticFeedback;