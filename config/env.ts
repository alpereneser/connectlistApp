// Environment configuration
// This file provides a centralized way to manage environment variables

// Production API keys (from .env file)
const PRODUCTION_CONFIG = {
  SUPABASE_URL: 'https://ikalabbzbdbfuxpbiazz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYWxhYmJ6YmRiZnV4cGJpYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDkxMTIsImV4cCI6MjA2NjI4NTExMn0.VptwNkqalA8hfBqasy943wx5kKezkd_Wx7UbN-80YA4',
  TMDB_API_KEY: '378b6eb3c69f21d0815d31c4bf5f19a4',
  TMDB_READ_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzhiNmViM2M2OWYyMWQwODE1ZDMxYzRiZjVmMTlhNCIsIm5iZiI6MTcxODY4NjkyNC41MjQ5OTk5LCJzdWIiOiI2NjcxMTRjY2Y4NDhiMmQ1NTM2YWE5YTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.4E-BfHAbJT4XgMJF9mG9OM4Rc3XdGzbd5n47acQ3tKw',
  GOOGLE_MAPS_API_KEY: 'AIzaSyCEQZ1ri472vtTCiexDsriTKZTIPQoRJkY',
  GOOGLE_BOOKS_API_KEY: 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w',
  RAWG_API_KEY: 'd4b747af4c42469293a56cb985354e36',
  YOUTUBE_API_KEY: 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w'
};

// Function to get environment variable with fallback
function getEnvVar(key: keyof typeof PRODUCTION_CONFIG): string {
  // Try to get from process.env first
  const envKey = `EXPO_PUBLIC_${key}`;
  const envValue = process.env[envKey];
  
  // Debug log for each environment variable
  if (__DEV__) {
    console.log(`🔍 Checking ${envKey}:`, {
      envValue: envValue ? `${envValue.substring(0, 15)}...` : 'undefined',
      isPlaceholder: envValue === 'your-api-key' || envValue === 'your-google-maps-api-key'
    });
  }
  
  if (envValue && envValue !== 'your-api-key' && envValue !== 'your-google-maps-api-key') {
    if (__DEV__) {
      console.log(`✅ Using environment variable for ${key}`);
    }
    return envValue;
  }
  
  // Fallback to production config (reliable keys)
  const prodValue = PRODUCTION_CONFIG[key];
  
  if (__DEV__) {
    console.log(`📝 Using production config for ${key}: ${prodValue ? `${prodValue.substring(0, 10)}...` : 'NOT_SET'}`);
  }
  
  return prodValue || '';
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