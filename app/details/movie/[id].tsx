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
import { Star, Calendar, Clock, Users, Heart, Share, ArrowLeft, Plus, Eye } from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { fontConfig } from '../../../styles/global';
import { getImageUrl } from '../../../services/tmdbApi';

const { width: screenWidth } = Dimensions.get('window');

interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  budget?: number;
  revenue?: number;
  original_language: string;
  original_title: string;
  popularity: number;
  status: string;
}

export default function MovieDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        try {
          const movieData = JSON.parse(decodeURIComponent(String(data)));
          setMovie(movieData);
        } catch (parseError) {
          console.error('Movie data parse error:', parseError);
          setMockMovie();
        }
      } else {
        setMockMovie();
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
      setMockMovie();
    } finally {
      setLoading(false);
    }
  };

  const setMockMovie = () => {
    const mockMovie: MovieDetail = {
      id: Number(id),
      title: 'Sample Movie',
      overview: 'This is a sample movie description.',
      poster_path: null,
      backdrop_path: null,
      release_date: '2023-01-01',
      vote_average: 7.5,
      vote_count: 1000,
      runtime: 120,
      genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }],
      original_language: 'en',
      original_title: 'Sample Movie',
      popularity: 100,
      status: 'Released'
    };
    setMovie(mockMovie);
  };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share movie');
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

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
        <AppBar title="Movie Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.container}>
        <AppBar title="Movie Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Movie not found</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const backdropUrl = getImageUrl(movie.backdrop_path, 'w1280');

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
          {/* Movie Info */}
          <View style={styles.movieInfo}>
            <View style={styles.posterAndDetails}>
              {posterUrl && (
                <Image source={{ uri: posterUrl }} style={styles.posterImage} />
              )}
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                {movie.original_title !== movie.title && (
                  <Text style={styles.originalTitle}>({movie.original_title})</Text>
                )}
                
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#F59E0B" weight="fill" />
                  <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
                  <Text style={styles.voteCount}>({movie.vote_count} votes)</Text>
                </View>
                
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{formatDate(movie.release_date)}</Text>
                  </View>
                  {movie.runtime && (
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{formatRuntime(movie.runtime)}</Text>
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
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {movie.genres.map((genre) => (
                  <View key={genre.id} style={styles.genreItem}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Overview */}
          {movie.overview && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{movie.overview}</Text>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{movie.status}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Language:</Text>
                <Text style={styles.detailValue}>{movie.original_language.toUpperCase()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Popularity:</Text>
                <Text style={styles.detailValue}>{movie.popularity.toFixed(1)}</Text>
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
  movieInfo: {
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
  movieDetails: {
    flex: 1,
  },
  movieTitle: {
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