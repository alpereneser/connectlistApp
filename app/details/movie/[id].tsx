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
import { getImageUrl, getMovieCredits, CastMember } from '../../../services/tmdbApi';

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
  const [cast, setCast] = useState<CastMember[]>([]);
  const [showAllCast, setShowAllCast] = useState(false);
  const [loading, setLoading] = useState(true);

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
          
          // Gerçek cast verilerini TMDB'den çek
          console.log('Fetching cast for movie ID:', movieData.id);
          const movieCast = await getMovieCredits(movieData.id);
          console.log('Movie cast received:', movieCast.length, 'cast members');
          console.log('First 3 cast members:', movieCast.slice(0, 3).map(c => ({ 
            name: c.name, 
            profile_path: c.profile_path,
            imageUrl: c.profile_path ? getImageUrl(c.profile_path, 'w185') : 'No image'
          })));
          setCast(movieCast);
        } catch (parseError) {
          console.error('Movie data parse error:', parseError);
          await setMockMovie();
        }
      } else {
        await setMockMovie();
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
      await setMockMovie();
    } finally {
      setLoading(false);
    }
  };

  const setMockMovie = async () => {
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
    
    // Mock movie için de gerçek API'yi dene, olmassa fallback olarak mock cast kullan
    try {
      const movieCast = await getMovieCredits(Number(id));
      setCast(movieCast);
    } catch (error) {
      console.error('Error fetching mock movie cast:', error);
      setMockCast();
    }
  };

  const setMockCast = () => {
    // Set mock cast with actual TMDB profile paths
    const mockCast: CastMember[] = [
      { id: 1, name: 'Robert Downey Jr.', character: 'Tony Stark', profile_path: '/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg', order: 0 },
      { id: 2, name: 'Chris Evans', character: 'Steve Rogers', profile_path: '/3bOGNsHlrswhyW79uvIHH1V43JI.jpg', order: 1 },
      { id: 3, name: 'Scarlett Johansson', character: 'Natasha Romanoff', profile_path: '/3JTEc2tGUact9c0WktvpeJ9pajn.jpg', order: 2 },
      { id: 4, name: 'Chris Hemsworth', character: 'Thor', profile_path: '/jpurJ9jAcLCYjgHHfYF32m3zJYm.jpg', order: 3 },
      { id: 5, name: 'Mark Ruffalo', character: 'Bruce Banner', profile_path: '/z3dvKqMNDQWk3QLxzumloQVR0pv.jpg', order: 4 },
      { id: 6, name: 'Jeremy Renner', character: 'Clint Barton', profile_path: '/lMaDAEErx0gZyUypPOmz1v17vPr.jpg', order: 5 },
      { id: 7, name: 'Tom Holland', character: 'Peter Parker', profile_path: '/RhNNQGJWKLECPKzUQreAf1QsrH.jpg', order: 6 },
      { id: 8, name: 'Brie Larson', character: 'Carol Danvers', profile_path: '/iqaHjZ4CtOqJArH9B3DkMkKWTDq.jpg', order: 7 },
      { id: 9, name: 'Anthony Mackie', character: 'Sam Wilson', profile_path: '/bWYpdmF8gL3ZZ2zg8eT4W4v4LhX.jpg', order: 8 },
      { id: 10, name: 'Sebastian Stan', character: 'Bucky Barnes', profile_path: '/qbdLpJrwWwKGfMNE31Oq8VGGXhx.jpg', order: 9 },
    ];
    setCast(mockCast);
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


  const handleAddToList = () => {
    console.log('Add to list');
    // TODO: Add to list functionality
  };

  const handleWhoAddedList = () => {
    if (!movie) return;
    
    // Who Added This sayfasına git - PlaceDetails'tekine benzer yapı
    const params = new URLSearchParams({
      contentType: 'movie',
      contentTitle: encodeURIComponent(movie.title),
    });
    
    router.push(`/who-added/${movie.id}?${params.toString()}`);
  };

  const handlePersonPress = (person: CastMember) => {
    const personData = {
      id: person.id,
      name: person.name,
      profile_path: person.profile_path,
    };
    router.push(`/details/person/${person.id}?data=${encodeURIComponent(JSON.stringify(personData))}`);
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
          <ActivityIndicator size="large" color="#FF6B35" />
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
      <AppBar title={movie?.title || 'Movie Details'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backdrop Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: backdropUrl || posterUrl || 'https://via.placeholder.com/800x450?text=No+Image' 
            }} 
            style={styles.backdropImage} 
          />
          
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
              <Eye size={20} color="#FF6B35" weight="bold" />
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

          {/* Cast */}
          {cast && cast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cast</Text>
                {cast.length > 6 && (
                  <TouchableOpacity onPress={() => setShowAllCast(!showAllCast)}>
                    <Text style={styles.seeAllText}>
                      {showAllCast ? 'Show Less' : 'See All'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.castGrid}>
                {(showAllCast ? cast : cast.slice(0, 6)).map((person) => (
                  <TouchableOpacity 
                    key={person.id} 
                    style={styles.castGridItem}
                    onPress={() => handlePersonPress(person)}
                  >
                    <Image 
                      source={{ 
                        uri: person.profile_path 
                          ? getImageUrl(person.profile_path, 'w185') 
                          : 'https://via.placeholder.com/150x225/cccccc/666666?text=No+Photo'
                      }} 
                      style={styles.castGridImage}
                      defaultSource={{ uri: 'https://via.placeholder.com/150x225/cccccc/666666?text=Loading' }}
                      onError={(error) => {
                        console.log('Image load error for cast member:', person.name, error.nativeEvent.error);
                      }}
                    />
                    <View style={styles.castGridInfo}>
                      <Text style={styles.castGridName} numberOfLines={1}>{person.name}</Text>
                      <Text style={styles.castGridCharacter} numberOfLines={1}>{person.character}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
    backgroundColor: '#FF6B35',
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
    borderColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FF6B35',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FF6B35',
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  castGridItem: {
    width: '48%',
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  castGridImage: {
    width: 50,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  castGridInfo: {
    flex: 1,
  },
  castGridName: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  castGridCharacter: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
});