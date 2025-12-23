import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl font-semibold text-foreground mb-2">
          Workout Details
        </Text>
        <Text className="text-muted-foreground text-center">
          Details for workout ID: {id}
        </Text>
      </View>
    </SafeAreaView>
  );
}