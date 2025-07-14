// SMS onay ile kayıt örneği
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function PhoneRegister() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [loading, setLoading] = useState(false);

  // 1. Telefon numarası ile OTP gönder
  const sendOTP = async () => {
    setLoading(true);
    try {
      // Telefon numarasını E.164 formatına çevir
      const formattedPhone = phone.startsWith('+') ? phone : `+90${phone}`;
      
      const { error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password: 'temp_password_123', // SMS auth için gerekli
        options: {
          data: {
            full_name: 'New User',
            username: `user_${Date.now()}`,
          }
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'OTP sent to your phone');
        setStep(2);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP doğrula
  const verifyOTP = async () => {
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+90${phone}`;
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Phone verified successfully!');
        // Redirect to app
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Enter Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          keyboardType="phone-pad"
          style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
        />
        <TouchableOpacity 
          onPress={sendOTP}
          disabled={loading}
          style={{ backgroundColor: '#F97316', padding: 15, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Enter OTP sent to {phone}</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TouchableOpacity 
        onPress={verifyOTP}
        disabled={loading}
        style={{ backgroundColor: '#F97316', padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 10 }}>
        <Text style={{ textAlign: 'center', color: '#6B7280' }}>
          Change phone number
        </Text>
      </TouchableOpacity>
    </View>
  );
}