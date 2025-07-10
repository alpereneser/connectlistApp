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
  PanResponder,
  Animated,
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
  PaperPlaneRight,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Plus,
  Check,
  Star,
  StarOutline,
  QrCode,
  Share as ShareOutline,
  DotsSixVertical,
  ArrowsOutCardinal,
  MagnifyingGlass
} from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBar from '../../components/AppBar';
import BottomMenu from '../../components/BottomMenu';
import { fontConfig } from '../../styles/global';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchPlaces, PlaceResult } from '../../services/yandexApi';
import { searchMulti, MovieResult, TVShowResult, PersonResult, getImageUrl } from '../../services/tmdbApi';
import { searchGames, GameResult, getGameImageUrl } from '../../services/rawgApi';
import { searchBooks, BookResult, getBookImageUrl } from '../../services/googleBooksApi';

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
  parent_id?: string;
  created_at: string;
  updated_at: string;
  users_profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  
  // Edit list modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Following state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Options menu state
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // QR code modal state
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Reorder mode state
  const [reorderMode, setReorderMode] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [contentSearchQuery, setContentSearchQuery] = useState('');
  const [contentSearchResults, setContentSearchResults] = useState<any[]>([]);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(new Animated.Value(0));
  
  // Offline support state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineData, setOfflineData] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchListDetail();
    loadOfflineData();
  }, [id]);

  const loadOfflineData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(`list_${id}`);
      if (cachedData) {
        setOfflineData(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async (data: any) => {
    try {
      await AsyncStorage.setItem(`list_${id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && id) {
        // Check if user liked this list
        const { data: listLike, error: likeError } = await supabase
          .from('list_likes')
          .select('id')
          .eq('list_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!likeError) {
          setIsLiked(!!listLike);
        }
        
        // Check if user is following this list
        const { data: followData, error: followError } = await supabase
          .from('list_follows')
          .select('id')
          .eq('list_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!followError) {
          setIsFollowing(!!followData);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchListDetail = async () => {
    try {
      setLoading(true);
      
      // Check if we're offline by trying a quick request
      let isOnline = true;
      try {
        await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
      } catch (error) {
        isOnline = false;
        setIsOffline(true);
      }
      
      // If offline, use cached data
      if (!isOnline && offlineData) {
        setListDetail(offlineData.listDetail);
        setListItems(offlineData.listItems);
        setLoading(false);
        return;
      }
      
      // Fetch list details with category join
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select(`
          *,
          users_profiles:creator_id(id, username, full_name, avatar_url),
          categories:category_id(name, display_name)
        `)
        .eq('id', id)
        .single();

      if (listError) {
        console.error('Error fetching list:', listError);
        // Try to use cached data as fallback
        if (offlineData) {
          setListDetail(offlineData.listDetail);
          setListItems(offlineData.listItems);
          setIsOffline(true);
          setLoading(false);
          return;
        }
        Alert.alert('Error', 'Failed to load list details');
        return;
      }

      if (listData) {
        // Add category name to the main object for easier access
        const enrichedList: ListDetail = {
          ...listData,
          category: listData.categories?.name || null,
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
        
        // Save to offline cache
        const cacheData = {
          listDetail: enrichedList,
          listItems: itemsData || [],
          timestamp: Date.now()
        };
        await saveOfflineData(cacheData);
        setIsOffline(false);

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
        const { error } = await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listDetail.id)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('Error unliking list:', error);
          Alert.alert('Error', 'Failed to unlike list');
          return;
        }

        setIsLiked(false);
        setListDetail({
          ...listDetail,
          likes_count: Math.max(0, listDetail.likes_count - 1)
        });
      } else {
        // Like list
        const { error } = await supabase
          .from('list_likes')
          .insert({
            list_id: listDetail.id,
            user_id: currentUser.id
          });

        if (error) {
          console.error('Error liking list:', error);
          Alert.alert('Error', 'Failed to like list');
          return;
        }

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
      
      console.log('Fetching comments for list:', id);
      
      // Fetch comments first
      const { data: commentsData, error } = await supabase
        .from('list_comments')
        .select('*')
        .eq('list_id', id)
        .order('created_at', { ascending: true });

      console.log('Comments data:', commentsData);
      console.log('Comments error:', error);

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

        // Organize comments into threads (parent comments with replies)
        const parentComments = enrichedComments.filter(comment => !comment.parent_id);
        const commentThreads = parentComments.map(parent => ({
          ...parent,
          replies: enrichedComments.filter(comment => comment.parent_id === parent.id)
        }));

        console.log('Enriched comments with threads:', commentThreads);
        setComments(commentThreads);
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

  const postComment = async (parentId?: string) => {
    const commentText = parentId ? replyText : newComment;
    if (!commentText.trim() || !currentUser || !listDetail) {
      return;
    }

    try {
      setPostingComment(true);
      
      // Insert comment first
      const { data: commentData, error } = await supabase
        .from('list_comments')
        .insert({
          content: commentText.trim(),
          user_id: currentUser.id,
          list_id: listDetail.id,
          parent_id: parentId || null
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

      // Create enriched comment object
      const enrichedComment = {
        ...commentData,
        users_profiles: userProfile
      };

      if (parentId) {
        // If replying, add to the parent comment's replies
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), enrichedComment] }
            : comment
        ));
        setReplyText('');
        setReplyingTo(null);
      } else {
        // If new comment, add to the main comments list
        setComments(prev => [...prev, { ...enrichedComment, replies: [] }]);
        setNewComment('');
      }
      
      // Update comments count manually
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

  const deleteComment = async (commentId: string, parentId?: string) => {
    if (!currentUser) return;

    try {
      setDeletingComment(commentId);
      
      const { error } = await supabase
        .from('list_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Only allow users to delete their own comments

      if (error) {
        console.error('Error deleting comment:', error);
        Alert.alert('Error', 'Failed to delete comment');
        return;
      }

      // Remove comment from UI
      if (parentId) {
        // Remove reply from parent comment
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replies: comment.replies?.filter(reply => reply.id !== commentId) || [] }
            : comment
        ));
      } else {
        // Remove main comment and all its replies
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }

      // Update comments count manually
      if (listDetail) {
        setListDetail({
          ...listDetail,
          comments_count: Math.max((listDetail.comments_count || 0) - 1, 0)
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment');
    } finally {
      setDeletingComment(null);
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

  const handleEditList = () => {
    if (!listDetail) return;
    
    setEditTitle(listDetail.title);
    setEditDescription(listDetail.description || '');
    setShowEditModal(true);
    setShowOptionsMenu(false);
  };

  const saveListChanges = async () => {
    if (!listDetail || !currentUser || !editTitle.trim()) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('lists')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', listDetail.id);

      if (error) {
        console.error('Error updating list:', error);
        Alert.alert('Error', 'Failed to update list');
        return;
      }

      setListDetail({
        ...listDetail,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined
      });
      
      setShowEditModal(false);
      Alert.alert('Success', 'List updated successfully');
      
    } catch (error) {
      console.error('Error updating list:', error);
      Alert.alert('Error', 'Failed to update list');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = () => {
    setShowDeleteModal(true);
    setShowOptionsMenu(false);
  };

  const confirmDeleteList = async () => {
    if (!listDetail || !currentUser) return;
    
    try {
      setDeleting(true);
      
      // Delete list items first
      const { error: itemsError } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listDetail.id);

      if (itemsError) {
        console.error('Error deleting list items:', itemsError);
        Alert.alert('Error', 'Failed to delete list');
        return;
      }

      // Delete list comments
      const { error: commentsError } = await supabase
        .from('list_comments')
        .delete()
        .eq('list_id', listDetail.id);

      if (commentsError) {
        console.log('Error deleting comments (might not exist):', commentsError);
      }

      // Delete list likes
      const { error: likesError } = await supabase
        .from('list_likes')
        .delete()
        .eq('list_id', listDetail.id);

      if (likesError) {
        console.log('Error deleting likes (might not exist):', likesError);
      }

      // Delete list follows
      const { error: followsError } = await supabase
        .from('list_follows')
        .delete()
        .eq('list_id', listDetail.id);

      if (followsError) {
        console.log('Error deleting follows (might not exist):', followsError);
      }

      // Finally delete the list
      const { error: listError } = await supabase
        .from('lists')
        .delete()
        .eq('id', listDetail.id);

      if (listError) {
        console.error('Error deleting list:', listError);
        Alert.alert('Error', 'Failed to delete list');
        return;
      }
      
      Alert.alert('Success', 'List deleted successfully', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
      
    } catch (error) {
      console.error('Error deleting list:', error);
      Alert.alert('Error', 'Failed to delete list');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleFollowList = async () => {
    if (!currentUser || !listDetail) {
      Alert.alert('Login Required', 'Please login to follow lists');
      return;
    }

    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow list
        const { error } = await supabase
          .from('list_follows')
          .delete()
          .eq('list_id', listDetail.id)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('Error unfollowing list:', error);
          Alert.alert('Error', 'Failed to unfollow list');
          return;
        }

        setIsFollowing(false);
      } else {
        // Follow list
        const { error } = await supabase
          .from('list_follows')
          .insert({
            list_id: listDetail.id,
            user_id: currentUser.id
          });

        if (error) {
          console.error('Error following list:', error);
          Alert.alert('Error', 'Failed to follow list');
          return;
        }

        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareWithStats = async (item?: ListItem) => {
    try {
      // Update share count in database
      if (item) {
        await supabase
          .from('list_items')
          .update({ shares_count: (item.shares_count || 0) + 1 })
          .eq('id', item.id);
        
        // Update local state
        setListItems(items => 
          items.map(i => 
            i.id === item.id 
              ? { ...i, shares_count: (i.shares_count || 0) + 1 }
              : i
          )
        );
      } else if (listDetail) {
        await supabase
          .from('lists')
          .update({ shares_count: (listDetail.shares_count || 0) + 1 })
          .eq('id', listDetail.id);
        
        // Update local state
        setListDetail({
          ...listDetail,
          shares_count: (listDetail.shares_count || 0) + 1
        });
      }
      
      // Call original share function
      await handleShare(item);
      
    } catch (error) {
      console.error('Error updating share stats:', error);
      // Still proceed with sharing even if stats update fails
      await handleShare(item);
    }
  };

  const generateQRCode = () => {
    setShowQRModal(true);
  };

  const toggleReorderMode = () => {
    setReorderMode(!reorderMode);
    setShowOptionsMenu(false);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newItems = [...listItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    // Update positions
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setListItems(updatedItems);
    return updatedItems;
  };

  const saveItemOrder = async (updatedItems: ListItem[]) => {
    try {
      // Update positions in database
      const updates = updatedItems.map(item => ({
        id: item.id,
        position: item.position
      }));

      for (const update of updates) {
        await supabase
          .from('list_items')
          .update({ position: update.position })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error saving item order:', error);
      Alert.alert('Error', 'Failed to save item order');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        Alert.alert('Error', 'Failed to delete item');
        return;
      }

      // Remove from local state
      const newItems = listItems.filter(item => item.id !== itemId);
      setListItems(newItems);
      
      // Update list item count
      if (listDetail) {
        setListDetail({
          ...listDetail,
          item_count: Math.max(0, listDetail.item_count - 1)
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const isListOwner = currentUser && listDetail && currentUser.id === listDetail.creator_id;

  const searchContent = async (query: string) => {
    if (!query.trim() || !listDetail) return;
    
    setIsSearchingContent(true);
    try {
      let results: any[] = [];
      
      const category = listDetail.category;
      console.log('Searching for:', query, 'in category:', category);
      console.log('Category from join:', listDetail.categories?.name);
      console.log('Category fallback:', listDetail.category);
      
      // Search based on list category
      switch (category) {
        case 'movies':
          const movieResults = await searchMulti(query, 1);
          results = movieResults.movies.map((movie: MovieResult) => ({
            id: movie.id,
            content_id: movie.id.toString(),
            content_type: 'movie',
            type: 'movie',
            title: movie.title,
            subtitle: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '',
            description: movie.overview,
            image_url: movie.poster_path ? getImageUrl(movie.poster_path) : undefined,
            external_data: movie
          }));
          break;
          
        case 'tv_shows':
          const tvResults = await searchMulti(query, 1);
          results = tvResults.tvShows.map((tv: TVShowResult) => ({
            id: tv.id,
            content_id: tv.id.toString(),
            content_type: 'tv',
            type: 'tv',
            title: tv.name,
            subtitle: tv.first_air_date ? new Date(tv.first_air_date).getFullYear().toString() : '',
            description: tv.overview,
            image_url: tv.poster_path ? getImageUrl(tv.poster_path) : undefined,
            external_data: tv
          }));
          break;
          
        case 'books':
          const bookResponse = await searchBooks(query);
          console.log('Book search response:', bookResponse.totalItems, 'books found');
          results = (bookResponse.items || []).map((book: BookResult) => ({
            id: book.id,
            content_id: book.id,
            content_type: 'book',
            type: 'book',
            title: book.volumeInfo?.title || '',
            subtitle: book.volumeInfo?.authors?.join(', ') || '',
            description: book.volumeInfo?.description || '',
            image_url: getBookImageUrl(book),
            external_data: book
          }));
          break;
          
        case 'games':
          const gameResults = await searchGames(query);
          console.log('Game search results:', gameResults.count, 'games found');
          console.log('Raw game results:', JSON.stringify(gameResults, null, 2));
          results = gameResults.results.map((game: GameResult) => ({
            id: game.id,
            content_id: game.id.toString(),
            content_type: 'game',
            type: 'game',
            title: game.name,
            subtitle: game.released || '',
            description: '', // GameResult doesn't have description_raw field
            image_url: getGameImageUrl(game.background_image),
            external_data: game
          }));
          console.log('Processed game results:', results.length, 'games processed');
          break;
          
        case 'places':
          const placeResponse = await searchPlaces(query);
          console.log('Place search response:', placeResponse.total, 'places found');
          results = (placeResponse.results || []).map((place: PlaceResult) => ({
            id: place.id,
            content_id: place.id,
            content_type: 'place',
            type: 'place',
            title: place.name,
            subtitle: place.address,
            description: place.description || '',
            image_url: place.image,
            external_data: place
          }));
          break;
          
        case 'person':
          const personResults = await searchMulti(query, 1);
          results = personResults.people.map((person: PersonResult) => ({
            id: person.id,
            content_id: person.id.toString(),
            content_type: 'person',
            type: 'person',
            title: person.name,
            subtitle: person.known_for_department || '',
            description: '',
            image_url: person.profile_path ? getImageUrl(person.profile_path) : undefined,
            external_data: person
          }));
          break;
          
        case 'videos':
          // Parse YouTube URL and extract video info
          const videoId = extractYouTubeVideoId(query);
          if (videoId) {
            try {
              // Create a video result from the URL
              const videoResult = {
                id: videoId,
                content_id: videoId,
                content_type: 'video',
                type: 'video',
                title: 'YouTube Video',
                subtitle: 'Click to add this video',
                description: query,
                image_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                external_data: {
                  videoId,
                  url: query,
                  platform: 'youtube'
                }
              };
              results = [videoResult];
            } catch (error) {
              console.error('Error processing YouTube URL:', error);
              results = [];
            }
          } else {
            results = [];
          }
          break;
          
        default:
          console.log('DEFAULT CASE! Category not recognized:', category);
          // For general category, search all types
          const allResults = await searchMulti(query, 1);
          const allMovieResults = allResults.movies.map((item: any) => ({
            ...item,
            media_type: 'movie'
          }));
          const allTvResults = allResults.tvShows.map((item: any) => ({
            ...item,
            media_type: 'tv'
          }));
          const allPersonResults = allResults.people.map((item: any) => ({
            ...item,
            media_type: 'person'
          }));
          
          const allItems = [...allMovieResults, ...allTvResults, ...allPersonResults];
          results = allItems.map((item: any) => {
            if (item.media_type === 'movie') {
              return {
                id: item.id,
                content_id: item.id.toString(),
                content_type: 'movie',
                type: 'movie',
                title: item.title,
                subtitle: item.release_date ? new Date(item.release_date).getFullYear().toString() : '',
                description: item.overview,
                image_url: item.poster_path ? getImageUrl(item.poster_path) : undefined,
                external_data: item
              };
            } else if (item.media_type === 'tv') {
              return {
                id: item.id,
                content_id: item.id.toString(),
                content_type: 'tv',
                type: 'tv',
                title: item.name,
                subtitle: item.first_air_date ? new Date(item.first_air_date).getFullYear().toString() : '',
                description: item.overview,
                image_url: item.poster_path ? getImageUrl(item.poster_path) : undefined,
                external_data: item
              };
            } else if (item.media_type === 'person') {
              return {
                id: item.id,
                content_id: item.id.toString(),
                content_type: 'person',
                type: 'person',
                title: item.name,
                subtitle: item.known_for_department || '',
                description: '',
                image_url: item.profile_path ? getImageUrl(item.profile_path) : undefined,
                external_data: item
              };
            }
            return null;
          }).filter(Boolean);
      }
      
      console.log('Final results to display:', results.length, 'items');
      setContentSearchResults(results);
    } catch (error) {
      console.error('Error searching content:', error);
      Alert.alert('Error', 'Failed to search content');
    } finally {
      setIsSearchingContent(false);
    }
  };

  // YouTube URL extraction helper
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const closeAddContentModal = () => {
    setShowAddContentModal(false);
    setContentSearchQuery('');
    setContentSearchResults([]);
    setSelectedItems([]);
  };

  const toggleItemSelection = (item: any) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(selected => selected.id === item.id);
      if (isSelected) {
        // Remove from selection
        return prev.filter(selected => selected.id !== item.id);
      } else {
        // Add to selection
        return [...prev, item];
      }
    });
  };

  const isItemSelected = (itemId: string) => {
    return selectedItems.some(item => item.id === itemId);
  };

  const handleFinishSelection = async () => {
    if (!listDetail || !currentUser || selectedItems.length === 0) return;

    setIsAddingItems(true);
    try {
      // Get the highest position in the current list
      const maxPosition = Math.max(...listItems.map(item => item.position), 0);
      
      // Prepare items for batch insert
      const itemsToInsert = selectedItems.map((item, index) => ({
        list_id: listDetail.id,
        external_id: item.content_id,
        title: item.title,
        description: item.description,
        subtitle: item.subtitle,
        image_url: item.image_url,
        external_data: item.external_data,
        content_id: item.content_id,
        content_type: item.content_type,
        position: maxPosition + index + 1,
        source: 'search'
      }));

      // Insert all items at once
      const { data: insertedItems, error } = await supabase
        .from('list_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;

      // Update local state
      setListItems(prev => [...prev, ...insertedItems]);
      
      // Update list item count
      const { error: updateError } = await supabase
        .from('lists')
        .update({ 
          item_count: listDetail.item_count + selectedItems.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', listDetail.id);

      if (updateError) throw updateError;

      // Update local list detail
      setListDetail(prev => prev && {
        ...prev,
        item_count: prev.item_count + selectedItems.length
      });
      
      closeAddContentModal();
      Alert.alert('Success', `${selectedItems.length} items added to your list!`);
      
    } catch (error) {
      console.error('Error adding items:', error);
      Alert.alert('Error', 'Failed to add items to list');
    } finally {
      setIsAddingItems(false);
    }
  };

  const handleContentSearch = (query: string) => {
    setContentSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (listDetail?.category === 'videos') {
      // For videos, parse immediately
      if (query.trim().length > 0) {
        searchContent(query);
      } else {
        setContentSearchResults([]);
      }
    } else {
      // For other categories, use debounce
      if (query.trim().length >= 2) {
        const timeout = setTimeout(() => {
          searchContent(query);
        }, 500);
        setSearchTimeout(timeout);
      } else {
        setContentSearchResults([]);
      }
    }
  };

  // Legacy function - now using batch selection instead

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
      
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>You're offline - showing cached data</Text>
        </View>
      )}
      
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
            
            <View style={styles.headerActions}>
              {!isListOwner && (
                <TouchableOpacity 
                  style={[styles.followButton, isFollowing && styles.followButtonActive]}
                  onPress={handleFollowList}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? "#FFFFFF" : "#F97316"} />
                  ) : (
                    <>
                      {isFollowing ? (
                        <Check size={16} color="#FFFFFF" />
                      ) : (
                        <Plus size={16} color="#F97316" />
                      )}
                      <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.optionsButton}
                onPress={() => setShowOptionsMenu(true)}
              >
                <DotsThreeVertical size={20} color="#6B7280" />
              </TouchableOpacity>
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
              <Text style={styles.separator}> • </Text>
              <Text style={styles.statText}>
                Created {new Date(listDetail.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

        </View>

        {/* List Items */}
        <View style={styles.itemsSection}>
          {reorderMode && isListOwner && (
            <View style={styles.reorderHeader}>
              <Text style={styles.reorderText}>Drag items to reorder</Text>
              <TouchableOpacity 
                style={styles.reorderDoneButton}
                onPress={() => setReorderMode(false)}
              >
                <Text style={styles.reorderDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Add Content Button removed from here - moved to three-dots menu */}
          
          {listItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this list yet</Text>
            </View>
          ) : (
            <View style={styles.itemsGrid}>
              {listItems.map((item, index) => (
                <View key={item.id} style={styles.itemCard}>
                  {reorderMode && isListOwner && (
                    <View style={styles.itemControls}>
                      <TouchableOpacity 
                        style={styles.dragHandle}
                        onLongPress={() => {
                          // Simple reorder with buttons for now
                          if (index > 0) {
                            const updatedItems = moveItem(index, index - 1);
                            saveItemOrder(updatedItems);
                          }
                        }}
                      >
                        <DotsSixVertical size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteItemButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Item',
                            'Are you sure you want to delete this item?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) }
                            ]
                          );
                        }}
                      >
                        <Trash size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.itemContent}
                    onPress={() => {
                      if (!reorderMode && item.content_id && item.content_type) {
                        router.push(`/details/${item.content_type}/${item.content_id}`);
                      }
                    }}
                    disabled={reorderMode}
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
                  
                  {reorderMode && isListOwner && (
                    <View style={styles.itemReorderButtons}>
                      <TouchableOpacity 
                        style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                        onPress={() => {
                          if (index > 0) {
                            const updatedItems = moveItem(index, index - 1);
                            saveItemOrder(updatedItems);
                          }
                        }}
                        disabled={index === 0}
                      >
                        <Text style={styles.reorderButtonText}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.reorderButton, index === listItems.length - 1 && styles.reorderButtonDisabled]}
                        onPress={() => {
                          if (index < listItems.length - 1) {
                            const updatedItems = moveItem(index, index + 1);
                            saveItemOrder(updatedItems);
                          }
                        }}
                        disabled={index === listItems.length - 1}
                      >
                        <Text style={styles.reorderButtonText}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
              onPress={() => handleShareWithStats()}
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
              <View>
                {/* Main Comment */}
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
                      {currentUser?.id === item.user_id && (
                        <TouchableOpacity 
                          style={styles.deleteCommentButton}
                          onPress={() => deleteComment(item.id)}
                          disabled={deletingComment === item.id}
                        >
                          {deletingComment === item.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <Trash size={16} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{item.content}</Text>
                    
                    {/* Comment Actions */}
                    <View style={styles.commentActions}>
                      <TouchableOpacity 
                        style={styles.replyButton}
                        onPress={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                      >
                        <Text style={styles.replyButtonText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Reply Input for this comment */}
                    {replyingTo === item.id && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Write a reply..."
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                          maxLength={500}
                        />
                        <View style={styles.replyActions}>
                          <TouchableOpacity 
                            style={styles.cancelReplyButton}
                            onPress={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            <Text style={styles.cancelReplyText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[
                              styles.sendReplyButton,
                              (!replyText.trim() || postingComment) && styles.sendReplyButtonDisabled
                            ]}
                            onPress={() => postComment(item.id)}
                            disabled={!replyText.trim() || postingComment}
                          >
                            {postingComment ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.sendReplyText}>Reply</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Replies */}
                {item.replies && item.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {item.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        {reply.users_profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: reply.users_profiles.avatar_url }} 
                            style={styles.replyAvatar} 
                          />
                        ) : (
                          <View style={styles.replyAvatar}>
                            <Text style={styles.replyAvatarText}>
                              {reply.users_profiles?.full_name?.charAt(0) || 
                               reply.users_profiles?.username?.charAt(0) || '?'}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.replyContent}>
                          <View style={styles.replyHeader}>
                            <Text style={styles.replyUsername}>
                              {reply.users_profiles?.username || 'unknown'}
                            </Text>
                            <Text style={styles.replyTime}>
                              {formatCommentTime(reply.created_at)}
                            </Text>
                            {currentUser?.id === reply.user_id && (
                              <TouchableOpacity 
                                style={styles.deleteReplyButton}
                                onPress={() => deleteComment(reply.id, item.id)}
                                disabled={deletingComment === reply.id}
                              >
                                {deletingComment === reply.id ? (
                                  <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                  <Trash size={14} color="#EF4444" />
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={styles.replyText}>{reply.content}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            {isListOwner && (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={() => setShowAddContentModal(true)}>
                  <Plus size={20} color="#F97316" />
                  <Text style={styles.optionText}>Add Content</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleEditList}>
                  <PencilSimple size={20} color="#374151" />
                  <Text style={styles.optionText}>Edit List</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={toggleReorderMode}>
                  <ArrowsOutCardinal size={20} color="#374151" />
                  <Text style={styles.optionText}>
                    {reorderMode ? 'Exit Reorder Mode' : 'Reorder Items'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleDeleteList}>
                  <Trash size={20} color="#EF4444" />
                  <Text style={[styles.optionText, styles.optionTextDanger]}>Delete List</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
              </>
            )}
            <TouchableOpacity style={styles.optionItem} onPress={generateQRCode}>
              <QrCode size={20} color="#374151" />
              <Text style={styles.optionText}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => handleShareWithStats()}>
              <ShareOutline size={20} color="#374151" />
              <Text style={styles.optionText}>Share List</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.editModal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.editCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>Edit List</Text>
            <TouchableOpacity 
              onPress={saveListChanges}
              disabled={saving || !editTitle.trim()}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Text style={[styles.editSaveButton, !editTitle.trim() && styles.editSaveButtonDisabled]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.editContent}>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Title</Text>
              <TextInput
                style={styles.editInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter list title"
                maxLength={100}
              />
            </View>
            
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Description</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter list description (optional)"
                multiline
                maxLength={500}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete List</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this list? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity 
                style={styles.deleteCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={confirmDeleteList}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrContent}>
              <View style={styles.qrCodePlaceholder}>
                <QrCode size={120} color="#F97316" />
                <Text style={styles.qrCodeText}>QR Code for this list</Text>
              </View>
              <Text style={styles.qrUrl}>
                https://connectlist.app/list/{listDetail?.id}
              </Text>
              <TouchableOpacity 
                style={styles.qrShareButton}
                onPress={() => {
                  setShowQRModal(false);
                  handleShareWithStats();
                }}
              >
                <ShareOutline size={16} color="#FFFFFF" />
                <Text style={styles.qrShareText}>Share QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Content Modal */}
      <Modal
        visible={showAddContentModal}
        animationType="slide"
        onRequestClose={closeAddContentModal}
      >
        <KeyboardAvoidingView 
          style={styles.addContentModal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.addContentHeader}>
            <TouchableOpacity onPress={closeAddContentModal}>
              <Text style={styles.addContentCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.addContentTitle}>
              Add Content {selectedItems.length > 0 && `(${selectedItems.length})`}
            </Text>
            {selectedItems.length > 0 && (
              <TouchableOpacity 
                onPress={handleFinishSelection}
                disabled={isAddingItems}
                style={styles.finishButton}
              >
                {isAddingItems ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.finishButtonText}>Finish</Text>
                )}
              </TouchableOpacity>
            )}
            {selectedItems.length === 0 && <View style={styles.addContentSpacer} />}
          </View>
          
          <View style={styles.addContentBody}>
            {listDetail?.category === 'videos' ? (
              <View style={styles.searchInputContainer}>
                <Text style={styles.youtubeInputLabel}>YouTube Video URL</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Paste YouTube video URL here..."
                  value={contentSearchQuery}
                  onChangeText={handleContentSearch}
                  returnKeyType="done"
                  autoFocus
                  keyboardType="url"
                />
                {contentSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setContentSearchQuery('');
                      setContentSearchResults([]);
                      setSelectedItems([]);
                    }}
                    style={styles.clearButton}
                  >
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.searchInputContainer}>
                <MagnifyingGlass size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${listDetail?.categories?.display_name || listDetail?.category || 'content'}...`}
                  value={contentSearchQuery}
                  onChangeText={handleContentSearch}
                  returnKeyType="search"
                  autoFocus
                />
                {contentSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setContentSearchQuery('');
                      setContentSearchResults([]);
                      setSelectedItems([]);
                    }}
                    style={styles.clearButton}
                  >
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {isSearchingContent && (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            )}
            
            <FlatList
              data={contentSearchResults}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.searchResults}
              renderItem={({ item }) => {
                const isSelected = isItemSelected(item.id);
                return (
                  <TouchableOpacity 
                    style={[
                      styles.searchResultItem,
                      isSelected && styles.searchResultItemSelected
                    ]}
                    onPress={() => toggleItemSelection(item)}
                  >
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.searchResultImage} />
                    ) : (
                      <View style={styles.searchResultImagePlaceholder}>
                        <Text style={styles.searchResultEmoji}>{getItemEmoji(item.content_type)}</Text>
                      </View>
                    )}
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.searchResultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                      )}
                      {item.description && (
                        <Text style={styles.searchResultDescription} numberOfLines={2}>{item.description}</Text>
                      )}
                    </View>
                    <View style={styles.selectionIndicator}>
                      {isSelected ? (
                        <Check size={20} color="#FFFFFF" />
                      ) : (
                        <Plus size={20} color="#F97316" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => {
                if (!contentSearchQuery.trim()) {
                  return (
                    <View style={styles.searchEmptyState}>
                      <MagnifyingGlass size={48} color="#D1D5DB" />
                      <Text style={styles.searchEmptyText}>
                        Search for {listDetail?.categories?.display_name?.toLowerCase() || listDetail?.category || 'content'} to add to your list
                      </Text>
                    </View>
                  );
                }
                if (!isSearchingContent && contentSearchResults.length === 0) {
                  return (
                    <View style={styles.searchEmptyState}>
                      <Text style={styles.searchEmptyText}>No results found</Text>
                    </View>
                  );
                }
                return null;
              }}
            />
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
  offlineIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  offlineText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  followButtonActive: {
    backgroundColor: '#F97316',
  },
  followButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#F97316',
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  optionsButton: {
    padding: 8,
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
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#6B7280',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  creatorUsername: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  
  listInfo: {
    marginBottom: 16,
  },
  listTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  listDescription: {
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#374151',
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B7280',
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter',
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
    position: 'relative',
  },
  itemContent: {
    flex: 1,
  },
  itemControls: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  dragHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteItemButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemReorderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reorderButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  reorderButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  reorderButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: 'bold',
  },
  reorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  reorderText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#92400E',
  },
  reorderDoneButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reorderDoneText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#FFFFFF',
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
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#1F2937',
    marginRight: 8,
  },
  commentTime: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
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
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  commentInput: {
    flex: 1,
    fontFamily: 'Inter',
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
  
  // Comment Actions and Reply Styles
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  replyButton: {
    paddingVertical: 4,
  },
  replyButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteCommentButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  deleteReplyButton: {
    marginLeft: 'auto',
    padding: 2,
  },
  
  // Reply Container Styles
  replyInputContainer: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  replyInput: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelReplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelReplyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sendReplyButton: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendReplyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendReplyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Replies Container Styles
  repliesContainer: {
    marginLeft: 40,
    marginTop: 8,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyUsername: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginRight: 8,
  },
  replyTime: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
  },
  replyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  
  // Options Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#374151',
  },
  optionTextDanger: {
    color: '#EF4444',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  
  // Edit Modal Styles
  editModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editCancelButton: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
  },
  editTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1F2937',
  },
  editSaveButton: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#F97316',
  },
  editSaveButtonDisabled: {
    color: '#D1D5DB',
  },
  editContent: {
    flex: 1,
    padding: 20,
  },
  editField: {
    marginBottom: 24,
  },
  editLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  editInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  editTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Delete Modal Styles
  deleteModal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  deleteTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 12,
  },
  deleteMessage: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  deleteCancelText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // QR Code Modal Styles
  qrModal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    maxWidth: 400,
    alignSelf: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  qrTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1F2937',
  },
  qrContent: {
    padding: 20,
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  qrUrl: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  qrShareText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Add Content Section Styles
  addContentSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addContentText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#F97316',
    fontWeight: '500',
  },
  
  // Add Content Modal Styles
  addContentModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  addContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  addContentCancelButton: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
  },
  addContentTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  addContentSpacer: {
    width: 60,
  },
  finishButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addContentBody: {
    flex: 1,
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
  },
  youtubeInputLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchLoadingText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  searchResultItemSelected: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#F59E0B',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  searchResultImagePlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultEmoji: {
    fontSize: 24,
  },
  searchResultContent: {
    flex: 1,
    gap: 4,
  },
  searchResultTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  searchResultSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  searchResultDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  searchEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  searchEmptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
});