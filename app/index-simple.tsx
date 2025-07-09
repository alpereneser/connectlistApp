import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';

export default function TestIndex() {
  const router = useRouter();

  const handleTabPress = (tab: string) => {
    if (tab === 'add') {
      router.push('/create');
    } else if (tab === 'search') {
      router.push('/search');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else if (tab === 'discover') {
      router.push('/discover');
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="ConnectList" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to ConnectList</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/create')}
        >
          <Text style={styles.buttonText}>Create List</Text>
        </TouchableOpacity>
      </View>
      <BottomMenu activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});