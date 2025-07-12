// API Status Check Service
// This service checks the status of all APIs and provides debugging information

import { Platform } from 'react-native';

interface APIStatus {
  name: string;
  hasKey: boolean;
  keyPreview: string;
  isAvailable: boolean;
  platformSupported: boolean;
  errorMessage?: string;
}

interface APIStatusReport {
  apis: APIStatus[];
  summary: {
    totalAPIs: number;
    availableAPIs: number;
    missingKeys: number;
    platformIssues: number;
  };
  recommendations: string[];
}

export const checkAPIStatus = (): APIStatusReport => {
  const apis: APIStatus[] = [];
  
  // Google Books API
  const googleBooksKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY || '';
  apis.push({
    name: 'Google Books API',
    hasKey: googleBooksKey.length > 0,
    keyPreview: googleBooksKey ? `${googleBooksKey.substring(0, 8)}...` : 'Missing',
    isAvailable: googleBooksKey.length > 0,
    platformSupported: true
  });

  // RAWG Games API
  const rawgKey = process.env.EXPO_PUBLIC_RAWG_API_KEY || '';
  apis.push({
    name: 'RAWG Games API',
    hasKey: rawgKey.length > 0,
    keyPreview: rawgKey ? `${rawgKey.substring(0, 8)}...` : 'Missing',
    isAvailable: rawgKey.length > 0 && Platform.OS !== 'web',
    platformSupported: Platform.OS !== 'web',
    errorMessage: Platform.OS === 'web' ? 'CORS issues on web platform' : undefined
  });

  // TMDB API
  const tmdbKey = process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN || process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
  apis.push({
    name: 'TMDB API (Movies/TV)',
    hasKey: tmdbKey.length > 0,
    keyPreview: tmdbKey ? `${tmdbKey.substring(0, 8)}...` : 'Missing',
    isAvailable: tmdbKey.length > 0,
    platformSupported: true
  });

  // Google Maps/Places API
  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  apis.push({
    name: 'Google Maps/Places API',
    hasKey: googleMapsKey.length > 0,
    keyPreview: googleMapsKey ? `${googleMapsKey.substring(0, 8)}...` : 'Missing',
    isAvailable: googleMapsKey.length > 0 && Platform.OS !== 'web',
    platformSupported: Platform.OS !== 'web',
    errorMessage: Platform.OS === 'web' ? 'CORS issues on web platform' : undefined
  });

  // YouTube API
  const youtubeKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
  apis.push({
    name: 'YouTube API',
    hasKey: youtubeKey.length > 0,
    keyPreview: youtubeKey ? `${youtubeKey.substring(0, 8)}...` : 'Missing',
    isAvailable: youtubeKey.length > 0,
    platformSupported: true
  });

  // Supabase
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  apis.push({
    name: 'Supabase',
    hasKey: supabaseUrl.length > 0 && supabaseKey.length > 0,
    keyPreview: supabaseKey ? `${supabaseKey.substring(0, 8)}...` : 'Missing',
    isAvailable: supabaseUrl.length > 0 && supabaseKey.length > 0,
    platformSupported: true
  });

  // Calculate summary
  const totalAPIs = apis.length;
  const availableAPIs = apis.filter(api => api.isAvailable).length;
  const missingKeys = apis.filter(api => !api.hasKey).length;
  const platformIssues = apis.filter(api => !api.platformSupported).length;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (missingKeys > 0) {
    recommendations.push(`${missingKeys} API key(s) are missing. Check your .env file.`);
  }
  
  if (platformIssues > 0) {
    recommendations.push(`${platformIssues} API(s) have platform restrictions. Consider using mock data on web.`);
  }
  
  if (Platform.OS === 'web') {
    recommendations.push('Running on web platform - some APIs may fallback to mock data due to CORS restrictions.');
  }
  
  if (availableAPIs < totalAPIs / 2) {
    recommendations.push('Most APIs are unavailable. App will primarily use mock data.');
  }

  return {
    apis,
    summary: {
      totalAPIs,
      availableAPIs,
      missingKeys,
      platformIssues
    },
    recommendations
  };
};

export const logAPIStatus = (): void => {
  const status = checkAPIStatus();
  
  console.log('=== API Status Report ===');
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Available APIs: ${status.summary.availableAPIs}/${status.summary.totalAPIs}`);
  console.log('');
  
  status.apis.forEach(api => {
    const statusIcon = api.isAvailable ? '✅' : '❌';
    const keyStatus = api.hasKey ? '🔑' : '🚫';
    console.log(`${statusIcon} ${keyStatus} ${api.name}: ${api.keyPreview}`);
    if (api.errorMessage) {
      console.log(`   ⚠️  ${api.errorMessage}`);
    }
  });
  
  if (status.recommendations.length > 0) {
    console.log('');
    console.log('📋 Recommendations:');
    status.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }
  
  console.log('========================');
};

export const getEnvironmentVariablesStatus = (): Record<string, string> => {
  return {
    'EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY': process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY || 'NOT_SET',
    'EXPO_PUBLIC_RAWG_API_KEY': process.env.EXPO_PUBLIC_RAWG_API_KEY || 'NOT_SET',
    'EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN': process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN || 'NOT_SET',
    'EXPO_PUBLIC_TMDB_API_KEY': process.env.EXPO_PUBLIC_TMDB_API_KEY || 'NOT_SET',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY': process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'NOT_SET',
    'EXPO_PUBLIC_YOUTUBE_API_KEY': process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || 'NOT_SET',
    'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT_SET',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'NOT_SET'
  };
};

export default {
  checkAPIStatus,
  logAPIStatus,
  getEnvironmentVariablesStatus
};