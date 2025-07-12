# Google Places API Setup Guide

## Overview
The ConnectList app uses Google Places API for location search and discovery features. Due to CORS restrictions, the API requires special handling for web platforms.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your app's domains/bundle IDs for security

### 2. Add the API Key to Your Environment

Add the following to your `.env` file:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Current Implementation

The app includes a fallback system:

1. **With API Key**: Full Google Places functionality
2. **Without API Key**: Mock data for development/testing

The `googlePlacesProxy.ts` service handles:
- Direct API calls for native apps
- CORS proxy for web (if needed)
- Mock data fallback when no API key is present

### 4. CORS Issues and Solutions

For web platforms, Google Places API doesn't allow direct browser requests due to CORS. Solutions:

1. **Development**: The app uses mock data when no API key is present
2. **Production**: Consider these options:
   - Use a backend proxy server
   - Implement the Maps JavaScript API with Places library
   - Use a CORS proxy service (temporary solution)

### 5. Mock Data

When no API key is configured, the app shows sample places including:
- Central Park Coffee (Cafe)
- The Italian Corner (Restaurant)
- Times Square Cinema (Movie Theater)
- Brooklyn Bridge Park (Park)
- MoMA - Museum of Modern Art (Museum)

This allows development and testing without API credentials.

## Troubleshooting

### "Google Maps API key is missing" warning
- This is expected if you haven't added the API key to `.env`
- The app will use mock data instead

### No search results appearing
1. Check browser console for errors
2. Verify API key is correctly set in `.env`
3. Ensure you've restarted the Expo server after adding the key
4. Check if the API key has proper permissions

### CORS errors in browser
- This is expected behavior for Google Places API
- The proxy service or mock data will be used automatically

## Best Practices

1. **Never commit API keys** to version control
2. **Restrict API keys** to specific domains/apps in Google Cloud Console
3. **Monitor usage** to avoid unexpected charges
4. **Use mock data** during development to save API quota

## Alternative Solutions

If Google Places API doesn't meet your needs, consider:
1. OpenStreetMap with Nominatim API (free, no API key required)
2. Mapbox Places API
3. Here Places API
4. Foursquare Places API

Each has different pricing, features, and CORS policies.