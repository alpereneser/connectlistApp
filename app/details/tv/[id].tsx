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
import { Star, Calendar, Clock, Users, Heart, Share, ArrowLeft, Plus, Eye, Television } from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { fontConfig } from '../../../styles/global';
import { getImageUrl } from '../../../services/tmdbApi';

const { width: screenWidth } = Dimensions.get('window');

interface TVShowDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: Array<{ id: number; name: string }>;
  networks?: Array<{ id: number; name: string; logo_path: string | null }>;
  original_language: string;
  original_name: string;
  popularity: number;
  status: string;
  type?: string;
  episode_run_time?: number[];
}

export default function TVShowDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [tvShow, setTVShow] = useState<TVShowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadTVShowDetails();
  }, [id]);

  const loadTVShowDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        try {
          const tvShowData = JSON.parse(decodeURIComponent(String(data)));
          setTVShow(tvShowData);
        } catch (parseError) {
          console.error('TV Show data parse error:', parseError);
          setMockTVShow();
        }
      } else {
        setMockTVShow();
      }
    } catch (error) {
      console.error('Error loading TV show details:', error);
      setMockTVShow();
    } finally {
      setLoading(false);
    }
  };

  const setMockTVShow = () => {
    const mockTVShow: TVShowDetail = {
      id: Number(id),
      name: 'Sample TV Show',
      overview: 'This is a sample TV show description.',
      poster_path: null,
      backdrop_path: null,
      first_air_date: '2023-01-01',
      vote_average: 8.2,
      vote_count: 500,
      number_of_seasons: 3,
      number_of_episodes: 30,
      genres: [{ id: 1, name: 'Drama' }, { id: 2, name: 'Thriller' }],
      original_language: 'en',
      original_name: 'Sample TV Show',
      popularity: 150,
      status: 'Returning Series',
      episode_run_time: [45]
    };
    setTVShow(mockTVShow);
  };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share TV show');
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

  const formatRuntime = (minutes?: number[]) => {
    if (!minutes || minutes.length === 0) return 'Unknown';
    return `${minutes[0]}m per episode`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="TV Show Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!tvShow) {
    return (
      <View style={styles.container}>
        <AppBar title="TV Show Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>TV Show not found</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  const posterUrl = getImageUrl(tvShow.poster_path, 'w500');
  const backdropUrl = getImageUrl(tvShow.backdrop_path, 'w1280');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backdrop Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: backdropUrl || posterUrl || 'https://via.placeholder.com/800x450?text=No+Image' 
            }} 
            style={styles.backdropImage} 
          />
          
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
          {/* TV Show Info */}
          <View style={styles.tvShowInfo}>
            <View style={styles.posterAndDetails}>
              {posterUrl && (
                <Image source={{ uri: posterUrl }} style={styles.posterImage} />
              )}
              <View style={styles.tvShowDetails}>
                <Text style={styles.tvShowTitle}>{tvShow.name}</Text>
                {tvShow.original_name !== tvShow.name && (
                  <Text style={styles.originalTitle}>({tvShow.original_name})</Text>
                )}
                
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#F59E0B" weight="fill" />
                  <Text style={styles.ratingText}>{tvShow.vote_average.toFixed(1)}</Text>
                  <Text style={styles.voteCount}>({tvShow.vote_count} votes)</Text>
                </View>
                
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{formatDate(tvShow.first_air_date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Television size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{tvShow.number_of_seasons} seasons</Text>
                  </View>
                  {tvShow.episode_run_time && (
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{formatRuntime(tvShow.episode_run_time)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddToList}>
              <Plus size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.primaryButtonText}>Add List</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleWhoAddedList}>
              <Eye size={20} color="#3B82F6" weight="bold" />
              <Text style={styles.secondaryButtonText}>Who Added List</Text>
            </TouchableOpacity>
          </View>

          {/* Genres */}
          {tvShow.genres && tvShow.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {tvShow.genres.map((genre) => (
                  <View key={genre.id} style={styles.genreItem}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Overview */}
          {tvShow.overview && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{tvShow.overview}</Text>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{tvShow.status}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Language:</Text>
                <Text style={styles.detailValue}>{tvShow.original_language.toUpperCase()}</Text>
              </View>
              {tvShow.number_of_episodes && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Episodes:</Text>
                  <Text style={styles.detailValue}>{tvShow.number_of_episodes}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Popularity:</Text>
                <Text style={styles.detailValue}>{tvShow.popularity.toFixed(1)}</Text>
              </View>
            </View>
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
    height: 250,
  },
  backdropImage: {
    width: screenWidth,
    height: 250,
    resizeMode: 'cover',
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tvShowInfo: {
    marginBottom: 24,
  },
  posterAndDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  tvShowDetails: {
    flex: 1,
  },
  tvShowTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 4,
  },
  originalTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 4,
  },
  metaInfo: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#3B82F6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  overview: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#374151',
    lineHeight: 24,
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
});