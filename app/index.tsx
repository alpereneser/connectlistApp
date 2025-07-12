import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Share, Platform, RefreshControl, Linking } from 'react-native';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { List, Heart, MapTrifold, FilmStrip, Book, Television, GameController, UserCircle, Globe } from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';


export default function MainApp() {
  const router = useRouter();

  const handleTabPress = (tab: string) => {
    console.log('Tab pressed:', tab); // Debug log
    if (tab === 'home') {
      // Already on home page, do nothing
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


  return (
    <View style={styles.container}>
      <AppBar title="ConnectList" />
      <HomeContent />
      <BottomMenu activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

function HomeContent() {
  const router = useRouter();
  const [lists, setLists] = useState<any[]>([]);
  const [listItems, setListItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likedLists, setLikedLists] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCurrentUser();
    fetchAllLists();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return;
      }
      
      setCurrentUser(user);
      if (user) {
        // Fetch user's liked lists
        const { data: likes, error: likesError } = await supabase
          .from('list_likes')
          .select('list_id')
          .eq('user_id', user.id);
        
        if (likesError) {
          console.error('Error fetching liked lists:', likesError);
          return;
        }
        
        if (likes) {
          setLikedLists(new Set(likes.map(like => like.list_id)));
        }
      }
    } catch (error) {
      console.error('Error in fetchCurrentUser:', error);
    }
  };

  const fetchAllLists = async () => {
    try {
      // First try to fetch basic lists data
      const { data: listsData, error } = await supabase
        .from('lists')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching lists:', error);
        Alert.alert('Error', 'Failed to load lists. Please try again.');
        return;
      }

      if (listsData && listsData.length > 0) {
        // Fetch users_profiles data separately
        const userIds = [...new Set(listsData.map(list => list.creator_id))];
        const { data: usersData } = await supabase
          .from('users_profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        // Fetch categories data separately  
        const categoryNames = [...new Set(listsData.map(list => list.category).filter(Boolean))];
        console.log('Category names to fetch:', categoryNames); // Debug log
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('name, display_name')
          .in('name', categoryNames);
        console.log('Categories data:', categoriesData, 'Categories error:', categoriesError); // Debug log

        // Create lookup maps
        const usersMap = usersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}) || {};
        const categoriesMap = categoriesData?.reduce((acc, cat) => ({ ...acc, [cat.name]: cat }), {}) || {};

        // Combine data
        const enrichedLists = listsData.map(list => ({
          ...list,
          users_profiles: usersMap[list.creator_id] || null,
          categories: categoriesMap[list.category] || null
        }));

        setLists(enrichedLists);

        // Fetch items for each list
        const itemsPromises = listsData.map(async (list) => {
          try {
            const { data: items, error: itemsError } = await supabase
              .from('list_items')
              .select('*')
              .eq('list_id', list.id)
              .order('position', { ascending: true })
              .limit(10);
            
            if (itemsError) {
              console.error(`Error fetching items for list ${list.id}:`, itemsError);
              return { listId: list.id, items: [] };
            }
            
            return { listId: list.id, items: items || [] };
          } catch (error) {
            console.error(`Error in items promise for list ${list.id}:`, error);
            return { listId: list.id, items: [] };
          }
        });

        const itemsResults = await Promise.all(itemsPromises);
        const itemsMap: Record<string, any[]> = {};
        itemsResults.forEach(result => {
          itemsMap[result.listId] = result.items;
        });
        setListItems(itemsMap);
      } else {
        // No lists found
        setLists([]);
        setListItems({});
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
      Alert.alert('Error', 'Failed to load lists. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAllLists(), fetchCurrentUser()]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLike = async (listId: string, currentLikes: number) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to like lists');
      return;
    }

    const isLiked = likedLists.has(listId);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', currentUser.id);

        // Update local state
        const newLikedLists = new Set(likedLists);
        newLikedLists.delete(listId);
        setLikedLists(newLikedLists);

        // Update list likes count
        await supabase
          .from('lists')
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq('id', listId);

        // Update local list
        setLists(lists.map(list => 
          list.id === listId 
            ? { ...list, likes_count: Math.max(0, currentLikes - 1) }
            : list
        ));
      } else {
        // Like
        await supabase
          .from('list_likes')
          .insert({
            list_id: listId,
            user_id: currentUser.id
          });

        // Update local state
        const newLikedLists = new Set(likedLists);
        newLikedLists.add(listId);
        setLikedLists(newLikedLists);

        // Update list likes count
        await supabase
          .from('lists')
          .update({ likes_count: currentLikes + 1 })
          .eq('id', listId);

        // Update local list
        setLists(lists.map(list => 
          list.id === listId 
            ? { ...list, likes_count: currentLikes + 1 }
            : list
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleComment = (listId: string) => {
    // Navigate to list detail page with comments section
    router.push(`/list/${listId}#comments`);
  };

  const openYouTubeVideo = async (item: any) => {
    try {
      let videoId = null;

      // Try to extract YouTube video ID from external_data
      if (item.external_data) {
        if (item.external_data.videoId) {
          videoId = item.external_data.videoId;
        } else if (item.external_data.url) {
          const urlMatch = item.external_data.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
          if (urlMatch && urlMatch[1]) {
            videoId = urlMatch[1];
          }
        }
      }

      // If we still don't have a video ID, try to extract from content_id
      if (!videoId && item.content_id) {
        const urlMatch = item.content_id.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (urlMatch && urlMatch[1]) {
          videoId = urlMatch[1];
        } else if (item.content_id.length === 11) {
          videoId = item.content_id;
        }
      }

      if (videoId) {
        const youtubeAppUrl = `vnd.youtube://${videoId}`;
        const youtubeWebUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const canOpenYouTube = await Linking.canOpenURL(youtubeAppUrl);
        
        if (canOpenYouTube) {
          await Linking.openURL(youtubeAppUrl);
        } else {
          await Linking.openURL(youtubeWebUrl);
        }
      } else {
        // Fallback to regular details if no YouTube ID found
        if (item.content_id && item.content_type) {
          router.push(`/details/${item.content_type}/${item.content_id}`);
        }
      }
    } catch (error) {
      console.error('Error opening YouTube video:', error);
      // Fallback to regular item details
      if (item.content_id && item.content_type) {
        router.push(`/details/${item.content_type}/${item.content_id}`);
      }
    }
  };

  const handleItemPress = (item: any, listCategory?: string) => {
    if (!item.content_id || !item.content_type) {
      return;
    }

    // Check if this is a YouTube video
    const isYouTubeVideo = 
      listCategory === 'youtube' ||
      listCategory === 'videos' ||
      item.content_type === 'video' ||
      item.external_data?.videoId ||
      item.external_data?.url?.includes('youtube') ||
      item.content_id?.includes('youtube') ||
      (item.content_id?.length === 11);

    if (isYouTubeVideo) {
      openYouTubeVideo(item);
      return;
    }

    // Route to appropriate details page based on content_type
    switch (item.content_type) {
      case 'movie':
        router.push(`/details/movie/${item.content_id}`);
        break;
      case 'tv':
      case 'tv_show':
        router.push(`/details/tv/${item.content_id}`);
        break;
      case 'book':
        router.push(`/details/book/${item.content_id}`);
        break;
      case 'game':
        router.push(`/details/game/${item.content_id}`);
        break;
      case 'place':
        router.push(`/details/place/${item.content_id}`);
        break;
      case 'person':
        router.push(`/details/person/${item.content_id}`);
        break;
      case 'video':
        openYouTubeVideo(item);
        break;
      default:
        // Fallback to generic details
        router.push(`/details/${item.content_type}/${item.content_id}`);
        break;
    }
  };

  const handleShare = async (list: any) => {
    try {
      const shareUrl = `https://connectlist.app/list/${list.id}`;
      const creator = list.users_profiles;
      
      let shareMessage = `Check out this list on ConnectList!\n\n`;
      shareMessage += `📝 ${list.title}\n`;
      shareMessage += `👤 by ${creator?.full_name || creator?.username || 'Unknown'}\n`;
      
      if (list.description) {
        shareMessage += `\n${list.description}\n`;
      }
      
      shareMessage += `\n📊 ${list.item_count || 0} items`;
      shareMessage += ` • ❤️ ${list.likes_count || 0} likes`;
      shareMessage += ` • 💬 ${list.comments_count || 0} comments\n`;
      shareMessage += `\n🔗 ${shareUrl}`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: list.title,
            text: shareMessage,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Success', 'List link copied to clipboard!');
        }
      } else {
        await Share.share({
          message: shareMessage,
          title: list.title,
        });
      }
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  // Helper functions
  const getCategoryDisplayName = (category: string) => {
    if (!category) return 'General';
    
    switch (category) {
      case 'movies':
        return 'Movies';
      case 'tv_shows':
        return 'TV Shows';
      case 'books':
        return 'Books';
      case 'games':
        return 'Games';
      case 'places':
        return 'Places';
      case 'persons':
        return 'People';
      default:
        // Use the category name with proper formatting if it's not in our predefined list
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movies':
        return <FilmStrip size={16} color="#666" />;
      case 'tv_shows':
        return <Television size={16} color="#666" />;
      case 'books':
        return <Book size={16} color="#666" />;
      case 'games':
        return <GameController size={16} color="#666" />;
      case 'places':
        return <MapTrifold size={16} color="#666" />;
      case 'persons':
        return <UserCircle size={16} color="#666" />;
      default:
        return <List size={16} color="#666" />;
    }
  };

  const getItemEmoji = (contentType: string) => {
    switch (contentType) {
      case 'movie':
        return '🎬';
      case 'tv':
        return '📺';
      case 'book':
        return '📚';
      case 'game':
        return '🎮';
      case 'place':
        return '📍';
      case 'person':
        return '👤';
      default:
        return '📝';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading lists...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No lists found</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to create a list!</Text>
        </View>
      ) : (
        lists.map((list) => {
          const creator = list.users_profiles;
          const isLiked = likedLists.has(list.id);
          
          return (
            <View key={list.id} style={styles.listPreviewContainer}>
              <TouchableOpacity 
                style={styles.listHeader}
                onPress={() => router.push(`/list/${list.id}`)}
              >
                <View style={styles.listHeaderLeft}>
                  {creator?.avatar_url ? (
                    <Image source={{ uri: creator.avatar_url }} style={styles.listAuthorAvatar} />
                  ) : (
                    <View style={styles.listAuthorAvatar}>
                      <Text style={styles.listAuthorInitial}>
                        {creator?.full_name?.charAt(0) || creator?.username?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.listInfo}>
                    <View style={styles.listTitleRow}>
                      <Text style={styles.listAuthorName}>
                        {creator?.full_name || creator?.username || 'Unknown User'}
                      </Text>
                    </View>
                    <View style={styles.listMeta}>
                      <Text style={styles.listUsername}>
                        @{creator?.username || 'unknown'}
                      </Text>
                      <Text style={styles.separator}>•</Text>
                      <View style={styles.categoryTag}>
                        {getCategoryIcon(list.categories?.name || list.category)}
                        <Text style={styles.listCategory}>
                          {list.categories?.display_name || getCategoryDisplayName(list.category)}
                        </Text>
                      </View>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.listItemCount}>{getTimeAgo(list.created_at)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push(`/list/${list.id}`)}>
                <Text style={styles.listTitleMain}>{list.title}</Text>
              </TouchableOpacity>
              
              {list.description && (
                <Text style={styles.listDescriptionText}>
                  {list.description.length > 140 ? `${list.description.substring(0, 140)}...` : list.description}
                </Text>
              )}
              
              <View style={styles.divider} />
              
              {/* List Items Preview */}
              {listItems[list.id] && listItems[list.id].length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.itemsScrollView}
                >
                  <View style={styles.listItemsContainer}>
                    {listItems[list.id].map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.listItemCard}
                        onPress={() => handleItemPress(item, list.category)}
                      >
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                        ) : (
                          <View style={styles.itemImagePlaceholder}>
                            <Text style={styles.itemEmoji}>{getItemEmoji(item.content_type)}</Text>
                          </View>
                        )}
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {item.subtitle || item.content_type || 'Item'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>No items in this list yet</Text>
                </View>
              )}
              
              {/* List Stats */}
              <View style={styles.listStatsRow}>
                <TouchableOpacity 
                  style={styles.statButton}
                  onPress={() => handleLike(list.id, list.likes_count || 0)}
                >
                  <Heart 
                    size={21} 
                    color={isLiked ? "#EF4444" : "#6B7280"} 
                    weight={isLiked ? "fill" : "regular"}
                  />
                  <Text style={[styles.statText, isLiked && styles.statTextActive]}>
                    {list.likes_count || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statButton}
                  onPress={() => handleComment(list.id)}
                >
                  <Ionicons name="chatbubble-outline" size={21} color="#6B7280" />
                  <Text style={styles.statText}>{list.comments_count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statButton}
                  onPress={() => handleShare(list)}
                >
                  <Ionicons name="share-outline" size={21} color="#6B7280" />
                  <Text style={styles.statText}>{list.shares_count || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(245, 245, 245)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgb(245, 245, 245)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#9CA3AF',
  },
  // List Preview Styles
  listPreviewContainer: {
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 19,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listAuthorAvatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listAuthorInitial: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 19,
    color: '#6B7280',
  },
  listInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  listAuthorName: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#000000',
  },
  listAction: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#6B7280',
  },
  listTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#F97316',
  },
  listMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  listUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  listCategory: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  listItemCount: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  listDescriptionText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 23,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  itemsScrollView: {
    marginHorizontal: -19,
    paddingHorizontal: 19,
  },
  listItemsContainer: {
    flexDirection: 'row',
    gap: 14,
    paddingRight: 19,
  },
  listItemCard: {
    width: 117,
    alignItems: 'center',
  },
  itemImage: {
    width: 117,
    height: 164,
    backgroundColor: '#F3F4F6',
    borderRadius: 9,
    marginBottom: 9,
  },
  itemImagePlaceholder: {
    width: 117,
    height: 164,
    backgroundColor: '#F3F4F6',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
  },
  itemEmoji: {
    fontSize: 38,
  },
  itemTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 3,
  },
  itemSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  noItemsContainer: {
    paddingVertical: 23,
    alignItems: 'center',
  },
  noItemsText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#9CA3AF',
  },
  listStatsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#6B7280',
  },
  statTextActive: {
    color: '#EF4444',
  },
  listTitleMain: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    marginTop: 4,
  },
});