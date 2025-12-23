import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 300,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Settings',
          headerShown: true,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          headerShown: true,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}