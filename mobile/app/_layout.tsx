import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useRouter, useSegments } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, loading, teamId, profileCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!user && !inAuthGroup && segments[0] !== 'index') {
      router.replace('/(auth)/login');
    } else if (user && !profileCompleted && segments[1] !== 'profile-setup') {
      router.replace('/(auth)/profile-setup');
    } else if (user && profileCompleted && !teamId && segments[1] !== 'team-setup') {
      router.replace('/(auth)/team-setup');
    } else if (user && profileCompleted && teamId && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, teamId, profileCompleted, segments]);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  // ── Show loading screen while auth state resolves ──
  // This prevents the profile-setup flash for already-authenticated users
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7C3AED" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#08090E' }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="idea-lab" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="join-project" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
