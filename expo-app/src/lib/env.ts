/**
 * Environment configuration for the Expo app
 */

export const env = {
  // Convex Configuration
  CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL || '',
  
  // Better Auth Configuration
  BETTER_AUTH_URL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL || '',
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Nyx Fit',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const requiredVars = {
    EXPO_PUBLIC_CONVEX_URL: env.CONVEX_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: keyof typeof env, fallback?: string): string {
  const value = env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || fallback || '';
}