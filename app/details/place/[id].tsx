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
  MapPin, 
  Globe, 
  Phone, 
  Clock, 
  Star,
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
    if (!place) return;
    
    // Who Added This sayfasına git
    const params = new URLSearchParams({
      contentType: 'place',
      contentTitle: encodeURIComponent(place.name),
    });
    
    router.push(`/who-added/${place.id}?${params.toString()}`);
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
            <Users size={20} color="#FF6B35" />
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
                <MapPin size={24} color="#FF6B35" />
                <Text style={styles.detailCardTitle}>Location</Text>
              </View>
              <Text style={styles.detailCardText}>{place.address}</Text>
            </TouchableOpacity>
          )}

          {place.website && (
            <TouchableOpacity style={styles.detailCard} onPress={handleOpenWebsite}>
              <View style={styles.detailCardHeader}>
                <Globe size={24} color="#FF6B35" />
                <Text style={styles.detailCardTitle}>Website</Text>
              </View>
              <Text style={styles.detailCardText} numberOfLines={1}>
                {place.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Contact and Hours - Side by Side */}
          {(place.phone || place.workingHours) && (
            <View style={styles.sideBySideContainer}>
              {place.phone && (
                <TouchableOpacity style={styles.halfWidthCard} onPress={handleCallPhone}>
                  <View style={styles.detailCardHeader}>
                    <Phone size={24} color="#FF6B35" />
                    <Text style={styles.detailCardTitle}>Contact</Text>
                  </View>
                  <Text style={styles.detailCardText}>{place.phone}</Text>
                </TouchableOpacity>
              )}

              {place.workingHours && (
                <View style={styles.halfWidthCard}>
                  <View style={styles.detailCardHeader}>
                    <Clock size={24} color="#FF6B35" />
                    <Text style={styles.detailCardTitle}>Hours</Text>
                  </View>
                  <Text style={styles.detailCardText}>{place.workingHours}</Text>
                </View>
              )}
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
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading place details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Place Details" />
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
    backgroundColor: '#FF6B35',
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
    color: '#FF6B35',
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
  
  // Side by Side Cards
  sideBySideContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthCard: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
});