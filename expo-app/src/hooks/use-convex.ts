import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import type { FunctionReference, OptionalRestArgs } from 'convex/server';

/**
 * Enhanced Convex hook with mobile-specific optimizations
 */
export function useConvexQuery<T extends FunctionReference<'query'>>(
  query: T,
  ...args: OptionalRestArgs<T>
) {
  const netInfo = useNetInfo();
  
  // For now, use the basic useQuery - we'll enhance this later
  return useQuery(query, ...(netInfo.isConnected !== false ? args : [undefined as any]));
}

/**
 * Enhanced Convex mutation hook with offline support
 */
export function useConvexMutation<T extends FunctionReference<'mutation'>>(
  mutation: T
) {
  const netInfo = useNetInfo();
  const [offlineQueue, setOfflineQueue] = useState<Array<{
    mutation: T;
    args: OptionalRestArgs<T>;
    timestamp: number;
  }>>([]);

  const baseMutation = useMutation(mutation);

  return {
    mutate: (...args: OptionalRestArgs<T>) => {
      if (netInfo.isConnected === false) {
        // Queue mutation for later when offline
        setOfflineQueue(prev => [...prev, {
          mutation,
          args,
          timestamp: Date.now(),
        }]);
        return;
      }
      
      return baseMutation(...args);
    },
    isOffline: netInfo.isConnected === false,
    queuedCount: offlineQueue.length,
  };
}

/**
 * Hook to get connection status and Convex auth state
 */
export function useConvexConnection() {
  const netInfo = useNetInfo();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

  return {
    isOnline: netInfo.isConnected !== false,
    isConnecting: netInfo.isConnected === null,
    connectionType: netInfo.type,
    isAuthLoading: authLoading,
    isAuthenticated,
    isReady: netInfo.isConnected !== false && !authLoading,
  };
}

/**
 * Re-export commonly used Convex hooks
 */
export { useConvexAuth, useQuery, useMutation } from 'convex/react';