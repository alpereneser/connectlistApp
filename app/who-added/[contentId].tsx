import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft,
  User,
  Calendar,
  List as ListIcon,
  Globe,
  Lock,
  Users as UsersIcon,
} from 'phosphor-react-native';
import AppBar from '../../components/AppBar';
import BottomMenu from '../../components/BottomMenu';
import { 
  getWhoAddedThis, 
  WhoAddedThisResult, 
  getContentTypeDisplayName 
} from '../../services/whoAddedThisApi';
import { fontConfig } from '../../styles/global';

export default function WhoAddedThisScreen() {
  const { contentId, contentType, contentTitle } = useLocalSearchParams<{
    contentId: string;
    contentType: string;
    contentTitle: string;
  }>();
  const router = useRouter();
  
  const [results, setResults] = useState<WhoAddedThisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (contentId && contentType) {
      fetchWhoAddedThis();
    }
  }, [contentId, contentType]);

  const fetchWhoAddedThis = async () => {
    try {
      setLoading(true);
      const response = await getWhoAddedThis(contentId!, contentType!);
      setResults(response.results);
    } catch (error) {
      console.error('Error fetching who added this:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWhoAddedThis();
    setRefreshing(false);
  };

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
      router.push('/create');
    } else if (tab === 'notifications') {
      router.push('/notifications');
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe size={16} color="#10B981" />;
      case 'private':
        return <Lock size={16} color="#EF4444" />;
      case 'friends':
        return <UsersIcon size={16} color="#F59E0B" />;
      default:
        return <Globe size={16} color="#6B7280" />;
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return '#10B981';
      case 'private':
        return '#EF4444';
      case 'friends':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderListItem = (item: WhoAddedThisResult, index: number) => {
    return (
      <View key={`${item.list_id}-${index}`} style={styles.listItem}>
        <TouchableOpacity 
          style={styles.listContent}
          onPress={() => handleListPress(item.list_id)}
        >
          {/* List Info */}
          <View style={styles.listInfo}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle} numberOfLines={2}>
                {item.list_title}
              </Text>
              <View style={styles.privacyBadge}>
                {getPrivacyIcon(item.list_privacy)}
              </View>
            </View>
            
            {item.list_description && (
              <Text style={styles.listDescription} numberOfLines={2}>
                {item.list_description}
              </Text>
            )}
            
            <View style={styles.listMeta}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                Added {formatDate(item.added_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* User Info */}
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => handleUserPress(item.user_id)}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={20} color="#6B7280" />
                </View>
              )}
            </View>
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {item.full_name || item.username}
              </Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Who Added This" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Who Added This" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Info */}
        <View style={styles.header}>
          <Text style={styles.contentTitle} numberOfLines={2}>
            {decodeURIComponent(contentTitle || 'Content')}
          </Text>
          <Text style={styles.contentType}>
            {getContentTypeDisplayName(contentType || '')}
          </Text>
          <Text style={styles.resultCount}>
            {results.length} {results.length === 1 ? 'list' : 'lists'} found
          </Text>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <ListIcon size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Lists Found</Text>
              <Text style={styles.emptyDescription}>
                This {getContentTypeDisplayName(contentType || '').toLowerCase()} hasn't been added to any public lists yet.
              </Text>
            </View>
          ) : (
            results.map((item, index) => renderListItem(item, index))
          )}
        </View>
      </ScrollView>

      <BottomMenu activeTab="" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(245, 245, 245)',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // Header
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  contentType: {
    fontSize: 14,
    color: '#FF6B35',
    fontFamily: 'Inter',
    fontWeight: '500',
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // Results
  resultsContainer: {
    padding: 16,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  listContent: {
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    paddingRight: 12,
  },
  privacyBadge: {
    padding: 4,
  },
  listDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // User Section
  userSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  userHandle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
});