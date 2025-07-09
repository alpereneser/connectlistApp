import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import {
  Heart,
  ChatCircle,
  UserPlus,
  List,
  Bell,
  Clock,
  Check,
  X,
} from 'phosphor-react-native';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'list_update' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  actor_id?: string;
  actor_name?: string;
  actor_avatar?: string;
  target_id?: string;
  target_type?: 'list' | 'user' | 'comment';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log('Real-time notification update:', payload);
            
            if (payload.eventType === 'INSERT') {
              // Add new notification to the top of the list
              const newNotification: Notification = {
                id: payload.new.id,
                type: payload.new.type,
                title: payload.new.title,
                message: payload.new.message || payload.new.body,
                read: payload.new.read || payload.new.is_read || false,
                created_at: payload.new.created_at,
                actor_id: payload.new.sender_id,
                actor_name: null, // Will be fetched separately
                actor_avatar: null,
                target_id: payload.new.target_id,
                target_type: payload.new.target_type,
              };
              
              setNotifications(prev => [newNotification, ...prev]);
              
              // Fetch sender details if available
              if (payload.new.sender_id) {
                fetchSenderDetails(payload.new.sender_id, payload.new.id);
              }
            } else if (payload.eventType === 'UPDATE') {
              // Update existing notification
              setNotifications(prev =>
                prev.map(notification =>
                  notification.id === payload.new.id
                    ? {
                        ...notification,
                        read: payload.new.read || payload.new.is_read || false,
                        title: payload.new.title,
                        message: payload.new.message || payload.new.body,
                      }
                    : notification
                )
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted notification
              setNotifications(prev =>
                prev.filter(notification => notification.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const fetchSenderDetails = async (senderId: string, notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', senderId)
        .single();

      if (!error && data) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? {
                  ...notification,
                  actor_name: data.full_name || data.username,
                  actor_avatar: data.avatar_url,
                }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error fetching sender details:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      Alert.alert('Error', 'Please login to view notifications');
      router.push('/auth/login');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Fetch notifications from Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:users_profiles!notifications_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to mock data
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'like',
            title: 'New like on your list',
            message: 'Sarah liked your "Best Restaurants in Istanbul" list',
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            actor_name: 'Sarah Johnson',
            actor_avatar: null,
            target_type: 'list',
          },
          {
            id: '2',
            type: 'system',
            title: 'Welcome to ConnectList!',
            message: 'Start creating your first list and connect with others',
            read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            target_type: null,
          },
        ];
        setNotifications(mockNotifications);
      } else {
        // Convert Supabase data to our format
        const notifications: Notification[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message || item.body,
          read: item.read || item.is_read,
          created_at: item.created_at,
          actor_id: item.sender_id,
          actor_name: item.sender?.full_name || item.sender?.username || null,
          actor_avatar: item.sender?.avatar_url || null,
          target_id: item.target_id,
          target_type: item.target_type,
        }));
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
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
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error updating notification:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Update all notifications in Supabase
      if (currentUser) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true, is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (error) {
          console.error('Error updating notifications:', error);
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'list_update':
        if (notification.target_id) {
          router.push(`/list/${notification.target_id}`);
        }
        break;
      case 'follow':
        if (notification.actor_id) {
          router.push(`/profile/${notification.actor_id}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#EF4444" weight="fill" />;
      case 'comment':
        return <ChatCircle size={20} color="#3B82F6" weight="fill" />;
      case 'follow':
        return <UserPlus size={20} color="#10B981" weight="fill" />;
      case 'list_update':
        return <List size={20} color="#F59E0B" weight="fill" />;
      case 'system':
        return <Bell size={20} color="#6B7280" weight="fill" />;
      default:
        return <Bell size={20} color="#6B7280" weight="fill" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    filter === 'all' ? true : !notification.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Notifications" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
        <BottomMenu activeTab="notifications" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Notifications" />
      
      <View style={styles.content}>
        {/* Header with filters and actions */}
        <View style={styles.header}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Check size={16} color="#F97316" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications list */}
        <ScrollView
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#F97316"
              colors={['#F97316']}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={64} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Text>
              <Text style={styles.emptyMessage}>
                {filter === 'unread'
                  ? 'All caught up! Check back later for new notifications.'
                  : 'Start creating lists and connecting with others to get notifications here.'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.created_at)}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  
                  {notification.actor_name && (
                    <View style={styles.actorContainer}>
                      <View style={styles.actorAvatar}>
                        <Text style={styles.actorInitial}>
                          {notification.actor_name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.actorName}>@{notification.actor_name.toLowerCase().replace(' ', '')}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      
      <BottomMenu activeTab="notifications" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#F97316',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#F97316',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#FEF3F2',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  actorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actorInitial: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  actorName: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});