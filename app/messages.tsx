import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  MagnifyingGlass,
  ChatCircle,
  User,
  Clock,
  Check,
  CheckCheck,
  Plus,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_username: string;
  participant_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_sender: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'people'>('conversations');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      
      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel('messages_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id})`,
          },
          (payload) => {
            console.log('Real-time message update:', payload);
            
            // Refresh conversations when there's a new message
            if (payload.eventType === 'INSERT') {
              fetchConversations();
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for conversations table if it exists
      const conversationsChannel = supabase
        .channel('conversations_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `or(user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id})`,
          },
          (payload) => {
            console.log('Real-time conversation update:', payload);
            
            // Refresh conversations list
            fetchConversations();
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      Alert.alert('Error', 'Please login to view messages');
      router.push('/auth/login');
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Call the Supabase function to get conversations
      const { data, error } = await supabase.rpc('get_user_conversations', {
        user_uuid: currentUser.id
      });

      if (error) {
        console.error('Error fetching conversations:', error);
        // Show empty state instead of mock data
        setConversations([]);
      } else {
        // Convert Supabase data to our format
        const conversations: Conversation[] = data.map((item: any) => ({
          id: item.conversation_id,
          participant_id: item.participant_id,
          participant_name: item.participant_name,
          participant_username: item.participant_username,
          participant_avatar: item.participant_avatar,
          last_message: item.last_message || '',
          last_message_time: item.last_message_time || new Date().toISOString(),
          unread_count: item.unread_count || 0,
          is_sender: item.last_sender_id === currentUser.id,
        }));
        setConversations(conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
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

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to chat screen with conversation ID
    router.push(`/chat/${conversation.id}?participantId=${conversation.participant_id}&participantName=${encodeURIComponent(conversation.participant_name)}`);
  };

  const handleNewMessage = () => {
    // Navigate to new message screen or show user selection modal
    setActiveTab('people');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) return 'yesterday';
      return `${days}d`;
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participant_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const renderConversations = () => (
    <ScrollView
      style={styles.conversationsList}
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
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ChatCircle size={64} color="#E5E7EB" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </Text>
          <Text style={styles.emptyMessage}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start a conversation by messaging someone from your network.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.startChatButton} onPress={handleNewMessage}>
              <PaperPlaneTilt size={20} color="#FFFFFF" weight="fill" />
              <Text style={styles.startChatText}>Start a conversation</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredConversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={[
              styles.conversationItem,
              conversation.unread_count > 0 && styles.conversationItemUnread,
            ]}
            onPress={() => handleConversationPress(conversation)}
          >
            <View style={styles.avatarContainer}>
              {conversation.participant_avatar ? (
                <Image source={{ uri: conversation.participant_avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {conversation.participant_name.charAt(0)}
                  </Text>
                </View>
              )}
              {conversation.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <View style={styles.nameContainer}>
                  <Text style={styles.participantName}>{conversation.participant_name}</Text>
                  <Text style={styles.participantUsername}>@{conversation.participant_username}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.lastMessageTime}>
                    {formatTimeAgo(conversation.last_message_time)}
                  </Text>
                  {conversation.is_sender && (
                    <View style={styles.messageStatus}>
                      <CheckCheck size={16} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.lastMessage,
                  conversation.unread_count > 0 && styles.lastMessageUnread,
                ]}
                numberOfLines={2}
              >
                {conversation.last_message}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderPeople = () => {
    // Real people data from Supabase
    const [people, setPeople] = useState<any[]>([]);
    const [peopleLoading, setPeopleLoading] = useState(true);

    useEffect(() => {
      fetchPeople();
    }, []);

    const fetchPeople = async () => {
      try {
        setPeopleLoading(true);
        const { data, error } = await supabase
          .from('users_profiles')
          .select('id, full_name, username, avatar_url, followers_count')
          .neq('id', currentUser?.id)
          .limit(50);

        if (error) {
          console.error('Error fetching people:', error);
          setPeople([]);
        } else {
          setPeople(data || []);
        }
      } catch (error) {
        console.error('Error fetching people:', error);
        setPeople([]);
      } finally {
        setPeopleLoading(false);
      }
    };

    const filteredPeople = people.filter(person =>
      person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (peopleLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading people...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.peopleList} showsVerticalScrollIndicator={false}>
        {filteredPeople.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No people found' : 'No users available'}
            </Text>
            <Text style={styles.emptyMessage}>
              {searchQuery ? 'Try a different search term' : 'Check back later for more users'}
            </Text>
          </View>
        ) : (
          filteredPeople.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={styles.personItem}
              onPress={() => router.push(`/chat/new?participantId=${person.id}&participantName=${encodeURIComponent(person.full_name || person.username)}`)}
            >
              <View style={styles.avatarContainer}>
                {person.avatar_url ? (
                  <Image source={{ uri: person.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(person.full_name || person.username)?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.personContent}>
                <Text style={styles.personName}>
                  {person.full_name || person.username}
                </Text>
                <Text style={styles.personUsername}>@{person.username}</Text>
                <Text style={styles.mutualConnections}>
                  {person.followers_count || 0} followers
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => router.push(`/chat/new?participantId=${person.id}&participantName=${encodeURIComponent(person.full_name || person.username)}`)}
              >
                <ChatCircle size={20} color="#F97316" weight="fill" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Messages" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
        <BottomMenu activeTab="messages" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar 
        title="Messages" 
        rightAction={{
          icon: <Plus size={24} color="#F97316" />,
          onPress: handleNewMessage,
        }}
      />
      
      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'conversations' && styles.tabActive]}
            onPress={() => setActiveTab('conversations')}
          >
            <ChatCircle size={20} color={activeTab === 'conversations' ? '#F97316' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'conversations' && styles.tabTextActive]}>
              Conversations
            </Text>
            {totalUnreadCount > 0 && activeTab === 'conversations' && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'people' && styles.tabActive]}
            onPress={() => setActiveTab('people')}
          >
            <User size={20} color={activeTab === 'people' ? '#F97316' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
              People
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MagnifyingGlass size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search people...'}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Content */}
        {activeTab === 'conversations' ? renderConversations() : renderPeople()}
      </View>
      
      <BottomMenu activeTab="messages" onTabPress={handleTabPress} />
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#FEF3F2',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#F97316',
  },
  tabBadge: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  conversationItemUnread: {
    backgroundColor: '#FEF3F2',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  participantUsername: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastMessageTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  messageStatus: {
    marginLeft: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '500',
    color: '#1F2937',
  },
  peopleList: {
    flex: 1,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  personContent: {
    flex: 1,
    marginRight: 12,
  },
  personName: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  personUsername: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  mutualConnections: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  messageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF3F2',
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
    marginBottom: 24,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  startChatText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});