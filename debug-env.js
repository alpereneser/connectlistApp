// Debug script to check environment variables
// Run with: node debug-env.js

console.log('=== Environment Variables Debug ===');
console.log('Node.js process.env check:');

const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_TMDB_API_KEY',
  'EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN',
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
  'EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY',
  'EXPO_PUBLIC_RAWG_API_KEY',
  'EXPO_PUBLIC_YOUTUBE_API_KEY'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const preview = value ? `${value.substring(0, 20)}...` : 'NOT_SET';
  console.log(`${status} ${varName}: ${preview}`);
});

console.log('\n=== .env file check ===');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env file exists and contains:');
  
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`   ${key}`);
  });
  
} catch (error) {
  console.log('❌ .env file not found or cannot be read');
  console.log('Error:', error.message);
}

console.log('\n=== Instructions ===');
console.log('1. Make sure the .env file is in the project root');
console.log('2. Restart the Expo development server after changes');
console.log('3. Environment variables must start with EXPO_PUBLIC_ to be available in React Native');
console.log('========================================');