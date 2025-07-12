// Google Maps API servisleri
import { Platform } from 'react-native';
import { ENV } from '../config/env';

const GOOGLE_MAPS_API_KEY = ENV.GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode';

// Google Maps JavaScript API için global interface
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

// Google Maps API'nin yüklenip yüklenmediğini kontrol et
const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         window.google && 
         window.google.maps && 
         window.google.maps.places &&
         window.google.maps.places.PlacesService;
};

// Google Maps API'yi yükle
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    // Script zaten yüklenmiş mi kontrol et
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script var ama henüz yüklenmemiş olabilir
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
      return;
    }

    // Yeni script oluştur
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=tr`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Google Maps script failed to load'));
    };

    document.head.appendChild(script);
  });
};

export interface PlaceResult {
  id: string;
  name: string;
  description?: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  category: string;
  image?: string;
  rating?: number;
  phone?: string;
  website?: string;
  workingHours?: string;
  photoReference?: string;
  photos?: any[];
}

export interface SearchResponse {
  results: PlaceResult[];
  total: number;
  status?: string;
}

// Place Photo URL oluştur
export const getPlacePhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  if (!photoReference || !GOOGLE_MAPS_API_KEY) {
    return '';
  }
  return `${GOOGLE_PLACES_BASE_URL}/photo?photo_reference=${photoReference}&maxwidth=${maxWidth}&key=${GOOGLE_MAPS_API_KEY}`;
};

// Web için Places Service kullanarak arama
const searchPlacesWeb = async (query: string, location?: string): Promise<SearchResponse> => {
  await loadGoogleMapsScript();
  
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );
    
    const request: any = {
      query: query,
      language: 'tr',
      region: 'tr'
    };

    // Location varsa ekle
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      request.location = new google.maps.LatLng(lat, lng);
      request.radius = 50000; // 50km
    }
    
    service.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceResult[] = results.map((place: any) => ({
          id: place.place_id || '',
          name: place.name || '',
          description: place.types?.[0]?.replace(/_/g, ' ') || '',
          address: place.formatted_address || '',
          coordinates: [
            place.geometry?.location?.lat() || 0,
            place.geometry?.location?.lng() || 0
          ] as [number, number],
          category: place.types?.[0] || 'establishment',
          rating: place.rating || 0,
          image: place.photos?.[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : undefined,
          photos: place.photos || [],
        }));
        
        resolve({
          results: places,
          total: places.length,
          status: 'OK'
        });
      } else {
        console.error('Places search failed:', status);
        resolve({ results: [], total: 0, status: status });
      }
    });
  });
};

// Google Places Text Search
export const searchPlaces = async (query: string, location?: string): Promise<SearchResponse> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return { results: [], total: 0, status: 'MISSING_API_KEY' };
    }

    console.log(`🔍 Searching places: "${query}"`);

    // Web platformu için JavaScript API kullan
    if (Platform.OS === 'web') {
      return await searchPlacesWeb(query, location);
    }

    // Mobile platformlar için REST API kullan
    const url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json`;
    const params = new URLSearchParams({
      query: query,
      key: GOOGLE_MAPS_API_KEY,
      language: 'tr',
      region: 'tr',
    });

    if (location) {
      params.append('location', location);
      params.append('radius', '50000'); // 50km
    }

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return { results: [], total: 0, status: data.status };
    }

    const places: PlaceResult[] = (data.results || []).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      description: place.types?.[0]?.replace(/_/g, ' ') || '',
      address: place.formatted_address || place.vicinity || '',
      coordinates: [
        place.geometry?.location?.lat || 0,
        place.geometry?.location?.lng || 0
      ] as [number, number],
      category: place.types?.[0] || 'establishment',
      rating: place.rating || 0,
      image: place.photos?.[0] ? getPlacePhotoUrl(place.photos[0].photo_reference) : undefined,
      photoReference: place.photos?.[0]?.photo_reference,
      photos: place.photos || [],
    }));
    
    console.log(`✅ Found ${places.length} places`);
    
    return {
      results: places,
      total: places.length,
      status: data.status
    };
    
  } catch (error) {
    console.error('Error searching places:', error);
    return { results: [], total: 0, status: 'ERROR' };
  }
};

