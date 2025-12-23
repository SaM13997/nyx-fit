import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/lib/theme-context';
import { ConvexAppProvider } from '../src/lib/convex-provider';
import { AuthProvider } from '../src/lib/auth-provider';
import { useAndroidBackHandler } from '../src/hooks/use-android-back-handler';
import { DeepLinkHandler } from '../src/components/deep-link-handler';
import '../global.css';

function RootLayoutContent() {
  const { isDark } = useTheme();
  
  // Handle Android back button globally
  useAndroidBackHandler();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DeepLinkHandler />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right', // Default animation for stack navigation
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ConvexAppProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </AuthProvider>
    </ConvexAppProvider>
  );
}