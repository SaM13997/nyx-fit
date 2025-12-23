import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { useAuth, signInWithEmail, signUpWithEmail } from '../../src/lib/auth-provider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signInWithEmail(email, password);
      }
      
      // Navigation will happen automatically via the useEffect above
    } catch (error) {
      Alert.alert(
        'Authentication Error', 
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setName('');
    setEmail('');
    setPassword('');
  };

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center p-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground text-center mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text className="text-muted-foreground text-center">
              {isSignUp 
                ? 'Sign up to start tracking your fitness journey' 
                : 'Sign in to continue your fitness journey'
              }
            </Text>
          </View>

          <View className="space-y-4">
            {isSignUp && (
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Name</Text>
                <Input
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}
            
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <Input
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </View>

            <Button
              title={isLoading 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
              onPress={handleSubmit}
              disabled={isLoading}
              className="mt-6"
            />

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-muted-foreground">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <Button
                title={isSignUp ? 'Sign In' : 'Sign Up'}
                variant="ghost"
                onPress={toggleMode}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}