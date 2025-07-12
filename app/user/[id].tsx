import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProfileScreen from '../profile';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  
  // Pass the userId to ProfileScreen through a prop or context
  return <ProfileScreen userId={id as string} />;
}