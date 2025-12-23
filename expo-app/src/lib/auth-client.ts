import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from 'expo-secure-store';
import { env } from "./env";

/**
 * Better Auth client configured for React Native/Expo
 * Uses Expo SecureStore for secure token storage
 */
export const authClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    expoClient({
      scheme: "nyxfit", // This should match your app's URL scheme in app.json
      storage: {
        getItem: async (key: string) => {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (error) {
            console.error('SecureStore get error:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch (error) {
            console.error('SecureStore set error:', error);
          }
        },
      },
    }),
  ],
});

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
 * Sign out current user
 */
export async function signOutUser() {
  try {
    await signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}