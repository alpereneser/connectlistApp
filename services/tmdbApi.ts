// TMDB API servisleri
import { Platform } from 'react-native';
import { ENV } from '../config/env';

const TMDB_API_KEY = ENV.TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = ENV.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Mock data for fallback
const MOCK_MOVIES: MovieResult[] = [
  {
    id: 1,
    title: 'Inception',
    overview: 'A skilled thief who steals corporate secrets through dream-sharing technology',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    release_date: '2010-07-16',
    vote_average: 8.8,
    vote_count: 35000,
    genre_ids: [28, 878, 53],
    adult: false,
    original_language: 'en',
    original_title: 'Inception',
    popularity: 150.5,
    video: false
  },
  {
    id: 2,
    title: 'The Dark Knight',
    overview: 'Batman faces the Joker in this epic superhero thriller',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    release_date: '2008-07-18',
    vote_average: 9.0,
    vote_count: 28500,
    genre_ids: [28, 80, 18],
    adult: false,
    original_language: 'en',
    original_title: 'The Dark Knight',
    popularity: 180.2,
    video: false
  }
];

const MOCK_TV_SHOWS: TVShowResult[] = [
  {
    id: 1,
    name: 'Game of Thrones',
    overview: 'Nine noble families fight for control over the lands of Westeros',
    poster_path: '/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
    backdrop_path: '/mUkuc2wyV9dHLG0D0Loaw5pO2s8.jpg',
    first_air_date: '2011-04-17',
    vote_average: 9.3,
    vote_count: 22100,
    genre_ids: [18, 10759, 10765],
    adult: false,
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Game of Thrones',
    popularity: 369.594
  },
  {
    id: 2,
    name: 'Breaking Bad',
    overview: 'A high school chemistry teacher turned methamphetamine manufacturer',
    poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    first_air_date: '2008-01-20',
    vote_average: 9.5,
    vote_count: 18500,
    genre_ids: [18, 80],
    adult: false,
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Breaking Bad',
    popularity: 400.123
  }
];

const MOCK_PEOPLE: PersonResult[] = [
  {
    id: 1,
    name: 'Leonardo DiCaprio',
    profile_path: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg',
    adult: false,
    popularity: 45.654,
    known_for_department: 'Acting',
    known_for: []
  },
  {
    id: 2,
    name: 'Scarlett Johansson',
    profile_path: '/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg',
    adult: false,
    popularity: 78.321,
    known_for_department: 'Acting',
    known_for: []
  }
];

export interface MovieResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface TVShowResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
}

export interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  known_for_department: string;
  known_for: (MovieResult | TVShowResult)[];
}

export interface TMDBSearchResponse {
  page: number;
  results: (MovieResult | TVShowResult | PersonResult)[];
  total_pages: number;
  total_results: number;
}

export interface CategorizedResults {
  movies: MovieResult[];
  tvShows: TVShowResult[];
  people: PersonResult[];
  total: number;
}

// TMDB API headers
const getHeaders = () => ({
  'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
  'Content-Type': 'application/json;charset=utf-8'
});

