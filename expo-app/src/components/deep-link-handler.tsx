import { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationUtils } from '../lib/navigation';

/**
 * Component to handle deep linking throughout the app
 */
export function DeepLinkHandler() {
  useEffect(() => {
    // Handle initial URL when app is opened from a deep link
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          NavigationUtils.handleDeepLink(initialURL);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Handle URLs when app is already running
    const handleURL = (event: { url: string }) => {
      NavigationUtils.handleDeepLink(event.url);
    };

    // Set up listeners
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleURL);

    return () => {
      subscription?.remove();
    };
  }, []);

  return null; // This component doesn't render anything
}