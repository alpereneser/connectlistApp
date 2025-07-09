import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '../lib/supabase';
import { initSentry, setUserContext, clearUserContext } from '../lib/sentry';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  // Initialize Sentry
  useEffect(() => {
    initSentry();
  }, []);

  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    // For React Native, we'll rely on system fonts and web fonts
    // The fontConfig will handle the platform-specific font selection
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session?.user);
        
        // Set user context for Sentry
        if (session?.user) {
          setUserContext({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          clearUserContext();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Navigate based on authentication status
  useEffect(() => {
    if (!isLoading && loaded) {
      if (isAuthenticated) {
        router.replace('/');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, loaded, router]);

  if (!loaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="search" />
          <Stack.Screen name="create" />
          <Stack.Screen name="create-list" />
          <Stack.Screen name="discover" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="details/[id]" />
          <Stack.Screen name="details/movie/[id]" />
          <Stack.Screen name="details/tv/[id]" />
          <Stack.Screen name="details/book/[id]" />
          <Stack.Screen name="details/game/[id]" />
          <Stack.Screen name="details/person/[id]" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/email-verification" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="+not-found" />
        </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
