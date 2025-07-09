import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, User, Eye, TrendUp } from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';
import { withErrorHandling } from '../../utils/errorHandler';

interface List {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  users_profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

export default function TopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { topic } = useLocalSearchParams();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalLists: 0,
    totalLikes: 0,
    totalViews: 0,
  });

  useEffect(() => {
    if (topic) {
      fetchTopicLists();
    }
  }, [topic]);

  const fetchTopicLists = async () => {
    await withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          id,
          title,
          description,
          user_id,
          likes_count,
          views_count,
          created_at,
          users_profiles (
            full_name,
            username,
            avatar_url
          )
        `)
        .contains('topics', [topic])
        .order('likes_count', { ascending: false });

      if (error) throw error;

      setLists(data || []);
      
      // Calculate stats
      const totalLists = data?.length || 0;
      const totalLikes = data?.reduce((sum, list) => sum + (list.likes_count || 0), 0) || 0;
      const totalViews = data?.reduce((sum, list) => sum + (list.views_count || 0), 0) || 0;
      
      setStats({ totalLists, totalLikes, totalViews });
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopicLists();
    setRefreshing(false);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTopicIcon = (topicName: string): string => {
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
    
    const lowerTopic = topicName.toLowerCase();
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
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading topic lists...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topic}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
      >
        {/* Topic Header */}
        <View style={styles.topicHeader}>
          <View style={styles.topicIconContainer}>
            <Text style={styles.topicIcon}>{getTopicIcon(topic as string)}</Text>
          </View>
          <Text style={styles.topicTitle}>{topic}</Text>
          <Text style={styles.topicDescription}>
            Discover amazing lists about {topic}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalLists}</Text>
            <Text style={styles.statLabel}>Lists</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalLikes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalViews}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* Lists */}
        <View style={styles.listsContainer}>
          <View style={styles.sectionHeader}>
            <TrendUp size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Popular Lists</Text>
          </View>

          {lists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No lists found</Text>
              <Text style={styles.emptyMessage}>
                There are no lists for this topic yet. Be the first to create one!
              </Text>
            </View>
          ) : (
            lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.listCard}
                onPress={() => handleListPress(list.id)}
              >
                <View style={styles.listHeader}>
                  <View style={styles.listUserInfo}>
                    <View style={styles.listAvatar}>
                      {list.users_profiles?.avatar_url ? (
                        <Image
                          source={{ uri: list.users_profiles.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {list.users_profiles?.full_name?.charAt(0) || 
                             list.users_profiles?.username?.charAt(0) || '?'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.listUserDetails}>
                      <Text style={styles.listUserName}>
                        {list.users_profiles?.full_name || list.users_profiles?.username}
                      </Text>
                      <Text style={styles.listUserUsername}>
                        @{list.users_profiles?.username}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.listDate}>{formatDate(list.created_at)}</Text>
                </View>

                <Text style={styles.listTitle}>{list.title}</Text>
                {list.description && (
                  <Text style={styles.listDescription} numberOfLines={2}>
                    {list.description}
                  </Text>
                )}

                <View style={styles.listStats}>
                  <View style={styles.listStatItem}>
                    <Heart size={16} color="#FF6B35" />
                    <Text style={styles.listStatText}>{list.likes_count || 0}</Text>
                  </View>
                  <View style={styles.listStatItem}>
                    <Eye size={16} color="#6B7280" />
                    <Text style={styles.listStatText}>{list.views_count || 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 16,
  },
  topicHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  topicIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicIcon: {
    fontSize: 40,
  },
  topicTitle: {
    fontSize: 28,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  topicDescription: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  listsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
  listUserDetails: {
    flex: 1,
  },
  listUserName: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  listUserUsername: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  listDate: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  listDescription: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  listStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listStatText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
});