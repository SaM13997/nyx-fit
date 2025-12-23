import { Stack } from 'expo-router';

export default function WeightLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Weight Tracking',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}