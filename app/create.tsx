import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { MapPin, FilmStrip, Television, BookOpen, GameController, User } from 'phosphor-react-native';

interface CreateScreenProps {
  onTabPress?: (tab: string) => void;
}

export default function CreateScreen({ onTabPress }: CreateScreenProps) {
  const handleTabPress = (tab: string) => {
    onTabPress?.(tab);
  };

  const categories = [
    { icon: MapPin, title: 'Places', color: '#FF6B35', description: 'Restaurants, cafes, travel destinations' },
    { icon: FilmStrip, title: 'Movies', color: '#F97316', description: 'Films, documentaries, cinema experiences' },
    { icon: Television, title: 'TV Shows', color: '#EA580C', description: 'Series, episodes, streaming content' },
    { icon: BookOpen, title: 'Books', color: '#DC2626', description: 'Novels, non-fiction, reading lists' },
    { icon: GameController, title: 'Games', color: '#F59E0B', description: 'Video games, board games, activities' },
    { icon: User, title: 'Person', color: '#FB923C', description: 'People, celebrities, influencers' },
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
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <category.icon size={32} color={category.color} />
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
    marginBottom: 30,
    paddingHorizontal: 4,
    paddingVertical: 20,
  },
  mainTitle: {
    ...fontConfig.bold,
    fontSize: 28,
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  categoryCard: {
     width: '45%',
     backgroundColor: '#f8f9fa',
     borderRadius: 12,
     padding: 20,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#e9ecef',
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
     ...fontConfig.semibold,
     fontSize: 16,
     color: '#1f2937',
     marginBottom: 8,
     textAlign: 'center',
   },
  categoryDescription: {
     ...fontConfig.regular,
     fontSize: 12,
     color: '#6b7280',
     lineHeight: 16,
     textAlign: 'center',
   },
});