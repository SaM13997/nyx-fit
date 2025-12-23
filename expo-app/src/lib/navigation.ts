import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Navigation utilities for platform-specific behavior
 */
export class NavigationUtils {
  /**
   * Handle Android back button behavior
   * Returns true if the back action was handled, false otherwise
   */
  static handleAndroidBack(): boolean {
    if (Platform.OS !== 'android') {
      return false;
    }

    // Check if we can go back in the navigation stack
    if (router.canGoBack()) {
      router.back();
      return true;
    }

    // If we're at the root, let the system handle it (exit app)
    return false;
  }

  /**
   * Navigate with platform-specific animations
   */
  static navigateWithAnimation(href: string, options?: { replace?: boolean }) {
    if (options?.replace) {
      router.replace(href as any);
    } else {
      router.push(href as any);
    }
  }

  /**
   * Navigate to workout details with proper animation
   */
  static navigateToWorkout(workoutId: string) {
    router.push(`/(tabs)/workouts/${workoutId}` as any);
  }

  /**
   * Navigate to profile settings
   */
  static navigateToProfile() {
    router.push('/(tabs)/settings/profile' as any);
  }

  /**
   * Navigate to create workout modal
   */
  static navigateToCreateWorkout() {
    router.push('/(tabs)/workouts/create' as any);
  }

  /**
   * Handle deep link navigation
   */
  static handleDeepLink(url: string): boolean {
    try {
      // Parse the URL and extract relevant information
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Handle different deep link patterns
      if (path.startsWith('/workout/')) {
        const workoutId = path.split('/')[2];
        if (workoutId) {
          this.navigateToWorkout(workoutId);
          return true;
        }
      }

      if (path === '/profile') {
        this.navigateToProfile();
        return true;
      }

      if (path === '/workouts/create') {
        this.navigateToCreateWorkout();
        return true;
      }

      // Default navigation to home if no specific handler
      router.push('/(tabs)/' as any);
      return true;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }
}

/**
 * Deep linking configuration
 */
export const DEEP_LINK_CONFIG = {
  scheme: 'nyxfit',
  prefixes: ['nyxfit://', 'https://nyxfit.app'],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          workouts: {
            screens: {
              index: 'workouts',
              '[id]': 'workout/:id',
              create: 'workouts/create',
            },
          },
          weight: 'weight',
          stats: 'stats',
          settings: {
            screens: {
              index: 'settings',
              profile: 'profile',
            },
          },
        },
      },
      '(auth)': {
        screens: {
          login: 'login',
        },
      },
    },
  },
};