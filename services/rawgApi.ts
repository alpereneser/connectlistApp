// RAWG API integration for game search

const RAWG_API_KEY = 'd4b747af4c42469293a56cb985354e36';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

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

// Search games function
export const searchGames = async (query: string, page: number = 1): Promise<RAWGSearchResponse> => {
  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page=${page}&page_size=20`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching games:', error);
    throw error;
  }
};

// Get popular games
export const getPopularGames = async (page: number = 1): Promise<RAWGSearchResponse> => {
  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-rating&page=${page}&page_size=20`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching popular games:', error);
    throw error;
  }
};

// Get game details
export const getGameDetails = async (gameId: number): Promise<GameResult> => {
  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    throw error;
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