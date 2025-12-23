import { Stack } from 'expo-router';

export default function StatsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Statistics',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}