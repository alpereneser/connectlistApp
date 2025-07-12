// Test environment variables loading
console.log('=== Environment Variables Test ===');

// Test direct process.env access
console.log('Direct process.env access:');
console.log('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'LOADED' : 'NOT_LOADED');
console.log('EXPO_PUBLIC_TMDB_API_KEY:', process.env.EXPO_PUBLIC_TMDB_API_KEY ? 'LOADED' : 'NOT_LOADED');

// Import and test our config
try {
  // For Node.js environment, we'll simulate the config
  const DEVELOPMENT_CONFIG = {
    SUPABASE_URL: 'https://ikalabbzbdbfuxpbiazz.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYWxhYmJ6YmRiZnV4cGJpYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDkxMTIsImV4cCI6MjA2NjI4NTExMn0.VptwNkqalA8hfBqasy943wx5kKezkd_Wx7UbN-80YA4',
    TMDB_API_KEY: '378b6eb3c69f21d0815d31c4bf5f19a4',
    TMDB_READ_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNzhiNmViM2M2OWYyMWQwODE1ZDMxYzRiZjVmMTlhNCIsIm5iZiI6MTcxODY4NjkyNC41MjQ5OTk5LCJzdWIiOiI2NjcxMTRjY2Y4NDhiMmQ1NTM2YWE5YTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.4E-BfHAbJT4XgMJF9mG9OM4Rc3XdGzbd5n47acQ3tKw',
    GOOGLE_MAPS_API_KEY: 'AIzaSyCEQZ1ri472vtTCiexDsriTKZTIPQoRJkY',
    GOOGLE_BOOKS_API_KEY: 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w',
    RAWG_API_KEY: 'd4b747af4c42469293a56cb985354e36',
    YOUTUBE_API_KEY: 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w'
  };

  console.log('\nFallback config test:');
  Object.entries(DEVELOPMENT_CONFIG).forEach(([key, value]) => {
    console.log(`${key}: ${value.substring(0, 15)}...`);
  });

} catch (error) {
  console.error('Error testing config:', error);
}

console.log('\n=== Test completed ===');