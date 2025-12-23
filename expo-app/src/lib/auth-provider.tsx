import React from 'react';
import { authClient } from './auth-client';

/**
 * Auth Provider component that wraps the app with Better Auth context
 * This provides authentication state and methods throughout the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children; // Better Auth client handles its own context internally
}

/**
 * Re-export auth hooks and utilities for convenience
 */
export { useAuth, signInWithEmail, signUpWithEmail, signOutUser } from './auth-client';
export { authClient } from './auth-client';