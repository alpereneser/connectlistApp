import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Clock, MapPin, Phone, Globe, Heart, Share, ArrowLeft, Plus, Eye } from 'phosphor-react-native';
import AppBar from '../../components/AppBar';
import BottomMenu from '../../components/BottomMenu';
import { fontConfig } from '../../styles/global';

const { width: screenWidth } = Dimensions.get('window');

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  address: string;
  rating?: number;
  workingHours?: string;
  phone?: string;
  website?: string;
  description?: string;
  images: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  priceRange?: string;
}

export default function PlaceDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadPlaceDetails();
  }, [id]);

  const loadPlaceDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        // Query parametresinden gelen veriyi kullan
        try {
          const placeData = JSON.parse(decodeURIComponent(String(data)));
          const detailPlace: PlaceDetail = {
            id: placeData.id,
            name: placeData.name,
            category: placeData.category,
            address: placeData.address,
            rating: placeData.rating,
            workingHours: placeData.workingHours,
            phone: placeData.phone,
            website: placeData.website,
            description: placeData.description || `${placeData.name} hakkında detaylı bilgi.`,
            images: placeData.image ? [placeData.image] : [
              'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
            ],
            coordinates: placeData.coordinates ? {
              latitude: placeData.coordinates[0],
              longitude: placeData.coordinates[1],
            } : undefined,
            amenities: ['WiFi', 'Klima', 'Kart Geçer'],
            priceRange: '₺₺',
          };
          setPlace(detailPlace);
        } catch (parseError) {
          console.error('Veri parse hatası:', parseError);
          // Parse hatası durumunda mock data kullan
          setMockPlace();
        }
      } else {
        // Veri yoksa mock data kullan
        setMockPlace();
      }
    } catch (error) {
      console.error('Mekan detayları yüklenirken hata:', error);
      setMockPlace();
    } finally {
      setLoading(false);
    }
  };

  const setMockPlace = () => {
    const mockPlace: PlaceDetail = {
      id: String(id),
      name: 'Starbucks Coffee',
      category: 'Kafe',
      address: 'Bağdat Caddesi No:123, Kadıköy/İstanbul',
      rating: 4.5,
      workingHours: '07:00 - 23:00',
      phone: '+90 216 123 45 67',
      website: 'https://www.starbucks.com.tr',
      description: 'Dünya çapında ünlü kahve zinciri. Kaliteli kahve ve rahat atmosfer ile misafirlerini ağırlıyor.',
      images: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
        'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
      ],
      coordinates: {
        latitude: 40.9925,
        longitude: 29.0244,
      },
      amenities: ['WiFi', 'Klima', 'Kart Geçer', 'Takeaway'],
      priceRange: '₺₺',
    };
     setPlace(mockPlace);
   };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    // TODO: Paylaşım fonksiyonu
    console.log('Paylaş');
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleAddToList = () => {
    console.log('Add to list');
    // TODO: Add to list functionality
  };

  const handleWhoAddedList = () => {
    console.log('Who added to list');
    // TODO: Who added to list functionality
  };

  const handleCall = () => {
    if (place?.phone) {
      Linking.openURL(`tel:${place.phone}`);
    }
  };

  const handleWebsite = () => {
    if (place?.website) {
      Linking.openURL(place.website);
    }
  };

  const handleDirections = () => {
    if (place?.coordinates) {
      const url = `https://maps.google.com/?q=${place.coordinates.latitude},${place.coordinates.longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Mekan Detayı" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.container}>
        <AppBar title="Mekan Detayı" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mekan bulunamadı</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(index);
            }}
          >
            {place.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.placeImage} />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {place.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share size={24} color="#FFFFFF" weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                <Heart
                  size={24}
                  color={isFavorite ? "#EF4444" : "#FFFFFF"}
                  weight={isFavorite ? "fill" : "bold"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.placeName}>{place.name}</Text>
              {place.priceRange && (
                <Text style={styles.priceRange}>{place.priceRange}</Text>
              )}
            </View>
            <Text style={styles.placeCategory}>{place.category}</Text>
            
            {place.rating && (
              <View style={styles.ratingContainer}>
                <Star size={16} color="#F59E0B" weight="fill" />
                <Text style={styles.ratingText}>{place.rating}</Text>
                <Text style={styles.ratingLabel}>• Harika</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.listActionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddToList}>
              <Plus size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.primaryButtonText}>Add List</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleWhoAddedList}>
              <Eye size={20} color="#3B82F6" weight="bold" />
              <Text style={styles.secondaryButtonText}>Who Added List</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {place.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.description}>{place.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {place.amenities && place.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Özellikler</Text>
              <View style={styles.amenitiesContainer}>
                {place.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İletişim</Text>
            
            <View style={styles.contactItem}>
              <MapPin size={20} color="#6B7280" />
              <Text style={styles.contactText}>{place.address}</Text>
            </View>
            
            {place.workingHours && (
              <View style={styles.contactItem}>
                <Clock size={20} color="#6B7280" />
                <Text style={styles.contactText}>{place.workingHours}</Text>
              </View>
            )}
            
            {place.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <Phone size={20} color="#3B82F6" />
                <Text style={[styles.contactText, styles.contactLink]}>{place.phone}</Text>
              </TouchableOpacity>
            )}
            
            {place.website && (
              <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
                <Globe size={20} color="#3B82F6" />
                <Text style={[styles.contactText, styles.contactLink]}>Web Sitesi</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleDirections}>
              <MapPin size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.primaryButtonText}>Yol Tarifi</Text>
            </TouchableOpacity>
            
            {place.phone && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
                <Phone size={20} color="#3B82F6" weight="bold" />
                <Text style={styles.secondaryButtonText}>Ara</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      <BottomMenu activeTab="search" onTabPress={handleTabPress} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  placeImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  basicInfo: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 28,
    fontFamily: 'Inter',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },
  priceRange: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#F97316',
  },
  placeCategory: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#F97316',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginLeft: 6,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#4B5563',
    lineHeight: 24,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
  contactLink: {
    color: '#F97316',
    fontFamily: 'Inter',
  },
  listActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#F97316',
  },
});