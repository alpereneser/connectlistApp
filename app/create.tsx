import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { MapPin, FilmStrip, Television, BookOpen, GameController, User, PlayCircle } from 'phosphor-react-native';

export default function CreateScreen() {
  const router = useRouter();
  
  const handleTabPress = (tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'search') {
      router.push('/search');
    } else if (tab === 'discover') {
      router.push('/discover');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else if (tab === 'add') {
      // Already on create page, do nothing
    }
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/create-list?category=${category.toLowerCase()}`);
  };

  const categories = [
    { icon: MapPin, title: 'Places', color: '#FF6B35', description: 'Restaurants, cafes, travel destinations', key: 'places' },
    { icon: FilmStrip, title: 'Movies', color: '#F97316', description: 'Films, documentaries, cinema experiences', key: 'movies' },
    { icon: Television, title: 'TV Shows', color: '#EA580C', description: 'Series, episodes, streaming content', key: 'tv_shows' },
    { icon: BookOpen, title: 'Books', color: '#DC2626', description: 'Novels, non-fiction, reading lists', key: 'books' },
    { icon: GameController, title: 'Games', color: '#F59E0B', description: 'Video games, board games, activities', key: 'games' },
    { icon: PlayCircle, title: 'Videos', color: '#EF4444', description: 'YouTube videos, tutorials, vlogs', key: 'videos' },
    { icon: User, title: 'Person', color: '#FB923C', description: 'People, celebrities, influencers', key: 'person' },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="Create" />
      <View style={styles.content}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>Choose Your Category</Text>
            <Text style={styles.subtitle}>Select the category you want to create a list for, add your items, create your list, and share it with others!</Text>
          </View>

          {/* Category Selection */}
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
                <Text style={styles.categoryDescription}>{category.description}</Text>
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
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 15,
  },
  mainTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
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
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 1,
     },
     shadowOpacity: 0.05,
     shadowRadius: 2,
     elevation: 2,
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
     fontSize: 14,
     color: '#1f2937',
     marginBottom: 4,
     textAlign: 'center',
   },
  categoryDescription: {
     fontFamily: 'Inter',
     fontSize: 11,
     color: '#6b7280',
     lineHeight: 14,
     textAlign: 'center',
   },
});