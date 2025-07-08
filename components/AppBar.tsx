import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChatCircle, ArrowLeft } from 'phosphor-react-native';
import { fontConfig } from '../styles/global';

interface AppBarProps {
  title?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export default function AppBar({ title = 'ConnectList', showBackButton = false, rightComponent }: AppBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  return (
    <>
      <StatusBar style="dark" translucent={false} />
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1F2937" weight="regular" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : !showBackButton ? (
            <>
              <TouchableOpacity style={styles.iconButton}>
                <Bell size={24} color="#1F2937" weight="regular" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <ChatCircle size={24} color="#1F2937" weight="regular" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64 + (Platform.OS === 'ios' ? 44 : 24),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: fontConfig.semiBold,
    color: '#1F2937',
    letterSpacing: -0.2,
  },
});