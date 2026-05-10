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
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, loading, teamId } = useAuth();
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
      router.replace('/(auth)/login');
    } else if (user && !teamId && segments[1] !== 'team-setup') {
      router.replace('/(auth)/team-setup');
    } else if (user && teamId && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, teamId, segments]);

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
