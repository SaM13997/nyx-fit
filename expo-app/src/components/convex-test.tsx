import React from 'react';
import { View, Text } from 'react-native';
import { useConvexConnection } from '../hooks/use-convex';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function ConvexConnectionTest() {
  const { isOnline, isConnecting, connectionType, isAuthLoading, isAuthenticated, isReady } = useConvexConnection();

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Convex Connection Status</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-foreground">Network Status:</Text>
            <Text className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isConnecting ? 'Connecting...' : isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-foreground">Connection Type:</Text>
            <Text className="text-muted-foreground">{connectionType || 'Unknown'}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-foreground">Auth Status:</Text>
            <Text className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-yellow-600'}`}>
              {isAuthLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-foreground">Convex Ready:</Text>
            <Text className={`font-medium ${isReady ? 'text-green-600' : 'text-yellow-600'}`}>
              {isReady ? 'Ready' : 'Not Ready'}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}