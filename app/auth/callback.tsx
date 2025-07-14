import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters for email confirmation
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const hashParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.hash.substring(1) : '');
        
        console.log('Callback URL:', url);
        console.log('URL params:', Object.fromEntries(urlParams));
        console.log('Hash params:', Object.fromEntries(hashParams));
        
        // Check for token_hash and type in both query and hash
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
        const type = urlParams.get('type') || hashParams.get('type');
        
        if (tokenHash && type === 'email') {
          console.log('Processing email confirmation with token hash');
          
          // Verify the email confirmation token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });
          
          if (error) {
            console.error('Email verification error:', error);
            Alert.alert(
              'Verification Failed',
              'Email verification failed. Please try again or request a new confirmation email.',
              [{ text: 'Go to Login', onPress: () => router.replace('/auth/login') }]
            );
            return;
          }
          
          if (data.session && data.user) {
            console.log('✅ Email confirmed successfully:', data.user.email);
            
            Alert.alert(
              'Welcome to ConnectList! 🎉',
              'Your email has been confirmed successfully. You are now logged in!',
              [{ text: 'Get Started', onPress: () => router.replace('/') }]
            );
          } else {
            console.log('❌ Verification succeeded but no session created');
            router.replace('/auth/login?message=verified');
          }
        } else if (url.includes('access_token') || url.includes('#')) {
          console.log('Processing OAuth or other auth callback');
          
          // Handle other auth types (OAuth, etc.)
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            router.replace('/auth/login');
            return;
          }
          
          if (data.session && data.session.user.email_confirmed_at) {
            console.log('✅ User already confirmed, redirecting to home');
            router.replace('/');
          } else if (data.session) {
            console.log('⏳ User has session but email not confirmed');
            router.replace(`/auth/email-verification?email=${data.session.user.email}`);
          } else {
            console.log('❌ No session found');
            router.replace('/auth/login');
          }
        } else {
          // No special callback, just check current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            router.replace('/auth/login');
            return;
          }
          
          if (session && session.user.email_confirmed_at) {
            router.replace('/');
          } else if (session) {
            router.replace(`/auth/email-verification?email=${session.user.email}`);
          } else {
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        Alert.alert(
          'Authentication Error',
          'An error occurred during authentication. Please try logging in again.',
          [{ text: 'Go to Login', onPress: () => router.replace('/auth/login') }]
        );
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