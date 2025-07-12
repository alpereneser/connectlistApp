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
  ShareNetwork,
  Heart,
  Plus,
  Camera
} from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
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

  const renderImageCarousel = () => {
    if (!place?.image) {
      return (
        <View style={styles.imagePlaceholder}>
          <Camera size={48} color="#9CA3AF" />
          <Text style={styles.imagePlaceholderText}>No images available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: place.image }} 
          style={styles.placeImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
          
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <ShareNetwork size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => setIsLiked(!isLiked)}
            >
              <Heart 
                size={20} 
                color={isLiked ? "#EF4444" : "#FFFFFF"} 
                weight={isLiked ? "fill" : "regular"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPlaceInfo = () => {
    if (!place) return null;

    return (
      <View style={styles.infoContainer}>
        <View style={styles.headerInfo}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeCategory}>{place.category?.replace(/_/g, ' ')}</Text>
          
          {place.rating && (
            <View style={styles.ratingContainer}>
              <Star size={20} color="#F59E0B" weight="fill" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              <Text style={styles.ratingSubtext}>Google Rating</Text>
            </View>
          )}
        </View>

        {place.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{place.description}</Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          {place.address && (
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={handleOpenInMaps}
            >
              <MapPin size={20} color="#6B7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailText}>{place.address}</Text>
              </View>
              <MapPin size={16} color="#F97316" />
            </TouchableOpacity>
          )}

          {place.phone && (
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={handleCallPhone}
            >
              <Phone size={20} color="#6B7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailText}>{place.phone}</Text>
              </View>
            </TouchableOpacity>
          )}

          {place.website && (
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={handleOpenWebsite}
            >
              <Globe size={20} color="#6B7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Website</Text>
                <Text style={styles.detailText} numberOfLines={1}>
                  {place.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {place.workingHours && (
            <View style={styles.detailItem}>
              <Clock size={20} color="#6B7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Hours</Text>
                <Text style={styles.detailText}>{place.workingHours}</Text>
              </View>
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
        {renderImageCarousel()}
        {renderPlaceInfo()}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.addToListButton}
        onPress={handleAddToList}
      >
        <Plus size={24} color="#FFFFFF" weight="bold" />
        <Text style={styles.addToListText}>Add to List</Text>
      </TouchableOpacity>
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
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter',
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
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  infoContainer: {
    padding: 20,
  },
  headerInfo: {
    marginBottom: 20,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  ratingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  descriptionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4B5563',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  addToListButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addToListText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});