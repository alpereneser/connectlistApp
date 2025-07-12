import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth/login');
          return;
        }

        if (session) {
          console.log('✅ Auth callback successful, user:', session.user.email);
          // Redirect to home page
          router.replace('/');
        } else {
          console.log('❌ No session found, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth/login');
      }
    };

    // Small delay to ensure URL params are processed
    const timer = setTimeout(handleAuthCallback, 1000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
});