import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useRouter, useSegments } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, loading, teamId, profileCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ENABLE AUTH FOR PRODUCTION
    const bypassAuth = false;

    if (bypassAuth) {
      // Allow navigation to idea-lab, project, and tabs
      if (segments[0] !== '(tabs)' && segments[0] !== 'idea-lab' && segments[0] !== 'project' && segments[0] !== 'modal') {
        router.replace('/(tabs)');
      }
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in -> go to login
      router.replace('/(auth)/login');
    } else if (user && !profileCompleted && segments[1] !== 'profile-setup') {
      // Logged in but profile not completed -> go to profile setup
      router.replace('/(auth)/profile-setup');
    } else if (user && profileCompleted && !teamId && segments[1] !== 'team-setup') {
      // Profile completed but no team -> go to team setup
      router.replace('/(auth)/team-setup');
    } else if (user && profileCompleted && teamId && inAuthGroup) {
      // Everything complete -> go to main app
      router.replace('/(tabs)');
    }
  }, [user, loading, teamId, profileCompleted, segments]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="idea-lab" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="join-project" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
