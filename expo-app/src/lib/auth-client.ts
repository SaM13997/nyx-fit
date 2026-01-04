import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { env } from "./env";

// Create a hybrid storage system that uses SecureStore for sensitive data
const createHybridStorage = () => {
  const cache = new Map<string, string>();
  let initialized = false;
  
  // Keys that should be stored securely
  const secureKeys = ['session_token', 'refresh_token', 'access_token'];
  
  const isSecureKey = (key: string) => {
    return secureKeys.some(secureKey => key.includes(secureKey));
  };
  
  // Initialize cache from storage
  const initializeCache = async () => {
    if (initialized) return;
    
    try {
      // Load non-secure data from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => key.startsWith('better-auth'));
      
      if (authKeys.length > 0) {
        const values = await AsyncStorage.multiGet(authKeys);
        values.forEach(([key, value]) => {
          if (value && !isSecureKey(key)) {
            cache.set(key, value);
          }
        });
      }
      
      // Load secure data from SecureStore
      for (const secureKey of secureKeys) {
        const fullKey = `better-auth_${secureKey}`;
        try {
          const value = await SecureStore.getItemAsync(fullKey);
          if (value) {
            cache.set(fullKey, value);
          }
        } catch (error) {
          // SecureStore might not be available in some environments
          console.warn(`Could not load secure key ${fullKey}:`, error);
        }
      }
      
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth cache:', error);
      initialized = true; // Continue anyway
    }
  };
  
  // Initialize on first access
  initializeCache();
  
  return {
    getItem: (key: string): string | null => {
      return cache.get(key) || null;
    },
    setItem: (key: string, value: string): void => {
      cache.set(key, value);
      
      // Store securely or in AsyncStorage based on key type
      if (isSecureKey(key)) {
        SecureStore.setItemAsync(key, value).catch(error => {
          console.error('SecureStore set error:', error);
          // Fallback to AsyncStorage if SecureStore fails
          AsyncStorage.setItem(key, value).catch(fallbackError => {
            console.error('AsyncStorage fallback error:', fallbackError);
          });
        });
      } else {
        AsyncStorage.setItem(key, value).catch(error => {
          console.error('AsyncStorage set error:', error);
        });
      }
    },
  };
};

/**
 * Better Auth client configured for React Native/Expo
 * Uses hybrid storage: SecureStore for tokens, AsyncStorage for other data
 */
export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    expoClient({
      scheme: "nyxfit", // This should match your app's URL scheme in app.json
      storage: createHybridStorage(),
    }),
  ],
});

/**
 * Initialize auth storage - call this on app startup
 */
export async function initializeAuth() {
  try {
    // The storage initialization happens automatically when first accessed
    // This function can be used for any additional setup if needed
    console.log('Auth client initialized');
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
}

/**
 * Auth session hook for React Native
 */
export const { useSession, signIn, signOut, signUp } = authClient;

/**
 * Helper to check if user is authenticated
 */
export function useAuth() {
  const session = useSession();
  
  return {
    user: session.data?.user ?? null,
    isAuthenticated: !!session.data?.user,
    isLoading: session.isPending,
    error: session.error,
    session: session.data?.session ?? null,
  };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signIn.email({
      email,
      password,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
  try {
    const result = await signUp.email({
      email,
      password,
      name,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign out current user and clear stored tokens
 */
export async function signOutUser() {
  try {
    await signOut();
    
    // Clear stored tokens from SecureStore
    const secureKeys = ['better-auth_session_token', 'better-auth_refresh_token', 'better-auth_access_token'];
    await Promise.all(
      secureKeys.map(async (key) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.warn(`Could not delete secure key ${key}:`, error);
        }
      })
    );
    
    // Clear auth-related data from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const authKeys = allKeys.filter(key => key.startsWith('better-auth'));
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
    }
    
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Check if the current session is valid
 */
export function isSessionValid(session: any): boolean {
  if (!session) return false;
  
  // Check if session has expired
  if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
    return false;
  }
  
  return true;
}

/**
 * Get current authentication status
 */
export function getAuthStatus() {
  const session = useSession();
  
  return {
    isAuthenticated: !!session.data?.user,
    isLoading: session.isPending,
    user: session.data?.user || null,
    session: session.data?.session || null,
    error: session.error,
    isSessionValid: isSessionValid(session.data?.session),
  };
}