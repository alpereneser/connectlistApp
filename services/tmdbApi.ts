// TMDB API servisleri

const TMDB_API_KEY = '378b6eb3c69f21d0815d31c4bf5f19a4';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzhiNmViM2M2OWYyMWQwODE1ZDMxYzRiZjVmMTlhNCIsIm5iZiI6MTcxODY4NjkyNC41MjQ5OTk5LCJzdWIiOiI2NjcxMTRjY2Y4NDhiMmQ1NTM2YWE5YTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.4E-BfHAbJT4XgMJF9mG9OM4Rc3XdGzbd5n47acQ3tKw';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

// Genel arama (multi search)
export async function searchMulti(query: string, page: number = 1): Promise<CategorizedResults> {
  try {
    console.log('TMDB Multi Search for:', query);
    
    const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB API request failed: ${response.status}`);
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
    
    return {
      movies: [],
      tvShows: [],
      people: [],
      total: 0
    };
  }
}

// Sadece film arama
export async function searchMovies(query: string, page: number = 1): Promise<MovieResult[]> {
  try {
    const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=tr-TR`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`TMDB Movies API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('TMDB Movies Search error:', error);
    return [];
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