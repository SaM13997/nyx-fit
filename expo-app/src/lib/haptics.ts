import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utilities for enhanced mobile experience
 */
export const hapticFeedback = {
  /**
   * Light haptic feedback for subtle interactions
   */
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Android fallback - use selection feedback
      Haptics.selectionAsync();
    }
  },

  /**
   * Medium haptic feedback for standard interactions
   */
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.selectionAsync();
    }
  },

  /**
   * Heavy haptic feedback for important interactions
   */
  heavy: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Success haptic feedback
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning haptic feedback
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error haptic feedback
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection haptic feedback for list items, toggles, etc.
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};

/**
 * Hook to use haptic feedback with settings support
 */
export function useHapticFeedback() {
  // In a real app, this would check user preferences
  // For now, we'll assume haptics are enabled
  const isEnabled = true;

  return {
    light: () => isEnabled && hapticFeedback.light(),
    medium: () => isEnabled && hapticFeedback.medium(),
    heavy: () => isEnabled && hapticFeedback.heavy(),
    success: () => isEnabled && hapticFeedback.success(),
    warning: () => isEnabled && hapticFeedback.warning(),
    error: () => isEnabled && hapticFeedback.error(),
    selection: () => isEnabled && hapticFeedback.selection(),
  };
}