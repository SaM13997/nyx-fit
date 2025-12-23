import React from 'react';
import { ConvexProvider } from 'convex/react';
import { convex } from './convex-client';

interface ConvexAppProviderProps {
  children: React.ReactNode;
}

export function ConvexAppProvider({ children }: ConvexAppProviderProps) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}