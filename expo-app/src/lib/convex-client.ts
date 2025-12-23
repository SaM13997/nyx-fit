import { ConvexReactClient } from 'convex/react';
import { env, validateEnv } from './env';

// Validate environment variables on app start
validateEnv();

// Create Convex client
export const convex = new ConvexReactClient(env.CONVEX_URL);

// Export types for use in components
export type ConvexClient = typeof convex;