import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert, Linking, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { List, Heart, MapTrifold, FilmStrip, Book, Television, GameController, UserCircle, Globe } from 'phosphor-react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onTabPress?: (tab: string) => void;
}

export default function ProfileScreen({ onTabPress }: ProfileScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Lists');
  const [userLists, setUserLists] = useState<any[]>([]);
  const [listItems, setListItems] = useState<Record<string, any[]>>({});
  const router = useRouter();



  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Authentication Error', 'Please login again.');
        return;
      }
      
      if (authUser) {
        // Fetch from users_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          // If profile doesn't exist, that's okay, we'll use auth metadata
        }

        if (profileData) {
          setUser({
            id: profileData.id,
            email: authUser.email,
            full_name: profileData.full_name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            website: profileData.website || '',
            avatar_url: profileData.avatar_url || '',
            followers_count: profileData.followers_count || 0,
            following_count: profileData.following_count || 0,
            location: profileData.location || '',
            created_at: profileData.created_at
          });
          
          // Fetch user's lists
          const { data: listsData, error: listsError } = await supabase
            .from('lists')
            .select('*')
            .eq('creator_id', authUser.id)
            .order('created_at', { ascending: false });
            
          if (listsError) {
            console.error('Error fetching user lists:', listsError);
            Alert.alert('Error', 'Failed to load your lists.');
            return;
          }
            
          if (listsData && listsData.length > 0) {
            // Fetch categories data separately  
            const categoryNames = [...new Set(listsData.map(list => list.category).filter(Boolean))];
            const { data: categoriesData } = await supabase
              .from('categories')
              .select('name, display_name')
              .in('name', categoryNames);

            // Create lookup map
            const categoriesMap = categoriesData?.reduce((acc, cat) => ({ ...acc, [cat.name]: cat }), {}) || {};

            // Combine data
            const enrichedLists = listsData.map(list => ({
              ...list,
              categories: categoriesMap[list.category] || null
            }));

            setUserLists(enrichedLists);
            
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
            setUserLists([]);
            setListItems({});
          }
        } else {
          // Fallback to auth metadata if profile doesn't exist
          setUser({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
            username: authUser.user_metadata?.username || '',
            bio: '',
            website: '',
            avatar_url: '',
            followers_count: 0,
            following_count: 0,
            location: '',
            created_at: authUser.created_at
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                router.replace('/auth/login');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while signing out.');
            }
          },
        },
      ]
    );
  }, [router]);

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
      // Already on profile page, do nothing
    }
  }, [router]);

  const handleShareProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Create profile URL (you can replace this with your actual domain)
      const profileUrl = `https://connectlist.app/profile/${user.username}`;
      
      // Create share message for social media
      let shareMessage = `🌟 Check out my ConnectList profile!\n\n`;
      shareMessage += `👤 ${user.full_name || user.username}\n`;
      
      if (user.bio) {
        shareMessage += `📝 ${user.bio}\n`;
      }
      
      shareMessage += `\n📊 Stats:\n`;
      shareMessage += `• ${user.followers_count || 0} followers\n`;
      shareMessage += `• ${user.following_count || 0} following\n`;
      shareMessage += `• ${userLists.length} lists created\n`;
      
      if (user.location) {
        shareMessage += `\n📍 ${user.location}`;
      }
      
      if (user.website) {
        shareMessage += `\n🌐 ${user.website}`;
      }
      
      shareMessage += `\n\n🔗 View profile: ${profileUrl}`;
      shareMessage += `\n\n#ConnectList #ShareYourLists`;

      // Create WhatsApp specific message
      const whatsappMessage = encodeURIComponent(shareMessage);
      const whatsappUrl = `whatsapp://send?text=${whatsappMessage}`;

      if (Platform.OS === 'web') {
        // Web share
        if (navigator.share) {
          await navigator.share({
            title: `${user.full_name || user.username} on ConnectList`,
            text: shareMessage,
            url: profileUrl
          });
        } else {
          // Show share options
          Alert.alert(
            'Share Profile',
            'Choose how to share your profile',
            [
              {
                text: 'Copy Link',
                onPress: async () => {
                  await navigator.clipboard.writeText(shareMessage);
                  Alert.alert('Success', 'Profile copied to clipboard!');
                }
              },
              {
                text: 'WhatsApp Web',
                onPress: () => {
                  window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
                }
              },
              {
                text: 'Twitter',
                onPress: () => {
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
                  window.open(twitterUrl, '_blank');
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      } else {
        // Mobile share with platform-specific options
        const shareOptions = Platform.OS === 'ios' 
          ? {
              message: shareMessage,
              url: profileUrl,
              title: `${user.full_name || user.username} on ConnectList`,
            }
          : {
              message: shareMessage,
              title: `${user.full_name || user.username} on ConnectList`,
            };

        const result = await Share.share(shareOptions);

        if (result.action === Share.sharedAction) {
          // Track share event
          console.log('Profile shared successfully');
          
          // Optional: Track which app was used for sharing (iOS only)
          if (result.activityType) {
            console.log('Shared with activity type:', result.activityType);
            
            // If WhatsApp was selected, we can also open WhatsApp directly
            if (result.activityType.includes('WhatsApp')) {
              Linking.openURL(whatsappUrl).catch(err => console.error('WhatsApp error:', err));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  }, [user, userLists]);

  const categories = [
    { name: 'All Lists', icon: List, color: '#6B7280' },
    { name: 'Liked Lists', icon: Heart, color: '#EF4444' },
    { name: 'Place Lists', icon: MapTrifold, color: '#10B981' },
    { name: 'Movie Lists', icon: FilmStrip, color: '#8B5CF6' },
    { name: 'TV Show Lists', icon: Television, color: '#F59E0B' },
    { name: 'Book Lists', icon: Book, color: '#3B82F6' },
    { name: 'Game Lists', icon: GameController, color: '#EF4444' },
    { name: 'Person Lists', icon: UserCircle, color: '#6B7280' },
  ];

  // Filter lists based on active category
  const filteredLists = React.useMemo(() => {
    if (activeCategory === 'All Lists') {
      return userLists;
    }
    if (activeCategory === 'Liked Lists') {
      // TODO: Implement liked lists filtering
      return [];
    }
    // Filter by category
    const categoryMap: Record<string, string> = {
      'Place Lists': 'places',
      'Movie Lists': 'movies',
      'TV Show Lists': 'tv_shows',
      'Book Lists': 'books',
      'Game Lists': 'games',
      'Person Lists': 'persons',
    };
    const categoryFilter = categoryMap[activeCategory];
    return userLists.filter(list => list.category === categoryFilter);
  }, [userLists, activeCategory]);

  // Helper function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movies':
        return <FilmStrip size={12} color="#666" />;
      case 'tv_shows':
        return <Television size={12} color="#666" />;
      case 'books':
        return <Book size={12} color="#666" />;
      case 'games':
        return <GameController size={12} color="#666" />;
      case 'places':
        return <MapTrifold size={12} color="#666" />;
      case 'persons':
        return <UserCircle size={12} color="#666" />;
      default:
        return <List size={12} color="#666" />;
    }
  };

  // Helper function to get item emoji based on content type
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

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Profile" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="profile" onTabPress={(tab) => {
        if (tab === 'settings') {
          router.push('/settings');
        } else if (tab === 'discover') {
          router.push('/discover');
        } else if (tab === 'create') {
          router.push('/create');
        } else if (tab === 'search') {
          router.push('/search');
        }
      }} />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <AppBar title="Profile" />
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileContent}>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.full_name || user?.username || 'Loading...'}</Text>
                <View style={styles.usernameContainer}>
                  <Text style={styles.usernameText}>@{user?.username || 'loading'}</Text>
                </View>
                {user?.bio && (
                  <Text style={styles.bio}>{user.bio}</Text>
                )}
                <View style={styles.profileDetailsRow}>
                  {user?.location && (
                    <View style={styles.detailItem}>
                      <MapTrifold size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{user.location}</Text>
                    </View>
                  )}
                  {user?.website && (
                    <TouchableOpacity style={styles.detailItem} onPress={() => {
                      if (user.website) {
                        const url = user.website.startsWith('http') ? user.website : `https://${user.website}`;
                        Linking.openURL(url);
                      }
                    }}>
                      <Globe size={16} color="#6B7280" />
                      <Text style={[styles.detailText, styles.linkText]}>
                        {user.website.replace(/^https?:\/\//, '')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.followersContainer}>
                  <View style={styles.followersAvatars}>
                    <View style={[styles.followerAvatar, styles.followerAvatar1]} />
                    <View style={[styles.followerAvatar, styles.followerAvatar2]} />
                  </View>
                  <Text style={styles.followersText}>
                    {user?.followers_count || 0} followers • {user?.following_count || 0} following
                  </Text>
                </View>
              </View>
              <View style={styles.avatarContainer}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 
                       user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => router.push('/settings')}>
              <Text style={styles.editButtonText}>Edit profile</Text>
            </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
                <Text style={styles.shareButtonText}>Share profile</Text>
              </TouchableOpacity>
            </View>
          </View>



          {/* Category Tabs */}
          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryTab,
                    activeCategory === category.name && styles.activeCategoryTab
                  ]}
                  onPress={() => setActiveCategory(category.name)}
                >
                  <category.icon size={20} color={activeCategory === category.name ? '#F97316' : '#9CA3AF'} />
                  <Text style={[
                    styles.categoryText,
                    activeCategory === category.name && styles.activeCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* User's Lists with Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{activeCategory}</Text>
            {filteredLists.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No lists found</Text>
                <Text style={styles.emptyStateSubtext}>Create your first list to get started!</Text>
              </View>
            ) : (
              filteredLists.map((list) => (
                <View key={list.id} style={styles.listPreviewContainer}>
                  <TouchableOpacity 
                    style={styles.listHeader}
                    onPress={() => router.push(`/list/${list.id}`)}
                  >
                    <View style={styles.listHeaderLeft}>
                      {user?.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.listAuthorAvatar} />
                      ) : (
                        <View style={styles.listAuthorAvatar}>
                          <Text style={styles.listAuthorInitial}>
                            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.listInfo}>
                        <View style={styles.listTitleRow}>
                          <Text style={styles.listAuthorName}>{user?.full_name || user?.username}</Text>
                          <Text style={styles.listAction}>created</Text>
                          <Text style={styles.listTitle}>{list.title}</Text>
                        </View>
                        <View style={styles.listMeta}>
                          <Text style={styles.listUsername}>@{user?.username}</Text>
                          <Text style={styles.separator}>•</Text>
                          <View style={styles.categoryTag}>
                            {getCategoryIcon(list.categories?.name || list.category)}
                            <Text style={styles.listCategory}>
                              {list.categories?.display_name || list.category || 'General'}
                            </Text>
                          </View>
                          <Text style={styles.separator}>•</Text>
                          <Text style={styles.listItemCount}>{list.item_count || 0} items</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  {list.description && (
                    <Text style={styles.listDescriptionText}>{list.description}</Text>
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
                        {listItems[list.id].map((item, index) => (
                          <TouchableOpacity 
                            key={item.id} 
                            style={styles.listItemCard}
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
                    <TouchableOpacity style={styles.statButton}>
                      <Heart size={16} color="#6B7280" />
                      <Text style={styles.statText}>{list.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{list.comments_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statButton}>
                      <Ionicons name="share-outline" size={16} color="#6B7280" />
                      <Text style={styles.statText}>{list.shares_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>



          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>ConnectList v1.0.0</Text>
            <Text style={styles.appInfoText}>Made with ❤️ for connecting people</Text>
          </View>
        </ScrollView>
      </View>
      <BottomMenu activeTab="profile" onTabPress={handleTabPress} />
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
  profileHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  profileContent: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  userName: {
    ...fontConfig.medium,
    fontSize: 24,
    color: '#000000',
    lineHeight: 22,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameText: {
    ...fontConfig.medium,
    fontSize: 16,
    color: '#000000',
    lineHeight: 19,
  },
  threadsContainer: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  threadsText: {
    ...fontConfig.regular,
    fontSize: 10,
    color: '#A0A0A0',
    lineHeight: 12,
  },
  avatarContainer: {
    width: 74,
    height: 72,
  },
  avatar: {
    width: 74,
    height: 72,
    borderRadius: 37,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...fontConfig.semibold,
    fontSize: 24,
    color: '#6B7280',
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinDateText: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  bio: {
    ...fontConfig.light,
    fontSize: 16,
    color: '#000000',
    lineHeight: 19,
    marginBottom: 8,
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    color: '#007AFF',
  },
  followersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followersAvatars: {
    flexDirection: 'row',
    width: 28,
    height: 18.67,
  },
  followerAvatar: {
    width: 18.67,
    height: 18.67,
    borderRadius: 9.335,
    borderWidth: 1.17,
    borderColor: '#FFFFFF',
  },
  followerAvatar1: {
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    left: 0,
  },
  followerAvatar2: {
    backgroundColor: '#D1D5DB',
    position: 'absolute',
    left: 9.33,
  },
  followersText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#B8B8B8',
    lineHeight: 19,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 47,
    paddingVertical: 8,
  },
  editButtonText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#000000',
    lineHeight: 19,
    textAlign: 'center',
  },
  shareButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 36,
    paddingVertical: 8,
  },
  shareButtonText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#000000',
    lineHeight: 19,
    textAlign: 'center',
  },

  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    ...fontConfig.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },

  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  appInfoText: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  loadingText: {
    ...fontConfig.regular,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  categoryScrollView: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeCategoryTab: {
    borderBottomColor: '#F97316',
  },
  categoryText: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#6B7280',
  },
  activeCategoryText: {
    color: '#F97316',
  },
  // List Preview Styles
  listPreviewContainer: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listHeader: {
    marginBottom: 12,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listAuthorInitial: {
    ...fontConfig.medium,
    fontSize: 16,
    color: '#6B7280',
  },
  listInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  listAuthorName: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#000000',
  },
  listAction: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  listTitle: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#F97316',
  },
  listMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  listUsername: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  separator: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listCategory: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  listItemCount: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  listDescriptionText: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  itemsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  listItemsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  listItemCard: {
    width: 100,
    alignItems: 'center',
  },
  itemImage: {
    width: 100,
    height: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemTitle: {
    ...fontConfig.medium,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  itemSubtitle: {
    ...fontConfig.regular,
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  noItemsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noItemsText: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#9CA3AF',
  },
  listStatsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listCoverImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
});