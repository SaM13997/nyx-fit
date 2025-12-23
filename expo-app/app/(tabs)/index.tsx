import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConvexConnectionTest } from '../../src/components/convex-test';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-2xl font-bold text-foreground mb-4">
            Welcome to Nyx Fit
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            Your workout tracking companion is being built. This is the home screen placeholder.
          </Text>
        </View>
        
        <ConvexConnectionTest />
      </ScrollView>
    </SafeAreaView>
  );
}