// Test environment variables loading
require('dotenv').config();

console.log('=== Environment Variables Security Test ===');

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
  'EXPO_PUBLIC_TMDB_API_KEY',
  'EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY',
  'EXPO_PUBLIC_RAWG_API_KEY',
  'EXPO_PUBLIC_YOUTUBE_API_KEY'
];

console.log('Environment Variable Status:');
REQUIRED_ENV_VARS.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✅ LOADED' : '❌ MISSING';
  const preview = value ? `${value.substring(0, 10)}...` : 'NOT_SET';
  console.log(`${status} ${envVar}: ${preview}`);
});

// Check for security issues
console.log('\n=== Security Check ===');
const securityIssues = [];

REQUIRED_ENV_VARS.forEach(envVar => {
  const value = process.env[envVar];
  if (!value) {
    securityIssues.push(`Missing required environment variable: ${envVar}`);
  } else if (value === 'your-api-key' || value === 'your_api_key') {
    securityIssues.push(`Placeholder value found in ${envVar}`);
  }
});

if (securityIssues.length === 0) {
  console.log('✅ All environment variables are properly configured');
} else {
  console.log('❌ Security issues found:');
  securityIssues.forEach(issue => console.log(`  - ${issue}`));
}

console.log('\n=== Test completed ===');