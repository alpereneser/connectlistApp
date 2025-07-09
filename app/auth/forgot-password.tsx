import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { fontConfig } from '../../styles/global';
import { EnvelopeSimple, ArrowLeft, PaperPlaneTilt } from 'phosphor-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'connectlistexpo://reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const resendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
  };

  if (emailSent) {
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

        {/* Success Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <PaperPlaneTilt size={80} color="#FF6B35" weight="light" />
          </View>

          <Text style={styles.title}>Email Sent!</Text>
          <Text style={styles.subtitle}>
            We sent a password reset link to {email}.
          </Text>
          <Text style={styles.description}>
            Check your email inbox and click the link to reset your password.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={navigateToLogin}
            >
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={resendEmail}
            >
              <Text style={styles.secondaryButtonText}>Resend Email</Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
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
          <View style={styles.textContainer}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a password reset link.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <EnvelopeSimple size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? 'Sending...' : 'Send Password Reset Link'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
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
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 300,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
  resetButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
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
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#374151',
  },
  helpContainer: {
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#FF6B35',
  },
});