// RAWG API integration for game search
import { Platform } from 'react-native';
import { ENV } from '../config/env';

const RAWG_API_KEY = ENV.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Mock game data
const MOCK_GAMES: GameResult[] = [
  {
    id: 1,
    name: 'The Witcher 3: Wild Hunt',
    background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    released: '2015-05-19',
    rating: 4.66,
    rating_top: 5,
    ratings_count: 8947,
    metacritic: 93,
    platforms: [
      { platform: { id: 1, name: 'PC', slug: 'pc' } },
      { platform: { id: 2, name: 'PlayStation 4', slug: 'ps4' } }
    ],
    genres: [
      { id: 1, name: 'Action', slug: 'action' },
      { id: 2, name: 'RPG', slug: 'role-playing-games-rpg' }
    ],
    short_screenshots: [
      { id: 1, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' }
    ]
  },
  {
    id: 2,
    name: 'Cyberpunk 2077',
    background_image: 'https://images.unsplash.com/photo-1596740361279-adb0-11ea-88d8-36e23e50aa2c?w=400&h=300&fit=crop',
    released: '2020-12-10',
    rating: 4.12,
    rating_top: 5,
    ratings_count: 5234,
    metacritic: 86,
    platforms: [
      { platform: { id: 1, name: 'PC', slug: 'pc' } },
      { platform: { id: 3, name: 'Xbox Series X', slug: 'xbox-series-x' } }
    ],
    genres: [
      { id: 1, name: 'Action', slug: 'action' },
      { id: 3, name: 'Adventure', slug: 'adventure' }
    ],
    short_screenshots: [
      { id: 2, image: 'https://images.unsplash.com/photo-1596740361279-adb0-11ea-88d8-36e23e50aa2c?w=400' }
    ]
  },
  {
    id: 3,
    name: 'Minecraft',
    background_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    released: '2011-11-18',
    rating: 4.4,
    rating_top: 5,
    ratings_count: 12456,
    metacritic: 93,
    platforms: [
      { platform: { id: 1, name: 'PC', slug: 'pc' } },
      { platform: { id: 4, name: 'Mobile', slug: 'android' } }
    ],
    genres: [
      { id: 4, name: 'Simulation', slug: 'simulation' },
      { id: 5, name: 'Indie', slug: 'indie' }
    ],
    short_screenshots: [
      { id: 3, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' }
    ]
  },
  {
    id: 4,
    name: 'Call of Duty: Modern Warfare',
    background_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop',
    released: '2019-10-25',
    rating: 4.3,
    rating_top: 5,
    ratings_count: 7821,
    metacritic: 81,
    platforms: [
      { platform: { id: 1, name: 'PC', slug: 'pc' } },
      { platform: { id: 2, name: 'PlayStation 4', slug: 'ps4' } }
    ],
    genres: [
      { id: 1, name: 'Action', slug: 'action' },
      { id: 6, name: 'Shooter', slug: 'shooter' }
    ],
    short_screenshots: [
      { id: 4, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' }
    ]
  },
  {
    id: 5,
    name: 'Among Us',
    background_image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
    released: '2018-06-15',
    rating: 3.9,
    rating_top: 5,
    ratings_count: 4567,
    metacritic: 85,
    platforms: [
      { platform: { id: 4, name: 'Mobile', slug: 'android' } },
      { platform: { id: 1, name: 'PC', slug: 'pc' } }
    ],
    genres: [
      { id: 7, name: 'Casual', slug: 'casual' },
      { id: 8, name: 'Multiplayer', slug: 'multiplayer' }
    ],
    short_screenshots: [
      { id: 5, image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400' }
    ]
  }
];

// Game result interface
export interface GameResult {
  id: number;
  name: string;
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
  short_screenshots: Array<{
    id: number;
    image: string;
  }>;
}

// RAWG search response interface
export interface RAWGSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GameResult[];
}

// Search games function with fallback
export const searchGames = async (query: string, page: number = 1): Promise<RAWGSearchResponse> => {
  try {
    // If no API key, return mock data
    if (!RAWG_API_KEY) {
      console.warn('RAWG API key missing, using mock data');
      const filtered = MOCK_GAMES.filter(game => 
        game.name.toLowerCase().includes(query.toLowerCase()) ||
        game.genres.some(genre => genre.name.toLowerCase().includes(query.toLowerCase()))
      );
      return {
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered.length > 0 ? filtered : MOCK_GAMES
      };
    }

    // For web platform, we might face CORS issues
    if (Platform.OS === 'web') {
      console.warn('Web platform detected, checking for CORS issues');
    }

    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page=${page}&page_size=20`
    );
    
    if (!response.ok) {
      console.error(`RAWG API error: ${response.status}`);
      // Return mock data on API error
      const filtered = MOCK_GAMES.filter(game => 
        game.name.toLowerCase().includes(query.toLowerCase())
      );
      return {
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered.length > 0 ? filtered : MOCK_GAMES
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching games:', error);
    // Return mock data on any error
    const filtered = MOCK_GAMES.filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase())
    );
    return {
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered.length > 0 ? filtered : MOCK_GAMES
    };
  }
};

// Get popular games with fallback
export const getPopularGames = async (page: number = 1): Promise<RAWGSearchResponse> => {
  try {
    // If no API key, return mock data
    if (!RAWG_API_KEY) {
      console.warn('RAWG API key missing, using mock data');
      return {
        count: MOCK_GAMES.length,
        next: null,
        previous: null,
        results: MOCK_GAMES
      };
    }

    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-rating&page=${page}&page_size=20`
    );
    
    if (!response.ok) {
      console.error(`RAWG API error: ${response.status}`);
      return {
        count: MOCK_GAMES.length,
        next: null,
        previous: null,
        results: MOCK_GAMES
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching popular games:', error);
    return {
      count: MOCK_GAMES.length,
      next: null,
      previous: null,
      results: MOCK_GAMES
    };
  }
};

// Get game details with fallback
export const getGameDetails = async (gameId: number): Promise<GameResult> => {
  try {
    // Check if it's a mock game ID
    const mockGame = MOCK_GAMES.find(g => g.id === gameId);
    if (mockGame) {
      return mockGame;
    }

    // If no API key, return first mock game
    if (!RAWG_API_KEY) {
      console.warn('RAWG API key missing, using mock data');
      return MOCK_GAMES[0];
    }

    const response = await fetch(
      `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`RAWG API error: ${response.status}`);
      return MOCK_GAMES[0];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return MOCK_GAMES[0];
  }
};

// Get image URL helper
export const getGameImageUrl = (imagePath: string | null, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }
  
  // RAWG images are already full URLs
  return imagePath;
};

// Popular game categories
export const RAWG_CATEGORIES = [
  { id: 'games-popular', name: 'Popular Games', query: '' },
  { id: 'action', name: 'Action', query: 'action' },
  { id: 'adventure', name: 'Adventure', query: 'adventure' },
  { id: 'rpg', name: 'RPG', query: 'rpg' },
  { id: 'strategy', name: 'Strategy', query: 'strategy' },
  { id: 'shooter', name: 'Shooter', query: 'shooter' },
  { id: 'puzzle', name: 'Puzzle', query: 'puzzle' },
  { id: 'racing', name: 'Racing', query: 'racing' },
  { id: 'sports', name: 'Sports', query: 'sports' },
  { id: 'simulation', name: 'Simulation', query: 'simulation' },
];

// Format release date
export const formatGameReleaseDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  } catch {
    return 'Unknown';
  }
};

// Get platform names
export const getPlatformNames = (platforms: GameResult['platforms']): string => {
  if (!platforms || platforms.length === 0) return 'Unknown';
  
  const platformNames = platforms.slice(0, 3).map(p => p.platform.name);
  return platformNames.join(', ');
};

// Get genre names
export const getGenreNames = (genres: GameResult['genres']): string => {
  if (!genres || genres.length === 0) return 'Unknown';
  
  const genreNames = genres.slice(0, 2).map(g => g.name);
  return genreNames.join(', ');
};