import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Heart, 
  Share as ShareIcon, 
  MapTrifold, 
  FilmStrip, 
  Book, 
  Television, 
  GameController, 
  UserCircle, 
  List as ListIcon,
  Calendar,
  Lock,
  Globe,
  X,
  PaperPlaneRight
} from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBar from '../../components/AppBar';
import BottomMenu from '../../components/BottomMenu';
import { fontConfig } from '../../styles/global';
import { supabase } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 60) / 3; // 3 columns with padding

interface ListDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  privacy: 'public' | 'private' | 'friends';
  creator_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  users_profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  categories?: {
    name: string;
    display_name: string;
  };
}

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  content_type: string;
  content_id?: string;
  position: number;
  list_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  list_id: string;
  created_at: string;
  updated_at: string;
  users_profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listDetail, setListDetail] = useState<ListDetail | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchListDetail();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && id) {
        // Check if user liked this list
        const { data: listLike } = await supabase
          .from('list_likes')
          .select('id')
          .eq('list_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!listLike);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchListDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .single();

      if (listError) {
        console.error('Error fetching list:', listError);
        Alert.alert('Error', 'Failed to load list details');
        return;
      }

      if (listData) {
        // Fetch creator profile
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', listData.creator_id)
          .single();

        // Fetch category data
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name, display_name')
          .eq('name', listData.category)
          .single();

        const enrichedList: ListDetail = {
          ...listData,
          users_profiles: profileData || null,
          categories: categoryData || null,
        };

        setListDetail(enrichedList);

        // Fetch list items
        const { data: itemsData, error: itemsError } = await supabase
          .from('list_items')
          .select('*')
          .eq('list_id', id)
          .order('position', { ascending: true });

        if (itemsError) {
          console.error('Error fetching list items:', itemsError);
        } else {
          setListItems(itemsData || []);
        }

        // Fetch user's liked items if logged in (if table exists)
        if (currentUser && itemsData && itemsData.length > 0) {
          try {
            const itemIds = itemsData.map(item => item.id);
            const { data: itemLikes, error: itemLikesError } = await supabase
              .from('item_likes')
              .select('item_id')
              .eq('user_id', currentUser.id)
              .in('item_id', itemIds);
            
            if (itemLikesError) {
              console.log('item_likes table not found or error:', itemLikesError);
              // Table might not exist yet, that's ok
            } else if (itemLikes) {
              setLikedItems(new Set(itemLikes.map(like => like.item_id)));
            }
          } catch (error) {
            console.log('Error fetching item likes:', error);
            // Continue without item likes functionality
          }
        }
      }
    } catch (error) {
      console.error('Error fetching list details:', error);
      Alert.alert('Error', 'Failed to load list details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = useCallback((tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'search') {
      router.push('/search');
    } else if (tab === 'add') {
      router.push('/create');
    } else if (tab === 'discover') {
      router.push('/discover');
    } else if (tab === 'profile') {
      router.push('/profile');
    }
  }, [router]);

  const handleListLike = async () => {
    if (!currentUser || !listDetail) {
      Alert.alert('Login Required', 'Please login to like lists');
      return;
    }

    try {
      if (isLiked) {
        // Unlike list
        await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listDetail.id)
          .eq('user_id', currentUser.id);

        setIsLiked(false);
        setListDetail({
          ...listDetail,
          likes_count: Math.max(0, listDetail.likes_count - 1)
        });
      } else {
        // Like list
        await supabase
          .from('list_likes')
          .insert({
            list_id: listDetail.id,
            user_id: currentUser.id
          });

        setIsLiked(true);
        setListDetail({
          ...listDetail,
          likes_count: listDetail.likes_count + 1
        });
      }
    } catch (error) {
      console.error('Error toggling list like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleItemLike = async (itemId: string, currentLikes: number) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to like items');
      return;
    }

    const isItemLiked = likedItems.has(itemId);

    try {
      if (isItemLiked) {
        // Unlike item
        const { error } = await supabase
          .from('item_likes')
          .delete()
          .eq('item_id', itemId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.log('Error unliking item (table might not exist):', error);
          return;
        }

        const newLikedItems = new Set(likedItems);
        newLikedItems.delete(itemId);
        setLikedItems(newLikedItems);

        // Update item likes count in list_items table
        await supabase
          .from('list_items')
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq('id', itemId);

        // Update local state
        setListItems(items => 
          items.map(item => 
            item.id === itemId 
              ? { ...item, likes_count: Math.max(0, currentLikes - 1) }
              : item
          )
        );
      } else {
        // Like item
        const { error } = await supabase
          .from('item_likes')
          .insert({
            item_id: itemId,
            user_id: currentUser.id
          });

        if (error) {
          console.log('Error liking item (table might not exist):', error);
          return;
        }

        const newLikedItems = new Set(likedItems);
        newLikedItems.add(itemId);
        setLikedItems(newLikedItems);

        // Update item likes count in list_items table
        await supabase
          .from('list_items')
          .update({ likes_count: currentLikes + 1 })
          .eq('id', itemId);

        // Update local state
        setListItems(items => 
          items.map(item => 
            item.id === itemId 
              ? { ...item, likes_count: currentLikes + 1 }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling item like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      setLoadingComments(true);
      
      // Fetch comments first
      const { data: commentsData, error } = await supabase
        .from('list_comments')
        .select('*')
        .eq('list_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (commentsData && commentsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        // Fetch user profiles
        const { data: usersData } = await supabase
          .from('users_profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        // Create user lookup map
        const usersMap = usersData?.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}) || {};

        // Enrich comments with user data
        const enrichedComments = commentsData.map(comment => ({
          ...comment,
          users_profiles: usersMap[comment.user_id] || null
        }));

        setComments(enrichedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    setShowCommentsModal(true);
    fetchComments();
  };

  const postComment = async () => {
    if (!newComment.trim() || !currentUser || !listDetail) {
      return;
    }

    try {
      setPostingComment(true);
      
      // Insert comment first
      const { data: commentData, error } = await supabase
        .from('list_comments')
        .insert({
          content: newComment.trim(),
          user_id: currentUser.id,
          list_id: listDetail.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error posting comment:', error);
        Alert.alert('Error', 'Failed to post comment');
        return;
      }

      // Get user profile separately
      const { data: userProfile } = await supabase
        .from('users_profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', currentUser.id)
        .single();

      // Combine comment with user profile
      const enrichedComment = {
        ...commentData,
        users_profiles: userProfile
      };

      setComments(prev => [...prev, enrichedComment]);
      setNewComment('');
      
      // Update comments count
      setListDetail({
        ...listDetail,
        comments_count: listDetail.comments_count + 1
      });
      
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString();
  };

  const handleShare = async (item?: ListItem) => {
    try {
      const isItemShare = !!item;
      const shareUrl = isItemShare 
        ? `https://connectlist.app/item/${item.id}`
        : `https://connectlist.app/list/${listDetail?.id}`;
      
      let shareMessage = isItemShare
        ? `Check out this item on ConnectList!\n\n`
        : `Check out this list on ConnectList!\n\n`;
      
      if (isItemShare) {
        shareMessage += `📝 ${item.title}\n`;
        if (item.subtitle) {
          shareMessage += `${item.subtitle}\n`;
        }
        shareMessage += `\n📊 ${item.likes_count || 0} likes • ${item.comments_count || 0} comments\n`;
      } else {
        shareMessage += `📝 ${listDetail?.title}\n`;
        shareMessage += `👤 by ${listDetail?.users_profiles?.full_name || listDetail?.users_profiles?.username || 'Unknown'}\n`;
        
        if (listDetail?.description) {
          shareMessage += `\n${listDetail.description}\n`;
        }
        
        shareMessage += `\n📊 ${listDetail?.item_count || 0} items`;
        shareMessage += ` • ❤️ ${listDetail?.likes_count || 0} likes`;
        shareMessage += ` • 💬 ${listDetail?.comments_count || 0} comments\n`;
      }
      
      shareMessage += `\n🔗 ${shareUrl}`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: isItemShare ? item.title : listDetail?.title,
            text: shareMessage,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Success', 'Link copied to clipboard!');
        }
      } else {
        await Share.share({
          message: shareMessage,
          title: isItemShare ? item.title : listDetail?.title,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movies':
        return <FilmStrip size={16} color="#8B5CF6" />;
      case 'tv_shows':
        return <Television size={16} color="#F59E0B" />;
      case 'books':
        return <Book size={16} color="#3B82F6" />;
      case 'games':
        return <GameController size={16} color="#EF4444" />;
      case 'places':
        return <MapTrifold size={16} color="#10B981" />;
      case 'persons':
        return <UserCircle size={16} color="#6B7280" />;
      default:
        return <ListIcon size={16} color="#6B7280" />;
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

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return <Lock size={14} color="#6B7280" />;
      case 'friends':
        return <UserCircle size={14} color="#6B7280" />;
      default:
        return <Globe size={14} color="#6B7280" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="List Details" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading list details...</Text>
        </View>
        <BottomMenu activeTab="home" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!listDetail) {
    return (
      <View style={styles.container}>
        <AppBar title="List Details" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>List not found</Text>
        </View>
        <BottomMenu activeTab="home" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="List Details" showBackButton />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* List Header */}
        <View style={styles.listHeader}>
          {/* Creator Info */}
          <View style={styles.creatorInfo}>
            {listDetail.users_profiles?.avatar_url ? (
              <Image 
                source={{ uri: listDetail.users_profiles.avatar_url }} 
                style={styles.creatorAvatar} 
              />
            ) : (
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorInitial}>
                  {listDetail.users_profiles?.full_name?.charAt(0) || 
                   listDetail.users_profiles?.username?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>
                {listDetail.users_profiles?.full_name || 
                 listDetail.users_profiles?.username || 'Unknown User'}
              </Text>
              <Text style={styles.creatorUsername}>
                @{listDetail.users_profiles?.username || 'unknown'}
              </Text>
            </View>
          </View>

          {/* List Info */}
          <View style={styles.listInfo}>
            <Text style={styles.listTitle}>{listDetail.title}</Text>
            
            {listDetail.description && (
              <Text style={styles.listDescription}>{listDetail.description}</Text>
            )}

            <View style={styles.listMeta}>
              <View style={styles.categoryTag}>
                {getCategoryIcon(listDetail.category)}
                <Text style={styles.categoryText}>
                  {listDetail.categories?.display_name || 
                   (listDetail.category ? listDetail.category.charAt(0).toUpperCase() + listDetail.category.slice(1) : 'General')}
                </Text>
              </View>
              
              <View style={styles.privacyTag}>
                {getPrivacyIcon(listDetail.privacy)}
                <Text style={styles.privacyText}>
                  {listDetail.privacy === 'private' ? 'Private' : 
                   listDetail.privacy === 'friends' ? 'Friends' : 'Public'}
                </Text>
              </View>
            </View>

            <View style={styles.listStats}>
              <Text style={styles.statText}>{listDetail.item_count} items</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.statText}>
                Created {new Date(listDetail.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

        </View>

        {/* List Items */}
        <View style={styles.itemsSection}>
          
          {listItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this list yet</Text>
            </View>
          ) : (
            <View style={styles.itemsGrid}>
              {listItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.itemCard}
                  onPress={() => {
                    if (item.content_id && item.content_type) {
                      router.push(`/details/${item.content_type}/${item.content_id}`);
                    }
                  }}
                >
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Text style={styles.itemEmoji}>{getItemEmoji(item.content_type)}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  
                  {item.subtitle && (
                    <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* List Actions */}
          <View style={styles.listActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleListLike}
            >
              <Heart 
                size={20} 
                color={isLiked ? "#EF4444" : "#6B7280"} 
                weight={isLiked ? "fill" : "regular"}
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {listDetail.likes_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleComment}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text style={styles.actionText}>{listDetail.comments_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare()}
            >
              <ShareIcon size={20} color="#6B7280" />
              <Text style={styles.actionText}>{listDetail.shares_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.commentsModal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            style={styles.commentsList}
            data={comments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                {item.users_profiles?.avatar_url ? (
                  <Image 
                    source={{ uri: item.users_profiles.avatar_url }} 
                    style={styles.commentAvatar} 
                  />
                ) : (
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {item.users_profiles?.full_name?.charAt(0) || 
                       item.users_profiles?.username?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>
                      {item.users_profiles?.username || 'unknown'}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatCommentTime(item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyComments}>
                {loadingComments ? (
                  <ActivityIndicator size="small" color="#F97316" />
                ) : (
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                )}
              </View>
            )}
          />

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[
                  styles.commentSendButton,
                  (!newComment.trim() || postingComment) && styles.commentSendButtonDisabled
                ]}
                onPress={postComment}
                disabled={!newComment.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <PaperPlaneRight size={18} color="#FFFFFF" weight="fill" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomMenu activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...fontConfig.medium,
    fontSize: 18,
    color: '#6B7280',
  },
  
  // List Header Styles
  listHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorInitial: {
    ...fontConfig.medium,
    fontSize: 18,
    color: '#6B7280',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    ...fontConfig.medium,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  creatorUsername: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  
  listInfo: {
    marginBottom: 16,
  },
  listTitle: {
    ...fontConfig.semibold,
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  listDescription: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    ...fontConfig.medium,
    fontSize: 12,
    color: '#374151',
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  
  listActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#6B7280',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  
  // Items Section Styles
  itemsSection: {
    padding: 20,
  },
  sectionTitle: {
    ...fontConfig.semibold,
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#9CA3AF',
  },
  
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: itemWidth,
    marginBottom: 16,
  },
  itemImage: {
    width: '100%',
    height: itemWidth * 1.4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 6,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: itemWidth * 1.4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemTitle: {
    ...fontConfig.medium,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 2,
  },
  itemSubtitle: {
    ...fontConfig.regular,
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Comments Modal Styles
  commentsModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commentsTitle: {
    ...fontConfig.semibold,
    fontSize: 18,
    color: '#1F2937',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#6B7280',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#1F2937',
    marginRight: 8,
  },
  commentTime: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#9CA3AF',
  },
  commentInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  commentInput: {
    flex: 1,
    ...fontConfig.regular,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  commentSendButton: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentSendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});