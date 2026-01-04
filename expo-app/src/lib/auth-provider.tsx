import React, { useEffect } from 'react';
import { authClient, initializeAuth } from './auth-client';

/**
 * Auth Provider component that wraps the app with Better Auth context
 * This provides authentication state and methods throughout the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth storage on app startup
    initializeAuth();
  }, []);

  return children; // Better Auth client handles its own context internally
}

/**
 * Re-export auth hooks and utilities for convenience
 */
export { 
  useAuth, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser,
  getAuthStatus,
  isSessionValid 
} from './auth-client';
export { authClient } from './auth-client';