import React from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui/button';
import { Card } from '../../../src/components/ui/card';
import { useAuth, signOutUser } from '../../../src/lib/auth-provider';

export default function SettingsScreen() {
  const { user, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-muted-foreground">Not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">
          Settings
        </Text>

        {/* User Profile Section */}
        <Card className="p-4 mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">
            Profile
          </Text>
          {user && (
            <View className="space-y-2">
              {user.name && (
                <View>
                  <Text className="text-sm text-muted-foreground">Name</Text>
                  <Text className="text-foreground">{user.name}</Text>
                </View>
              )}
              {user.email && (
                <View>
                  <Text className="text-sm text-muted-foreground">Email</Text>
                  <Text className="text-foreground">{user.email}</Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* App Settings Section */}
        <Card className="p-4 mb-6">
          <Text className="text-lg font-semibold text-foreground mb-2">
            App Settings
          </Text>
          <Text className="text-muted-foreground">
            Additional settings will be implemented here.
          </Text>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="destructive"
          className="mt-auto"
        />
      </View>
    </SafeAreaView>
  );
}