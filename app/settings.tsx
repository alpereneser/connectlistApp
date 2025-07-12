import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import {
  User,
  Lock,
  Bell,
  Question,
  CaretRight,
  Users,
  Globe,
  Heart,
  Camera,
  X,
  Check,
  EnvelopeSimple,
  Phone,
  MapPin,
  Calendar,
  GenderIntersex,
  Link,
} from 'phosphor-react-native';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  
  // Profile data
  const [userProfile, setUserProfile] = useState({
    id: '',
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    location: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    is_private: false,
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    show_location: true,
    show_birth_date: false,
    allow_search_by_email: true,
    allow_search_by_phone: false,
    show_online_status: true,
    allow_friend_requests: true,
    allow_list_comments: true,
    allow_list_likes: true,
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    list_likes: true,
    list_comments: true,
    new_followers: true,
    list_shares: true,
    weekly_digest: true,
    product_updates: false,
    tips_and_tutorials: true,
  });

  useEffect(() => {
    fetchUserProfile();
    fetchPrivacySettings();
    fetchNotificationSettings();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserProfile({
            id: data.id,
            username: data.username || '',
            full_name: data.full_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
            website: data.website || '',
            location: data.location || '',
            phone_number: data.phone_number || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            is_private: data.is_private || false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);
  
  const fetchPrivacySettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_privacy_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setPrivacySettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  }, []);
  
  const fetchNotificationSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setNotificationSettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, []);

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
              await supabase.auth.signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  }, [router]);

  const handleEditProfile = useCallback(() => {
    setShowEditProfile(true);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({
          full_name: userProfile.full_name,
          bio: userProfile.bio,
          website: userProfile.website,
          location: userProfile.location,
          phone_number: userProfile.phone_number,
          date_of_birth: userProfile.date_of_birth,
          gender: userProfile.gender,
          is_private: userProfile.is_private,
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfile(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  const handleImageUpload = useCallback(async (file) => {
    setUploadingAvatar(true);
    try {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        Alert.alert('Error', 'Image size must be less than 2MB');
        return;
      }

      // Get file extension
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Convert file to ArrayBuffer for Supabase upload
      const arrayBuffer = await file.arrayBuffer();

      // Retry mechanism for upload
      let uploadSuccess = false;
      let uploadData = null;
      let uploadError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
            upsert: true
          });
        
        if (!error) {
          uploadData = data;
          uploadSuccess = true;
          break;
        }
        
        uploadError = error;
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }

      if (!uploadSuccess) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      setUserProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [userProfile.id]);

  const handleAvatarUpload = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web platform: Use HTML file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          await handleImageUpload(file);
        }
      };
      input.click();
      return;
    }

    // Mobile platforms: Use expo-image-picker
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const photo = result.assets[0];
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        
        // Create a File-like object for mobile
        const file = {
          size: blob.size,
          name: `avatar.${photo.uri.substring(photo.uri.lastIndexOf('.') + 1)}`,
          type: `image/${photo.uri.substring(photo.uri.lastIndexOf('.') + 1)}`,
          arrayBuffer: () => blob.arrayBuffer()
        };
        
        await handleImageUpload(file);
      } catch (error) {
        console.error('Mobile image processing error:', error);
        Alert.alert('Error', 'Failed to process image. Please try again.');
      }
    }
  }, [userProfile.id]);

  const handleSavePrivacySettings = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: userProfile.id,
          ...privacySettings,
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Privacy settings updated');
      setShowPrivacySettings(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  }, [userProfile.id, privacySettings]);

  const handleSaveNotificationSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: userProfile.id,
          ...notificationSettings,
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Notification settings updated');
      setShowNotificationSettings(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  }, [userProfile.id, notificationSettings]);

  const handleMenuPress = useCallback((item: string) => {
    switch (item) {
      case 'Privacy':
        setShowPrivacySettings(true);
        break;
      case 'Notifications':
        setShowNotificationSettings(true);
        break;
      case 'Help':
        router.push('/help');
        break;
      case 'About':
        router.push('/about');
        break;
      default:
        console.log(`${item} pressed`);
    }
  }, [router]);

  const renderSettingsItem = (
    icon: React.ReactNode,
    title: string,
    onPress?: () => void,
    showChevron: boolean = true,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      {rightComponent || (showChevron && (
        <CaretRight size={20} color="#666" />
      ))}
    </TouchableOpacity>
  );

  // Edit Profile Modal
  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditProfile(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Check size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarEditSection}>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : userProfile.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  style={styles.avatarEdit}
                />
              ) : (
                <View style={styles.avatarPlaceholderEdit}>
                  <User size={40} color="#666" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userProfile.username}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={userProfile.full_name}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, full_name: text }))}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={userProfile.bio}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                maxLength={150}
              />
              <Text style={styles.characterCount}>
                {userProfile.bio.length}/150
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <View style={styles.inputWithIcon}>
                <Link size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIconField}
                  value={userProfile.website}
                  onChangeText={(text) => setUserProfile(prev => ({ ...prev, website: text }))}
                  placeholder="https://example.com"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIconField}
                  value={userProfile.location}
                  onChangeText={(text) => setUserProfile(prev => ({ ...prev, location: text }))}
                  placeholder="City, Country"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIconField}
                  value={userProfile.phone_number}
                  onChangeText={(text) => setUserProfile(prev => ({ ...prev, phone_number: text }))}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIconField}
                  value={userProfile.date_of_birth}
                  onChangeText={(text) => setUserProfile(prev => ({ ...prev, date_of_birth: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderOptions}>
                {['male', 'female', 'other', 'prefer_not_to_say'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      userProfile.gender === gender && styles.genderOptionActive
                    ]}
                    onPress={() => setUserProfile(prev => ({ ...prev, gender }))}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      userProfile.gender === gender && styles.genderOptionTextActive
                    ]}>
                      {gender.replace(/_/g, ' ').charAt(0).toUpperCase() + gender.replace(/_/g, ' ').slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Private Account</Text>
              <Switch
                value={userProfile.is_private}
                onValueChange={(value) => setUserProfile(prev => ({ ...prev, is_private: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Privacy Settings Modal
  const renderPrivacySettingsModal = () => (
    <Modal
      visible={showPrivacySettings}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPrivacySettings(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Privacy Settings</Text>
          <TouchableOpacity onPress={handleSavePrivacySettings} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Check size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <View style={styles.radioGroup}>
              {['public', 'private', 'friends_only'].map((visibility) => (
                <TouchableOpacity
                  key={visibility}
                  style={styles.radioOption}
                  onPress={() => setPrivacySettings(prev => ({ ...prev, profile_visibility: visibility }))}
                >
                  <View style={styles.radioCircle}>
                    {privacySettings.profile_visibility === visibility && (
                      <View style={styles.radioCircleActive} />
                    )}
                  </View>
                  <Text style={styles.radioText}>
                    {visibility.replace(/_/g, ' ').charAt(0).toUpperCase() + visibility.replace(/_/g, ' ').slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Information Visibility</Text>
            
            {renderSettingsItem(
              <EnvelopeSimple size={20} color="#333" />,
              'Show Email',
              undefined,
              false,
              <Switch
                value={privacySettings.show_email}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, show_email: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Phone size={20} color="#333" />,
              'Show Phone Number',
              undefined,
              false,
              <Switch
                value={privacySettings.show_phone}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, show_phone: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <MapPin size={20} color="#333" />,
              'Show Location',
              undefined,
              false,
              <Switch
                value={privacySettings.show_location}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, show_location: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Calendar size={20} color="#333" />,
              'Show Birth Date',
              undefined,
              false,
              <Switch
                value={privacySettings.show_birth_date}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, show_birth_date: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Search & Discovery</Text>
            
            {renderSettingsItem(
              <EnvelopeSimple size={20} color="#333" />,
              'Allow Search by Email',
              undefined,
              false,
              <Switch
                value={privacySettings.allow_search_by_email}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_search_by_email: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Phone size={20} color="#333" />,
              'Allow Search by Phone',
              undefined,
              false,
              <Switch
                value={privacySettings.allow_search_by_phone}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_search_by_phone: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Interactions</Text>
            
            {renderSettingsItem(
              <Users size={20} color="#333" />,
              'Allow Friend Requests',
              undefined,
              false,
              <Switch
                value={privacySettings.allow_friend_requests}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_friend_requests: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'Show Online Status',
              undefined,
              false,
              <Switch
                value={privacySettings.show_online_status}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, show_online_status: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Heart size={20} color="#333" />,
              'Allow List Likes',
              undefined,
              false,
              <Switch
                value={privacySettings.allow_list_likes}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_list_likes: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'Allow List Comments',
              undefined,
              false,
              <Switch
                value={privacySettings.allow_list_comments}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, allow_list_comments: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Notification Settings Modal
  const renderNotificationSettingsModal = () => (
    <Modal
      visible={showNotificationSettings}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNotificationSettings(false)}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notification Settings</Text>
          <TouchableOpacity onPress={handleSaveNotificationSettings} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Check size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Notification Methods</Text>
            
            {renderSettingsItem(
              <EnvelopeSimple size={20} color="#333" />,
              'Email Notifications',
              undefined,
              false,
              <Switch
                value={notificationSettings.email_notifications}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, email_notifications: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'Push Notifications',
              undefined,
              false,
              <Switch
                value={notificationSettings.push_notifications}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, push_notifications: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Phone size={20} color="#333" />,
              'SMS Notifications',
              undefined,
              false,
              <Switch
                value={notificationSettings.sms_notifications}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, sms_notifications: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Activity Notifications</Text>
            
            {renderSettingsItem(
              <Heart size={20} color="#333" />,
              'List Likes',
              undefined,
              false,
              <Switch
                value={notificationSettings.list_likes}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, list_likes: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'List Comments',
              undefined,
              false,
              <Switch
                value={notificationSettings.list_comments}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, list_comments: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Users size={20} color="#333" />,
              'New Followers',
              undefined,
              false,
              <Switch
                value={notificationSettings.new_followers}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, new_followers: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Globe size={20} color="#333" />,
              'List Shares',
              undefined,
              false,
              <Switch
                value={notificationSettings.list_shares}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, list_shares: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'Enable Push Notifications',
              'Receive notifications on your device',
              false,
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={(value) => {
                  setPushNotificationsEnabled(value);
                  // TODO: Handle push notification permission request
                }}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Email Preferences</Text>
            
            {renderSettingsItem(
              <EnvelopeSimple size={20} color="#333" />,
              'Weekly Digest',
              undefined,
              false,
              <Switch
                value={notificationSettings.weekly_digest}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, weekly_digest: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Bell size={20} color="#333" />,
              'Product Updates',
              undefined,
              false,
              <Switch
                value={notificationSettings.product_updates}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, product_updates: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
            
            {renderSettingsItem(
              <Question size={20} color="#333" />,
              'Tips and Tutorials',
              undefined,
              false,
              <Switch
                value={notificationSettings.tips_and_tutorials}
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, tips_and_tutorials: value }))}
                trackColor={{ false: '#D9D9D9', true: '#FF8C00' }}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <AppBar title="Settings" showBackButton={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {userProfile.avatar_url ? (
                  <Image
                    source={{ uri: userProfile.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={24} color="#666" />
                  </View>
                )}
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>
                  {userProfile.full_name || 'User Name'}
                </Text>
                <Text style={styles.profileBio}>
                  @{userProfile.username || 'username'}
                </Text>
              </View>
            </View>
            <CaretRight size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Main Settings */}
        <View style={styles.settingsSection}>
          {renderSettingsItem(
            <Users size={20} color="#333" />,
            'Follow and invite friends',
            () => handleMenuPress('Follow')
          )}
          
          {renderSettingsItem(
            <Bell size={20} color="#333" />,
            'Notifications',
            () => handleMenuPress('Notifications')
          )}
          
          {renderSettingsItem(
            <Lock size={20} color="#333" />,
            'Privacy',
            () => handleMenuPress('Privacy')
          )}
          
          {renderSettingsItem(
            <User size={20} color="#333" />,
            'Account',
            () => handleMenuPress('Account')
          )}
          
          {renderSettingsItem(
            <Globe size={20} color="#333" />,
            'Language',
            () => handleMenuPress('Language')
          )}
          
          {renderSettingsItem(
            <Question size={20} color="#333" />,
            'Help & Support',
            () => handleMenuPress('Help')
          )}
          
          {renderSettingsItem(
            <Globe size={20} color="#333" />,
            'Privacy Policy',
            () => router.push('/privacy-policy')
          )}
          
          {renderSettingsItem(
            <Globe size={20} color="#333" />,
            'Terms of Service',
            () => router.push('/terms-of-service')
          )}
          
          {renderSettingsItem(
            <Globe size={20} color="#333" />,
            'About',
            () => handleMenuPress('About')
          )}
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderEditProfileModal()}
      {renderPrivacySettingsModal()}
      {renderNotificationSettingsModal()}

      <BottomMenu activeTab="settings" onTabPress={(tab) => {
        if (tab === 'profile') {
          router.push('/profile');
        } else if (tab === 'discover') {
          router.push('/discover');
        } else if (tab === 'create') {
          router.push('/create');
        } else if (tab === 'search') {
          router.push('/search');
        } else if (tab === 'home') {
          router.push('/');
        }
      }} />
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
    paddingHorizontal: 16,
  },
  profileSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
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
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#666666',
    lineHeight: 18,
  },
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    flex: 1,
  },
  signOutSection: {
    marginBottom: 100,
    paddingHorizontal: 4,
  },
  signOutButton: {
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    textAlign: 'left',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#000000',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Edit Profile Styles
  avatarEditSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarEditContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholderEdit: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#FF8C00',
  },
  formSection: {
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIconField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  genderOptionActive: {
    borderColor: '#FF8C00',
    backgroundColor: '#FF8C00',
  },
  genderOptionText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#666666',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
  },
  
  // Radio Group Styles
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF8C00',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF8C00',
  },
  radioText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
  },
});