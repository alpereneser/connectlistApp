// Environment configuration
// This file provides a centralized way to manage environment variables

// Development fallback configuration (for development only)
const DEVELOPMENT_FALLBACK_CONFIG = {
  SUPABASE_URL: 'https://ikalabbzbdbfuxpbiazz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYWxhYmJ6YmRiZnV4cGJpYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDkxMTIsImV4cCI6MjA2NjI4NTExMn0.VptwNkqalA8hfBqasy943wx5kKezkd_Wx7UbN-80YA4',
  TMDB_API_KEY: '',  // Use environment variable
  TMDB_READ_ACCESS_TOKEN: '',  // Use environment variable
  GOOGLE_MAPS_API_KEY: '',  // Use environment variable
  GOOGLE_BOOKS_API_KEY: '',  // Use environment variable
  RAWG_API_KEY: '',  // Use environment variable
  YOUTUBE_API_KEY: ''  // Use environment variable
};

// Function to get environment variable with fallback
function getEnvVar(key: keyof typeof DEVELOPMENT_FALLBACK_CONFIG): string {
  // Try to get from process.env first
  const envKey = `EXPO_PUBLIC_${key}`;
  const envValue = process.env[envKey];
  
  // Debug log for each environment variable (only in development)
  if (__DEV__) {
    console.log(`🔍 Checking ${envKey}:`, {
      envValue: envValue ? `${envValue.substring(0, 15)}...` : 'undefined',
      isPlaceholder: envValue === 'your-api-key' || envValue === 'your-google-maps-api-key'
    });
  }
  
  // In production, require environment variables
  if (!__DEV__) {
    if (!envValue || envValue === 'your-api-key' || envValue === 'your-google-maps-api-key') {
      console.error(`❌ Missing required environment variable: ${envKey}`);
      throw new Error(`Missing required environment variable: ${envKey}`);
    }
    return envValue;
  }
  
  // In development, use env var if available, otherwise fallback
  if (envValue && envValue !== 'your-api-key' && envValue !== 'your-google-maps-api-key') {
    console.log(`✅ Using environment variable for ${key}`);
    return envValue;
  }
  
  // Fallback to development config (only in development)
  const fallbackValue = DEVELOPMENT_FALLBACK_CONFIG[key];
  console.log(`📝 Using development fallback for ${key}: ${fallbackValue ? `${fallbackValue.substring(0, 10)}...` : 'NOT_SET'}`);
  
  return fallbackValue || '';
}

// Export all environment variables
export const ENV = {
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
  TMDB_API_KEY: getEnvVar('TMDB_API_KEY'),
  TMDB_READ_ACCESS_TOKEN: getEnvVar('TMDB_READ_ACCESS_TOKEN'),
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY'),
  GOOGLE_BOOKS_API_KEY: getEnvVar('GOOGLE_BOOKS_API_KEY'),
  RAWG_API_KEY: getEnvVar('RAWG_API_KEY'),
  YOUTUBE_API_KEY: getEnvVar('YOUTUBE_API_KEY')
};

// Debug function to check all environment variables
export const logEnvironmentStatus = () => {
  if (__DEV__) {
    console.log('🔧 Environment Variables Status:');
    Object.entries(ENV).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const preview = value ? `${value.substring(0, 15)}...` : 'NOT_SET';
      console.log(`${status} ${key}: ${preview}`);
    });
  }
};

export default ENV;