// Genel arama (multi search) with fallback
export async function searchMulti(query: string, page: number = 1): Promise<CategorizedResults> {
  try {
    console.log('TMDB Multi Search for:', query);
    
    // If no API key, return mock data
    if (!TMDB_READ_ACCESS_TOKEN && !TMDB_API_KEY) {
      console.warn('TMDB API key missing, using mock data');
      const filteredMovies = MOCK_MOVIES.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.overview.toLowerCase().includes(query.toLowerCase())
      );
      const filteredTVShows = MOCK_TV_SHOWS.filter(show => 
        show.name.toLowerCase().includes(query.toLowerCase()) ||
        show.overview.toLowerCase().includes(query.toLowerCase())
      );
      const filteredPeople = MOCK_PEOPLE.filter(person => 
        person.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        movies: filteredMovies.length > 0 ? filteredMovies : MOCK_MOVIES,
        tvShows: filteredTVShows.length > 0 ? filteredTVShows : MOCK_TV_SHOWS,
        people: filteredPeople.length > 0 ? filteredPeople : MOCK_PEOPLE,
        total: filteredMovies.length + filteredTVShows.length + filteredPeople.length
      };
    }
    
    const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error(`TMDB API request failed: ${response.status}`);
      // Return mock data on API error
      const filteredMovies = MOCK_MOVIES.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      const filteredTVShows = MOCK_TV_SHOWS.filter(show => 
        show.name.toLowerCase().includes(query.toLowerCase())
      );
      return {
        movies: filteredMovies.length > 0 ? filteredMovies : MOCK_MOVIES,
        tvShows: filteredTVShows.length > 0 ? filteredTVShows : MOCK_TV_SHOWS,
        people: MOCK_PEOPLE,
        total: filteredMovies.length + filteredTVShows.length + MOCK_PEOPLE.length
      };
    }
    
    const data: TMDBSearchResponse = await response.json();
    console.log('TMDB API Response:', JSON.stringify(data, null, 2));
    
    // Sonuçları kategorilere ayır
    const movies: MovieResult[] = [];
    const tvShows: TVShowResult[] = [];
    const people: PersonResult[] = [];
    
    data.results.forEach((item: any) => {
      if (item.media_type === 'movie') {
        movies.push(item as MovieResult);
      } else if (item.media_type === 'tv') {
        tvShows.push(item as TVShowResult);
      } else if (item.media_type === 'person') {
        people.push(item as PersonResult);
      }
    });
    
    return {
      movies,
      tvShows,
      people,
      total: data.total_results
    };
  } catch (error) {
    console.error('TMDB Search error:', error);
    
    // Return mock data on any error
    const filteredMovies = MOCK_MOVIES.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
    const filteredTVShows = MOCK_TV_SHOWS.filter(show => 
      show.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      movies: filteredMovies.length > 0 ? filteredMovies : MOCK_MOVIES,
      tvShows: filteredTVShows.length > 0 ? filteredTVShows : MOCK_TV_SHOWS,
      people: MOCK_PEOPLE,
      total: filteredMovies.length + filteredTVShows.length + MOCK_PEOPLE.length
    };
  }
}

// Sadece film arama with fallback
export async function searchMovies(query: string, page: number = 1): Promise<MovieResult[]> {
  try {
    // If no API key, return mock data
    if (!TMDB_READ_ACCESS_TOKEN && !TMDB_API_KEY) {
      console.warn('TMDB API key missing, using mock movies');
      const filtered = MOCK_MOVIES.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.length > 0 ? filtered : MOCK_MOVIES;
    }
    
    const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error(`TMDB Movies API request failed: ${response.status}`);
      const filtered = MOCK_MOVIES.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.length > 0 ? filtered : MOCK_MOVIES;
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Movies Search error:', error);
    const filtered = MOCK_MOVIES.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.length > 0 ? filtered : MOCK_MOVIES;
  }
}

// Sadece TV show arama
export async function searchTVShows(query: string, page: number = 1): Promise<TVShowResult[]> {
  try {
    const url = `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB TV Shows API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB TV Shows Search error:', error);
    return [];
  }
}

// Sadece kişi arama
export async function searchPeople(query: string, page: number = 1): Promise<PersonResult[]> {
  try {
    const url = `${TMDB_BASE_URL}/search/person?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB People API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB People Search error:', error);
    return [];
  }
}

// Görsel URL'si oluşturma
export function getImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Film/TV show detayları alma
export async function getMovieDetails(movieId: number) {
  try {
    const url = `${TMDB_BASE_URL}/movie/${movieId}?language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB Movie Details API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TMDB Movie Details error:', error);
    return null;
  }
}

export async function getTVShowDetails(tvId: number) {
  try {
    const url = `${TMDB_BASE_URL}/tv/${tvId}?language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB TV Show Details API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TMDB TV Show Details error:', error);
    return null;
  }
}

export async function getPersonDetails(personId: number) {
  try {
    const url = `${TMDB_BASE_URL}/person/${personId}?language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB Person Details API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TMDB Person Details error:', error);
    return null;
  }
}

// Popüler kategoriler
export const TMDB_CATEGORIES = [
  { id: 'popular_movies', name: 'Popular Movies', query: 'popular', type: 'movie' },
  { id: 'popular_tv', name: 'Popular TV Shows', query: 'popular', type: 'tv' },
  { id: 'trending', name: 'Trending', query: 'trending', type: 'all' },
  { id: 'action', name: 'Action', query: 'action', type: 'movie' },
  { id: 'comedy', name: 'Comedy', query: 'comedy', type: 'movie' },
  { id: 'drama', name: 'Drama', query: 'drama', type: 'movie' }
];