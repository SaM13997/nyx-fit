import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateWorkoutScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl font-semibold text-foreground mb-2">
          Create New Workout
        </Text>
        <Text className="text-muted-foreground text-center">
          Workout creation interface will be implemented here.
        </Text>
      </View>
    </SafeAreaView>
  );
}