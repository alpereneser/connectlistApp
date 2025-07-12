import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, MagnifyingGlass, Plus, Bell, User } from 'phosphor-react-native';

interface BottomMenuProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export default function BottomMenu({ activeTab = 'home', onTabPress }: BottomMenuProps) {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabPress = (tab: string) => {
    setCurrentTab(tab);
    onTabPress?.(tab);
  };

  const getIconColor = (tab: string) => {
    return currentTab === tab ? '#FF6B35' : '#9CA3AF';
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleTabPress('home')}
      >
        <House 
          size={24} 
          color={getIconColor('home')} 
          weight={currentTab === 'home' ? 'fill' : 'regular'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleTabPress('search')}
      >
        <MagnifyingGlass 
          size={24} 
          color={getIconColor('search')} 
          weight={currentTab === 'search' ? 'bold' : 'regular'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabButton, styles.addButton]} 
        onPress={() => handleTabPress('add')}
      >
        <Plus 
          size={28} 
          color={getIconColor('add')} 
          weight={currentTab === 'add' ? 'bold' : 'regular'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleTabPress('notifications')}
      >
        <Bell 
          size={24} 
          color={getIconColor('notifications')} 
          weight={currentTab === 'notifications' ? 'fill' : 'regular'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleTabPress('profile')}
      >
        <User 
          size={24} 
          color={getIconColor('profile')} 
          weight={currentTab === 'profile' ? 'fill' : 'regular'} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginHorizontal: 8,
  },
});