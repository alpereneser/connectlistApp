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
import { Eye, EyeSlash, EnvelopeSimple, Lock, User, At } from 'phosphor-react-native';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();



  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('username')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No data found - username is available
        return true;
      } else if (data) {
        // Username already exists
        return false;
      } else if (error) {
        // Other error occurred
        console.error('Username check error:', error);
        throw error;
      }
      return false;
    } catch (error) {
      console.error('Username availability check failed:', error);
      throw error;
    }
  };

  const checkEmailAvailability = async (email: string) => {
    try {
      // Check in auth.users table using RPC function or direct query
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        // Fallback: check in users_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('users_profiles')
          .select('id')
          .limit(1000); // Get a reasonable number of users

        if (profileError) {
          console.error('Email check error:', profileError);
          throw profileError;
        }

        // Since we can't directly query auth.users, we'll let Supabase handle email uniqueness
        return true;
      }

      // Check if email already exists in auth.users
      const existingUser = data.users.find(user => user.email === email.trim().toLowerCase());
      return !existingUser;
    } catch (error) {
      console.error('Email availability check failed:', error);
      // If check fails, let Supabase handle it during signup
      return true;
    }
  };

  const handleRegister = async () => {
    // Form validation
    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return;
    }

    if (fullName.trim().length < 2) {
      Alert.alert('Error', 'Full name must be at least 2 characters long.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    if (!validateUsername(username.trim())) {
      Alert.alert('Error', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability(username.trim());
      if (!isUsernameAvailable) {
        Alert.alert('Username Not Available', 'This username is already taken. Please choose a different one.');
        setLoading(false);
        return;
      }

      // Check email availability
      const isEmailAvailable = await checkEmailAvailability(email.trim());
      if (!isEmailAvailable) {
        Alert.alert('Email Already Registered', 'This email address is already registered. Please use a different email or try logging in.');
        setLoading(false);
        return;
      }

      // Get the current app URL for email redirect
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/auth/callback`
        : 'connectlist://auth/callback';
      
      console.log('Email redirect URL:', redirectUrl);

      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        if (error.message.includes('User already registered')) {
          Alert.alert('Email Already Registered', 'This email address is already registered. Please try logging in.');
        } else {
          Alert.alert('Registration Error', `${error.message}\n\nCode: ${error.status || 'N/A'}`);
        }
        return;
      }

      console.log('Signup successful:', data);

      if (data.user) {
        console.log('User created:', data.user.id);
        console.log('User confirmation status:', data.user.email_confirmed_at);
        console.log('Session status:', !!data.session);
        
        // Profile will be created automatically by database trigger after email confirmation
        console.log('User registered successfully. Profile will be created by trigger after email confirmation.');

        // Always show email confirmation message for new registrations
        Alert.alert(
          'Check Your Email! 📧', 
          `We've sent a confirmation link to ${email.trim().toLowerCase()}. Please check your email and click the link to complete your registration.`,
          [
            {
              text: 'I\'ll check my email',
              onPress: () => router.push({
                pathname: '/auth/email-verification',
                params: { email: email.trim().toLowerCase() }
              }),
            },
          ]
        );
      } else {
        console.error('No user in response:', data);
        console.log('Full registration response:', JSON.stringify(data, null, 2));
        Alert.alert('Registration Error', 'Account creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/connectlist-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>Join the ConnectList family</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <At size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <EnvelopeSimple size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeSlash size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <EyeSlash size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Privacy Agreement */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => router.push('/terms-of-service')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => router.push('/privacy-policy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, (loading || !acceptedTerms) && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading || !acceptedTerms}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Sign In</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#FF6B35',
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 20,
  },
  linkText: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
});