import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function WorkoutsLayout() {
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
          title: 'Workouts',
          headerShown: true,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Workout Details',
          headerShown: true,
          presentation: 'card',
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'New Workout',
          headerShown: true,
          presentation: 'modal',
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'fade_from_bottom',
        }} 
      />
    </Stack>
  );
}