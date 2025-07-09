import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { MapPin, FilmStrip, Television, BookOpen, GameController, User, PlayCircle } from 'phosphor-react-native';

export default function CreateScreen() {
  const router = useRouter();

  const handleCategorySelect = (category: string) => {
    router.push(`/create-list?category=${category}`);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'search') router.push('/search');
    else if (tab === 'discover') router.push('/discover');
    else if (tab === 'profile') router.push('/profile');
  };

  const categories = [
    { icon: MapPin, title: 'Places', color: '#FF6B35', key: 'places' },
    { icon: FilmStrip, title: 'Movies', color: '#F97316', key: 'movies' },
    { icon: Television, title: 'TV Shows', color: '#EA580C', key: 'tv_shows' },
    { icon: BookOpen, title: 'Books', color: '#DC2626', key: 'books' },
    { icon: GameController, title: 'Games', color: '#F59E0B', key: 'games' },
    { icon: PlayCircle, title: 'Videos', color: '#EF4444', key: 'videos' },
    { icon: User, title: 'Person', color: '#FB923C', key: 'person' },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="Create" />
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>Choose Your Category</Text>
            <Text style={styles.subtitle}>Select the category you want to create a list for</Text>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(category.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <category.icon size={24} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <BottomMenu activeTab="add" onTabPress={handleTabPress} />
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
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 8,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 100,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
  },
});