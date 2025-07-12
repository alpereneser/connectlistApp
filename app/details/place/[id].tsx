import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Linking, 
  ActivityIndicator,
  Share,
  Dimensions 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Phone, 
  Clock, 
  Star, 
  Heart,
  Plus,
  Users
} from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { getPlaceDetails, PlaceResult } from '../../../services/googleMapsApi';
import { supabase } from '../../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlaceDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPlaceDetail();
  }, [id, data]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchPlaceDetail = async () => {
    try {
      setLoading(true);
      let placeData: PlaceResult | null = null;

      // Try to get data from navigation params first
      if (data) {
        try {
          placeData = JSON.parse(decodeURIComponent(data));
          console.log('Parsed place data:', placeData);
        } catch (parseError) {
          console.error('Error parsing place data:', parseError);
        }
      }

      // Get detailed info from Google Maps API
      if (id) {
        console.log('Fetching place details for ID:', id);
        const detailedPlace = await getPlaceDetails(id);
        if (detailedPlace) {
          // Merge existing data with API details
          placeData = {
            ...placeData,
            ...detailedPlace,
            id: id, // Ensure ID is correct
          };
        }
      }

      if (placeData) {
        setPlace(placeData);
        console.log('Final place data:', placeData);
      } else {
        Alert.alert('Error', 'Place not found');
        router.back();
      }
      
    } catch (error) {
      console.error('Error fetching place detail:', error);
      Alert.alert('Error', 'Failed to load place details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to add places to your lists');
      router.push('/auth/login');
      return;
    }
    
    // Liste seçim modalını aç veya hızlı liste oluştur
    router.push(`/create-list?category=places&preselected=${encodeURIComponent(JSON.stringify(place))}`);
  };

  const handleShare = async () => {
    if (!place) return;
    
    try {
      const message = `Check out ${place.name}!\n\n${place.address}\n\nShared via ConnectList`;
      
      await Share.share({
        message,
        title: place.name,
        url: place.website || undefined,
      });
    } catch (error) {
      console.error('Error sharing place:', error);
    }
  };

  const handleOpenInMaps = () => {
    if (!place) return;
    
    const [lat, lng] = place.coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const handleCallPhone = () => {
    if (!place?.phone) return;
    
    const phoneUrl = `tel:${place.phone}`;
    Linking.openURL(phoneUrl).catch(err => {
      console.error('Error calling phone:', err);
      Alert.alert('Error', 'Could not make phone call');
    });
  };

  const handleOpenWebsite = () => {
    if (!place?.website) return;
    
    Linking.openURL(place.website).catch(err => {
      console.error('Error opening website:', err);
      Alert.alert('Error', 'Could not open website');
    });
  };

  const handleWhoAddedList = () => {
    // Bu mekanı hangi kullanıcıların listelerine eklediğini göster
    if (!place) return;
    
    // TODO: Implement place usage analytics
    Alert.alert(
      'Who Added This Place',
      'This feature will show which users have added this place to their lists.',
      [{ text: 'OK', style: 'default' }]
    );
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

  const renderHeroSection = () => {
    return (
      <View style={styles.heroContainer}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {place?.image ? (
            <Image 
              source={{ uri: place.image }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MapPin size={48} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>No images available</Text>
            </View>
          )}
          
          {/* Image Overlay with Back and Actions */}
          <View style={styles.imageOverlay}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
            
            <View style={styles.imageActions}>
              <TouchableOpacity 
                style={styles.overlayActionButton}
                onPress={handleShare}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.overlayActionButton, isLiked && styles.likedButton]}
                onPress={() => setIsLiked(!isLiked)}
              >
                <Heart 
                  size={20} 
                  color={isLiked ? "#FF385C" : "#FFFFFF"} 
                  weight={isLiked ? "fill" : "regular"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons Below Image */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={handleAddToList}
          >
            <Plus size={20} color="#FFFFFF" weight="bold" />
            <Text style={styles.primaryActionText}>Add to List</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryActionButton}
            onPress={handleWhoAddedList}
          >
            <Users size={20} color="#FF385C" />
            <Text style={styles.secondaryActionText}>Who Added This</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlaceInfo = () => {
    if (!place) return null;

    return (
      <View style={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleSection}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeCategory}>{place.category?.replace(/_/g, ' ')}</Text>
          </View>
          
          {place.rating && (
            <View style={styles.ratingBadge}>
              <Star size={16} color="#FFD700" weight="fill" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {place.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{place.description}</Text>
          </View>
        )}

        {/* Details Cards */}
        <View style={styles.detailsGrid}>
          {place.address && (
            <TouchableOpacity style={styles.detailCard} onPress={handleOpenInMaps}>
              <View style={styles.detailCardHeader}>
                <MapPin size={24} color="#FF385C" />
                <Text style={styles.detailCardTitle}>Location</Text>
              </View>
              <Text style={styles.detailCardText}>{place.address}</Text>
            </TouchableOpacity>
          )}

          {place.phone && (
            <TouchableOpacity style={styles.detailCard} onPress={handleCallPhone}>
              <View style={styles.detailCardHeader}>
                <Phone size={24} color="#FF385C" />
                <Text style={styles.detailCardTitle}>Contact</Text>
              </View>
              <Text style={styles.detailCardText}>{place.phone}</Text>
            </TouchableOpacity>
          )}

          {place.website && (
            <TouchableOpacity style={styles.detailCard} onPress={handleOpenWebsite}>
              <View style={styles.detailCardHeader}>
                <Globe size={24} color="#FF385C" />
                <Text style={styles.detailCardTitle}>Website</Text>
              </View>
              <Text style={styles.detailCardText} numberOfLines={1}>
                {place.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          )}

          {place.workingHours && (
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Clock size={24} color="#FF385C" />
                <Text style={styles.detailCardTitle}>Hours</Text>
              </View>
              <Text style={styles.detailCardText}>{place.workingHours}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Place Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading place details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeroSection()}
        {renderPlaceInfo()}
      </ScrollView>

      <BottomMenu activeTab="" onTabPress={handleTabPress} />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#717171',
    fontFamily: 'Inter',
  },
  
  // Hero Section
  heroContainer: {
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: SCREEN_WIDTH * 0.7, // Responsive height
    backgroundColor: '#F7F7F7',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  overlayActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  likedButton: {
    backgroundColor: 'rgba(255, 56, 92, 0.1)',
  },
  shareButtonText: {
    color: '#222222',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  
  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF385C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    gap: 8,
  },
  secondaryActionText: {
    color: '#FF385C',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  
  // Content Container
  contentContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Section
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleSection: {
    flex: 1,
    paddingRight: 16,
  },
  placeName: {
    fontSize: 26,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'Inter',
    marginBottom: 4,
    lineHeight: 32,
  },
  placeCategory: {
    fontSize: 16,
    color: '#717171',
    fontFamily: 'Inter',
    textTransform: 'capitalize',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'Inter',
  },
  
  // Description
  descriptionSection: {
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 16,
    color: '#222222',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  
  // Details Grid
  detailsGrid: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    fontFamily: 'Inter',
  },
  detailCardText: {
    fontSize: 14,
    color: '#717171',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
});