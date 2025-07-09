import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  PaperPlaneTilt,
  DotsThreeVertical,
  Phone,
  VideoCamera,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  Plus,
} from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_status: any;
  message_type: string;
  reply_to_id?: string;
  is_edited?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

interface ChatMessage extends Message {
  isSender: boolean;
  isRead: boolean;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, participantId, participantName } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    initializeChat();
    
    // Update user presence to online
    supabase.rpc('update_user_presence', { is_online_status: true });
    
    // Set up presence ping interval
    const presenceInterval = setInterval(() => {
      supabase.rpc('update_user_presence', { is_online_status: true });
    }, 60000); // Ping every minute
    
    return () => {
      clearInterval(presenceInterval);
      // Mark as offline when leaving
      supabase.rpc('update_user_presence', { is_online_status: false });
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Set up real-time subscription
      const subscription = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            if (newMessage.sender_id !== currentUser?.id) {
              const chatMessage: ChatMessage = {
                ...newMessage,
                isSender: false,
                isRead: false,
                timestamp: formatTimestamp(newMessage.created_at),
                status: 'delivered',
              };
              setMessages(prev => [...prev, chatMessage]);
              // Auto-scroll to bottom
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const indicator = payload.new as any;
            if (indicator.user_id !== currentUser?.id) {
              setIsTyping(true);
              // Auto hide after 10 seconds
              setTimeout(() => setIsTyping(false), 10000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const indicator = payload.old as any;
            if (indicator.user_id !== currentUser?.id) {
              setIsTyping(false);
            }
          }
        )
        .subscribe();

      // Subscribe to participant presence changes
      const presenceSubscription = supabase
        .channel(`presence:${participantId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
            filter: `user_id=eq.${participantId}`,
          },
          (payload) => {
            if (payload.new) {
              const presence = payload.new as any;
              setIsOnline(presence.is_online);
              if (!presence.is_online) {
                setLastSeen(formatTimestamp(presence.last_ping));
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        presenceSubscription.unsubscribe();
        // Clean up typing indicator when leaving
        if (conversationId && currentUser) {
          supabase.rpc('set_typing_status', {
            conv_id: conversationId,
            is_typing: false
          });
        }
      };
    }
  }, [conversationId, currentUser]);

  const initializeChat = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Get participant info
      if (participantId) {
        const { data: participantData, error: participantError } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', participantId)
          .single();

        if (participantError) throw participantError;
        setParticipant(participantData);
        
        // Get participant online status
        const { data: statusData } = await supabase.rpc('get_user_status', {
          user_uuid: participantId
        });
        
        if (statusData && statusData.length > 0) {
          setIsOnline(statusData[0].is_online);
          if (!statusData[0].is_online && statusData[0].last_seen) {
            setLastSeen(formatTimestamp(statusData[0].last_seen));
          }
        }
      }

      // Get or create conversation
      if (id === 'new' && participantId && user) {
        // Create new conversation
        const { data: convId, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user.id,
            user2_id: participantId,
          });

        if (convError) throw convError;
        setConversationId(convId);
      } else if (id !== 'new') {
        setConversationId(id as string);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId || !currentUser) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chatMessages: ChatMessage[] = data.map((msg) => ({
        ...msg,
        isSender: msg.sender_id === currentUser.id,
        isRead: msg.read_status?.[currentUser.id] === true,
        timestamp: formatTimestamp(msg.created_at),
        status: msg.sender_id === currentUser.id
          ? (msg.read_status && Object.keys(msg.read_status).length > 1 ? 'read' : 'delivered')
          : 'delivered',
      }));

      setMessages(chatMessages);

      // Mark messages as read
      if (chatMessages.length > 0) {
        await supabase.rpc('mark_messages_as_read', {
          conv_id: conversationId,
          user_uuid: currentUser.id,
        });
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !conversationId || !currentUser || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    await supabase.rpc('set_typing_status', {
      conv_id: conversationId,
      is_typing: false
    });

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      content: messageText,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      read_status: {},
      message_type: 'text',
      isSender: true,
      isRead: false,
      timestamp: 'Sending...',
      status: 'sending',
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: messageText,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? {
                ...data,
                isSender: true,
                isRead: false,
                timestamp: formatTimestamp(data.created_at),
                status: 'sent',
              }
            : msg
        )
      );

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_message', {
                message_id: messageId,
              });

              if (error) throw error;

              // Update local state to show deleted message
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === messageId
                    ? { ...msg, content: '[Message deleted]', deleted_at: new Date().toISOString() }
                    : msg
                )
              );
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isLastMessage = messages[messages.length - 1]?.id === item.id;
    const showTimestamp = item.isSender && isLastMessage;

    return (
      <View style={[styles.messageContainer, item.isSender && styles.senderMessageContainer]}>
        <TouchableOpacity
          style={[
            styles.messageBubble,
            item.isSender ? styles.senderBubble : styles.receiverBubble,
          ]}
          onLongPress={() => {
            if (item.isSender && !item.deleted_at) {
              handleDeleteMessage(item.id);
            }
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.messageText,
              item.isSender ? styles.senderText : styles.receiverText,
              item.deleted_at && styles.deletedMessageText,
            ]}
          >
            {item.content}
          </Text>
        </TouchableOpacity>
        
        {showTimestamp && (
          <View style={styles.messageInfo}>
            <Text style={styles.messageTime}>{item.timestamp}</Text>
            <View style={styles.messageStatus}>
              {item.status === 'sending' && <Clock size={12} color="#9CA3AF" />}
              {item.status === 'sent' && <Check size={12} color="#9CA3AF" />}
              {item.status === 'delivered' && <CheckCheck size={12} color="#9CA3AF" />}
              {item.status === 'read' && <CheckCheck size={12} color="#3B82F6" />}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.participantInfo}>
          <View style={styles.participantAvatar}>
            {participant?.avatar_url ? (
              <Image source={{ uri: participant.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitial}>
                {participant?.full_name?.charAt(0) || participant?.username?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
          
          <View style={styles.participantDetails}>
            <Text style={styles.participantName}>
              {participant?.full_name || participant?.username || participantName || 'Unknown'}
            </Text>
            <Text style={styles.participantStatus}>
              {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton}>
          <VideoCamera size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Phone size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <DotsThreeVertical size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInputArea = () => (
    <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={styles.attachButton}>
        <Plus size={24} color="#9CA3AF" />
      </TouchableOpacity>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            // Handle typing indicator
            if (conversationId && currentUser) {
              // Clear previous timeout
              if (typingTimeout) {
                clearTimeout(typingTimeout);
              }
              // Set typing status to true
              supabase.rpc('set_typing_status', {
                conv_id: conversationId,
                is_typing: true
              });
              // Set timeout to remove typing indicator after 3 seconds of inactivity
              const timeout = setTimeout(() => {
                supabase.rpc('set_typing_status', {
                  conv_id: conversationId,
                  is_typing: false
                });
              }, 3000);
              setTypingTimeout(timeout);
            }
          }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.imageButton}>
          <ImageIcon size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
        onPress={sendMessage}
        disabled={!inputText.trim() || sending}
      >
        <PaperPlaneTilt 
          size={20} 
          color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"} 
          weight="fill" 
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{participant?.full_name || participant?.username || 'User'} is typing...</Text>
        </View>
      )}

      {renderInputArea()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  participantStatus: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  senderMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  senderBubble: {
    backgroundColor: '#F97316',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  senderText: {
    color: '#FFFFFF',
  },
  receiverText: {
    color: '#1F2937',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#9CA3AF',
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    maxHeight: 80,
  },
  imageButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#F97316',
  },
  deletedMessageText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
});