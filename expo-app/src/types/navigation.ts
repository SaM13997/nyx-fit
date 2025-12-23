/**
 * Navigation type definitions for the Expo app
 */

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type TabParamList = {
  index: undefined;
  'workouts/index': undefined;
  'workouts/[id]': { id: string };
  'workouts/create': undefined;
  'weight/index': undefined;
  'stats/index': undefined;
  'settings/index': undefined;
  'settings/profile': undefined;
};

export type WorkoutsStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
};

export type SettingsStackParamList = {
  index: undefined;
  profile: undefined;
};

export type AuthStackParamList = {
  login: undefined;
};

/**
 * Deep link URL patterns
 */
export type DeepLinkPattern = 
  | `/workout/${string}`
  | '/profile'
  | '/workouts/create'
  | '/workouts'
  | '/weight'
  | '/stats'
  | '/settings'
  | '/login';

/**
 * Navigation animation types
 */
export type NavigationAnimation = 
  | 'slide_from_right'
  | 'slide_from_left'
  | 'slide_from_bottom'
  | 'fade'
  | 'fade_from_bottom'
  | 'flip'
  | 'simple_push'
  | 'none';

/**
 * Platform-specific navigation options
 */
export interface PlatformNavigationOptions {
  ios?: {
    animation?: NavigationAnimation;
    presentation?: 'card' | 'modal' | 'transparentModal';
  };
  android?: {
    animation?: NavigationAnimation;
    presentation?: 'card' | 'modal';
  };
}