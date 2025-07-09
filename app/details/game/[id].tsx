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
import { Star, Calendar, GameController, Users, Heart, Share, ArrowLeft, Plus, Eye, Monitor } from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { fontConfig } from '../../../styles/global';
import { getGameImageUrl, formatGameReleaseDate, getPlatformNames, getGenreNames } from '../../../services/rawgApi';

const { width: screenWidth } = Dimensions.get('window');

interface GameDetail {
  id: number;
  name: string;
  description?: string;
  description_raw?: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  rating_top: number;
  ratings_count: number;
  metacritic: number | null;
  platforms: Array<{
    platform: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
  genres: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  developers?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  publishers?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  esrb_rating?: {
    id: number;
    name: string;
    slug: string;
  };
  website?: string;
  reddit_url?: string;
  playtime: number;
  achievements_count?: number;
  parent_achievements_count?: number;
  reddit_name?: string;
  reddit_description?: string;
  reddit_logo?: string;
  reddit_count?: number;
  twitch_count?: number;
  youtube_count?: number;
  reviews_text_count?: number;
  added: number;
  added_by_status?: {
    yet: number;
    owned: number;
    beaten: number;
    toplay: number;
    dropped: number;
    playing: number;
  };
  suggestions_count?: number;
  alternative_names?: string[];
  metacritic_url?: string;
  parents_count?: number;
  additions_count?: number;
  game_series_count?: number;
  user_game?: any;
  reviews_count?: number;
  saturated_color?: string;
  dominant_color?: string;
  short_screenshots?: Array<{
    id: number;
    image: string;
  }>;
}

export default function GameDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadGameDetails();
  }, [id]);

  const loadGameDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        try {
          const gameData = JSON.parse(decodeURIComponent(String(data)));
          setGame(gameData);
        } catch (parseError) {
          console.error('Game data parse error:', parseError);
          setMockGame();
        }
      } else {
        setMockGame();
      }
    } catch (error) {
      console.error('Error loading game details:', error);
      setMockGame();
    } finally {
      setLoading(false);
    }
  };

  const setMockGame = () => {
    const mockGame: GameDetail = {
      id: Number(id),
      name: 'Sample Game',
      description: 'This is a sample game description.',
      background_image: null,
      released: '2023-01-01',
      rating: 4.5,
      rating_top: 5,
      ratings_count: 1000,
      metacritic: 85,
      platforms: [
        { platform: { id: 1, name: 'PC', slug: 'pc' } },
        { platform: { id: 2, name: 'PlayStation 5', slug: 'playstation5' } }
      ],
      genres: [
        { id: 1, name: 'Action', slug: 'action' },
        { id: 2, name: 'Adventure', slug: 'adventure' }
      ],
      playtime: 25,
      added: 5000,
      short_screenshots: [
        { id: 1, image: 'https://via.placeholder.com/800x450?text=Screenshot+1' },
        { id: 2, image: 'https://via.placeholder.com/800x450?text=Screenshot+2' }
      ]
    };
    setGame(mockGame);
  };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share game');
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

  const handleWebsite = () => {
    if (game?.website) {
      Linking.openURL(game.website);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Game Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <AppBar title="Game Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Game not found</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  const gameImages = game.short_screenshots || [];
  if (game.background_image && !gameImages.find(img => img.image === game.background_image)) {
    gameImages.unshift({ id: 0, image: game.background_image });
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {gameImages.length > 0 && (
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
              {gameImages.map((screenshot, index) => (
                <Image key={screenshot.id} source={{ uri: screenshot.image }} style={styles.gameImage} />
              ))}
            </ScrollView>
            
            {/* Image Indicators */}
            {gameImages.length > 1 && (
              <View style={styles.imageIndicators}>
                {gameImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
            
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
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Game Info */}
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>{game.name}</Text>
            
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" weight="fill" />
              <Text style={styles.ratingText}>{game.rating.toFixed(1)}</Text>
              <Text style={styles.ratingsCount}>({game.ratings_count} ratings)</Text>
              {game.metacritic && (
                <View style={styles.metacriticContainer}>
                  <Text style={styles.metacriticLabel}>Metacritic:</Text>
                  <Text style={styles.metacriticScore}>{game.metacritic}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.metaText}>{formatGameReleaseDate(game.released)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Monitor size={16} color="#6B7280" />
                <Text style={styles.metaText}>{getPlatformNames(game.platforms)}</Text>
              </View>
              {game.playtime > 0 && (
                <View style={styles.metaItem}>
                  <GameController size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{game.playtime} hours avg playtime</Text>
                </View>
              )}
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
          {game.genres && game.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {game.genres.map((genre) => (
                  <View key={genre.id} style={styles.genreItem}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {(game.description || game.description_raw) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>
                {game.description_raw || game.description}
              </Text>
            </View>
          )}

          {/* Developers & Publishers */}
          {((game.developers && game.developers.length > 0) || (game.publishers && game.publishers.length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Development</Text>
              <View style={styles.detailsContainer}>
                {game.developers && game.developers.length > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Developers:</Text>
                    <Text style={styles.detailValue}>
                      {game.developers.map(dev => dev.name).join(', ')}
                    </Text>
                  </View>
                )}
                {game.publishers && game.publishers.length > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Publishers:</Text>
                    <Text style={styles.detailValue}>
                      {game.publishers.map(pub => pub.name).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsContainer}>
              {game.esrb_rating && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ESRB Rating:</Text>
                  <Text style={styles.detailValue}>{game.esrb_rating.name}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Added by users:</Text>
                <Text style={styles.detailValue}>{game.added.toLocaleString()}</Text>
              </View>
              {game.achievements_count && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Achievements:</Text>
                  <Text style={styles.detailValue}>{game.achievements_count}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Website Link */}
          {game.website && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.websiteButton} onPress={handleWebsite}>
                <Text style={styles.websiteButtonText}>Visit Official Website</Text>
              </TouchableOpacity>
            </View>
          )}
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
  gameImage: {
    width: screenWidth,
    height: 250,
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
  gameInfo: {
    marginBottom: 24,
  },
  gameTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingsCount: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 4,
  },
  metacriticContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  metacriticLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginRight: 4,
  },
  metacriticScore: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#059669',
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
    flex: 1,
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
  description: {
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
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  websiteButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  websiteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
});