// Nearby Search - yakındaki mekanları bul
export const searchNearbyPlaces = async (
  latitude: number, 
  longitude: number, 
  type?: string,
  radius: number = 5000
): Promise<SearchResponse> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return { results: [], total: 0, status: 'MISSING_API_KEY' };
    }

    console.log(`🔍 Searching nearby places at ${latitude}, ${longitude}`);

    // Web için JavaScript API
    if (Platform.OS === 'web') {
      await loadGoogleMapsScript();
      
      return new Promise((resolve) => {
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        const request: any = {
          location: new google.maps.LatLng(latitude, longitude),
          radius: radius,
          language: 'tr'
        };

        if (type) {
          request.type = type;
        }
        
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places: PlaceResult[] = results.map((place: any) => ({
              id: place.place_id || '',
              name: place.name || '',
              description: place.types?.[0]?.replace(/_/g, ' ') || '',
              address: place.vicinity || '',
              coordinates: [
                place.geometry?.location?.lat() || 0,
                place.geometry?.location?.lng() || 0
              ] as [number, number],
              category: place.types?.[0] || 'establishment',
              rating: place.rating || 0,
              image: place.photos?.[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : undefined,
              photos: place.photos || [],
            }));
            
            resolve({
              results: places,
              total: places.length,
              status: 'OK'
            });
          } else {
            resolve({ results: [], total: 0, status: status });
          }
        });
      });
    }

    // Mobile için REST API
    const url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`;
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      key: GOOGLE_MAPS_API_KEY,
      language: 'tr',
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return { results: [], total: 0, status: data.status };
    }

    const places: PlaceResult[] = (data.results || []).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      description: '',
      address: place.vicinity || '',
      coordinates: [
        place.geometry?.location?.lat || 0,
        place.geometry?.location?.lng || 0
      ] as [number, number],
      category: place.types?.[0] || 'establishment',
      rating: place.rating || 0,
      image: place.photos?.[0] ? getPlacePhotoUrl(place.photos[0].photo_reference) : undefined,
      photoReference: place.photos?.[0]?.photo_reference,
      photos: place.photos || [],
    }));

    return {
      results: places,
      total: places.length,
      status: data.status
    };

  } catch (error) {
    console.error('Error searching nearby places:', error);
    return { results: [], total: 0, status: 'ERROR' };
  }
};

// Popüler mekanları keşfet
export const discoverPlaces = async (location?: string): Promise<SearchResponse> => {
  try {
    console.log('🔍 Discovering popular places...');
    
    // İstanbul'un popüler semtlerinde çeşitli kategorilerde arama yap
    const popularQueries = [
      'restoran istanbul',
      'cafe istanbul', 
      'alışveriş merkezi istanbul',
      'turistik mekan istanbul',
      'müze istanbul',
      'park istanbul',
      'eğlence merkezi istanbul',
      'sinema istanbul'
    ];

    // Rastgele bir sorgu seç
    const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
    
    // Lokasyon varsa kullan, yoksa İstanbul merkez
    const searchLocation = location || '41.0082,28.9784';
    
    const response = await searchPlaces(randomQuery, searchLocation);
    
    // Sonuçları karıştır ve çeşitlilik sağla
    if (response.results.length > 0) {
      response.results.sort(() => Math.random() - 0.5);
    }
    
    return response;

  } catch (error) {
    console.error('Error discovering places:', error);
    return { results: [], total: 0, status: 'ERROR' };
  }
};

// Place Details - Mekan detaylarını getir
export const getPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return null;
    }

    // Web için JavaScript API
    if (Platform.OS === 'web') {
      await loadGoogleMapsScript();
      
      return new Promise((resolve) => {
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );
        
        const request = {
          placeId: placeId,
          fields: [
            'place_id',
            'name', 
            'formatted_address',
            'geometry',
            'rating',
            'photos',
            'international_phone_number',
            'website',
            'opening_hours',
            'types'
          ],
          language: 'tr'
        };
        
        service.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              id: place.place_id || placeId,
              name: place.name || '',
              description: place.types?.[0]?.replace(/_/g, ' ') || '',
              address: place.formatted_address || '',
              coordinates: [
                place.geometry?.location?.lat() || 0,
                place.geometry?.location?.lng() || 0
              ] as [number, number],
              category: place.types?.[0] || 'establishment',
              rating: place.rating || 0,
              phone: place.international_phone_number,
              website: place.website,
              workingHours: place.opening_hours?.weekday_text?.join('\n'),
              image: place.photos?.[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : undefined,
              photos: place.photos || [],
            });
          } else {
            console.error('Place details request failed:', status);
            resolve(null);
          }
        });
      });
    }

    // Mobile için REST API
    const url = `${GOOGLE_PLACES_BASE_URL}/details/json`;
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      language: 'tr',
      fields: 'place_id,name,formatted_address,geometry,rating,photos,international_phone_number,website,opening_hours,types'
    });
    
    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return null;
    }

    const place = data.result;
    
    return {
      id: place.place_id,
      name: place.name,
      description: place.types?.[0]?.replace(/_/g, ' ') || '',
      address: place.formatted_address || '',
      coordinates: [
        place.geometry?.location?.lat || 0,
        place.geometry?.location?.lng || 0
      ] as [number, number],
      category: place.types?.[0] || 'establishment',
      rating: place.rating || 0,
      phone: place.international_phone_number,
      website: place.website,
      workingHours: place.opening_hours?.weekday_text?.join('\n'),
      image: place.photos?.[0] ? getPlacePhotoUrl(place.photos[0].photo_reference) : undefined,
      photoReference: place.photos?.[0]?.photo_reference,
      photos: place.photos || [],
    };

  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};

// Geocoding - Adres ile koordinat bulma
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return null;
    }

    // Web için JavaScript API
    if (Platform.OS === 'web') {
      await loadGoogleMapsScript();
      
      return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode(
          {
            address: address,
            language: 'tr'
          },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              resolve({
                lat: location.lat(),
                lng: location.lng()
              });
            } else {
              console.error('Geocoding failed:', status);
              resolve(null);
            }
          }
        );
      });
    }

    // Mobile için REST API
    const url = `${GOOGLE_GEOCODING_BASE_URL}/json`;
    const params = new URLSearchParams({
      address: address,
      key: GOOGLE_MAPS_API_KEY,
      language: 'tr',
    });
    
    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Geocoding API error:', data.status);
      return null;
    }

    const location = data.results[0]?.geometry?.location;
    return location ? { lat: location.lat, lng: location.lng } : null;

  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};