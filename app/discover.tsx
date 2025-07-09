import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { Users, UserPlus, Heart, MapPin, TrendUp } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withErrorHandling } from '../utils/errorHandler';

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  location?: string;
  followers_count?: number;
}

interface Topic {
  topic: string;
  list_count: number;
  total_likes: number;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [suggestedPeople, setSuggestedPeople] = useState<User[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSuggestedPeople();
      fetchTrendingTopics();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    await withErrorHandling(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    });
  };

  const fetchSuggestedPeople = async () => {
    await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('id, full_name, username, avatar_url, location, followers_count')
        .neq('id', currentUser?.id)
        .order('followers_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestedPeople(data || []);
    });
  };

  const fetchTrendingTopics = async () => {
    await withErrorHandling(async () => {
      const { data, error } = await supabase.rpc('get_trending_topics');
      
      if (error) {
        console.error('RPC error:', error);
        // Fallback to manual query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('lists')
          .select('topics, likes_count')
          .not('topics', 'is', null)
          .order('likes_count', { ascending: false })
          .limit(50);
        
        if (fallbackError) throw fallbackError;
        
        // Process topics manually
        const topicCounts: { [key: string]: { count: number; likes: number } } = {};
        
        fallbackData?.forEach((list: any) => {
          if (list.topics && Array.isArray(list.topics)) {
            list.topics.forEach((topic: string) => {
              if (topicCounts[topic]) {
                topicCounts[topic].count += 1;
                topicCounts[topic].likes += list.likes_count || 0;
              } else {
                topicCounts[topic] = { count: 1, likes: list.likes_count || 0 };
              }
            });
          }
        });
        
        const processedTopics = Object.entries(topicCounts)
          .map(([topic, data]) => ({
            topic,
            list_count: data.count,
            total_likes: data.likes
          }))
          .sort((a, b) => b.total_likes - a.total_likes)
          .slice(0, 6);
        
        setTrendingTopics(processedTopics);
      } else {
        setTrendingTopics(data || []);
      }
    });
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'search') {
      router.push('/search');
    } else if (tab === 'discover') {
      // Already on discover page, do nothing
    } else if (tab === 'profile') {
      router.push('/profile');
    } else if (tab === 'add') {
      router.push('/create');
    }
  };

  const handleFollowUser = async (userId: string) => {
    await withErrorHandling(async () => {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUser?.id,
          following_id: userId
        });
      
      if (error) throw error;
      
      // Refresh suggested people
      await fetchSuggestedPeople();
    });
  };

  const handleTopicPress = (topic: string) => {
    router.push(`/topic/${encodeURIComponent(topic)}`);
  };

  const getTopicIcon = (topic: string): string => {
    const iconMap: { [key: string]: string } = {
      'movies': '🎬',
      'books': '📚',
      'games': '🎮',
      'travel': '✈️',
      'food': '🍕',
      'music': '🎵',
      'tech': '💻',
      'sports': '⚽',
      'art': '🎨',
      'fashion': '👗',
      'health': '💪',
      'business': '💼'
    };
    
    const lowerTopic = topic.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerTopic.includes(key)) {
        return icon;
      }
    }
    return '📋';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Discover" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading discoveries...</Text>
        </View>
        <BottomMenu activeTab="discover" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Discover" />
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Suggested People Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>People You May Know</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {suggestedPeople.map((person) => (
                <View key={person.id} style={styles.personCard}>
                  <View style={styles.avatarContainer}>
                    {person.avatar_url ? (
                      <Image source={{ uri: person.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {person.full_name?.charAt(0) || person.username?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.personName}>{person.full_name || person.username}</Text>
                  <Text style={styles.personUsername}>@{person.username}</Text>
                  {person.location && (
                    <View style={styles.locationContainer}>
                      <MapPin size={12} color="#6B7280" />
                      <Text style={styles.locationText}>{person.location}</Text>
                    </View>
                  )}
                  <Text style={styles.mutualFriends}>{person.followers_count || 0} followers</Text>
                  <TouchableOpacity 
                    style={styles.connectButton}
                    onPress={() => handleFollowUser(person.id)}
                  >
                    <UserPlus size={16} color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>Follow</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Trending Topics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendUp size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Trending Topics</Text>
            </View>
            
            {trendingTopics.map((topic, index) => (
              <TouchableOpacity 
                key={`${topic.topic}-${index}`} 
                style={styles.topicCard}
                onPress={() => handleTopicPress(topic.topic)}
              >
                <View style={styles.topicIcon}>
                  <Text style={styles.topicEmoji}>{getTopicIcon(topic.topic)}</Text>
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.topic}</Text>
                  <Text style={styles.topicMembers}>{topic.list_count} lists • {topic.total_likes} likes</Text>
                </View>
                <Heart size={20} color="#FF6B35" />
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </View>
      <BottomMenu activeTab="discover" onTabPress={handleTabPress} />
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
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1F2937',
    marginLeft: 8,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 24,
  },
  personName: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  mutualFriends: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicEmoji: {
    fontSize: 18,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  topicMembers: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDetails: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  eventAttendees: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
  personUsername: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
});