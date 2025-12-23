import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationUtils } from '../lib/navigation';

/**
 * Hook to handle Android back button behavior
 */
export function useAndroidBackHandler() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return NavigationUtils.handleAndroidBack();
      }
    );

    return () => backHandler.remove();
  }, []);
}

/**
 * Hook for custom back button handling in specific screens
 */
export function useCustomBackHandler(handler: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handler
    );

    return () => backHandler.remove();
  }, [handler]);
}