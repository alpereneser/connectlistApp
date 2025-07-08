import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { fontConfig } from '../../styles/global';
import { EnvelopeSimple, CheckCircle, ArrowLeft } from 'phosphor-react-native';

export default function EmailVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          // Email doğrulandı, ana sayfaya yönlendir
          router.replace('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Verification email sent again.');
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  const checkEmailManually = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        router.replace('/');
      } else {
        Alert.alert('Info', 'Email not verified yet. Please check your email inbox.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not check status.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Image 
          source={require('../../assets/images/connectlist-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <EnvelopeSimple size={80} color="#FF6B35" weight="light" />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to {email ? email : 'your email address'}.
        </Text>
        <Text style={styles.description}>
          Check your email inbox and click the link to activate your account.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={checkEmailManually}
          >
            <CheckCircle size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Check Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (loading || resendCooldown > 0) && styles.disabledButton
            ]}
            onPress={handleResendEmail}
            disabled={loading || resendCooldown > 0}
          >
            <Text style={[
              styles.secondaryButtonText,
              (loading || resendCooldown > 0) && styles.disabledButtonText
            ]}>
              {loading 
                ? 'Sending...' 
                : resendCooldown > 0 
                  ? `Resend (${resendCooldown}s)`
                  : 'Resend Email'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the email? Check your spam folder.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={navigateToLogin}>
          <Text style={styles.footerText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  logo: {
    width: 120,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: fontConfig.bold,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontConfig.medium,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    fontFamily: fontConfig.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: fontConfig.semiBold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: fontConfig.medium,
    color: '#374151',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  helpContainer: {
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    fontFamily: fontConfig.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fontConfig.medium,
    color: '#FF6B35',
  },
});