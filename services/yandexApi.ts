// Yandex API servisleri (artık kullanılmıyor - Google Maps'e geçildi)

const YANDEX_PLACE_API_KEY = process.env.EXPO_PUBLIC_YANDEX_PLACE_API_KEY || '';
const YANDEX_GEOCODER_API_KEY = process.env.EXPO_PUBLIC_YANDEX_GEOCODER_API_KEY || '';

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
}

export interface SearchResponse {
  results: PlaceResult[];
  total: number;
}

// Yandex Places API ile mekan arama
export async function searchPlaces(query: string, location?: [number, number]): Promise<SearchResponse> {
  try {
    console.log('Searching for:', query);
    
    // Varsayılan konum (İstanbul merkez)
    const defaultLocation = location || [41.0082, 28.9784];
    const [lat, lon] = defaultLocation;
    
    // Yandex Places API endpoint
    const url = `https://search-maps.yandex.ru/v1/?apikey=${YANDEX_PLACE_API_KEY}&text=${encodeURIComponent(query)}&ll=${lon},${lat}&spn=0.1,0.1&type=biz&lang=tr_TR&results=20`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Yandex API Response:', JSON.stringify(data, null, 2));
    
    // API yanıtını parse et
    const results: PlaceResult[] = [];
    
    if (data.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        const properties = feature.properties;
        const geometry = feature.geometry;
        
        if (properties && geometry && geometry.coordinates) {
          const [longitude, latitude] = geometry.coordinates;
          
          // Kategori bilgisini al
          const category = properties.CompanyMetaData?.Categories?.[0]?.name || 'Genel';
          
          // Çalışma saatleri bilgisini al
          const hours = properties.CompanyMetaData?.Hours;
          let workingHours = 'Bilgi yok';
          if (hours && hours.Availabilities && hours.Availabilities.length > 0) {
            const availability = hours.Availabilities[0];
            if (availability.Everyday) {
              workingHours = `${availability.TwentyFourHours ? '24 saat açık' : availability.Intervals?.[0] ? `${availability.Intervals[0].from} - ${availability.Intervals[0].to}` : 'Bilgi yok'}`;
            }
          }
          
          // Görsel bilgisini al - Yandex Static API kullanarak
          let imageUrl = undefined;
          
          // Önce CompanyMetaData'dan fotoğraf kontrolü
          if (properties.CompanyMetaData?.Photos && properties.CompanyMetaData.Photos.length > 0) {
            const photo = properties.CompanyMetaData.Photos[0];
            console.log('Photo data:', photo);
            
            if (photo.href) {
              imageUrl = photo.href;
            } else if (photo.url) {
              imageUrl = photo.url;
            } else if (typeof photo === 'string') {
              imageUrl = photo;
            }
          }
          
          // Eğer fotoğraf bulunamadıysa, imageUrl undefined olarak kalacak
          // Bu durumda UI tarafında placeholder gösterilecek
          
          console.log('Final imageUrl for', properties.name, ':', imageUrl);
          
          const result: PlaceResult = {
            id: properties.CompanyMetaData?.id || Math.random().toString(),
            name: properties.name || properties.description || 'İsimsiz Mekan',
            description: properties.description,
            address: properties.CompanyMetaData?.address || 'Adres bilgisi yok',
            coordinates: [latitude, longitude],
            category: category,
            image: imageUrl,
            rating: properties.CompanyMetaData?.rating || undefined,
            phone: properties.CompanyMetaData?.Phones?.[0]?.formatted,
            website: properties.CompanyMetaData?.url,
            workingHours: workingHours
          };
          
          results.push(result);
        }
      }
    }
    
    return {
      results: results,
      total: results.length
    };
  } catch (error) {
    console.error('Search error:', error);
    
    // Hata durumunda boş sonuç döndür
    return {
      results: [],
      total: 0
    };
  }
}

// Koordinatları adrese çevirme (Reverse Geocoding)
export async function reverseGeocode(coordinates: [number, number]): Promise<string> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_API_KEY}&geocode=${coordinates[1]},${coordinates[0]}&format=json&lang=tr_TR`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    return geoObject?.metaDataProperty?.GeocoderMetaData?.text || 'Adres bulunamadı';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Adres bulunamadı';
  }
}

// Adresi koordinatlara çevirme (Forward Geocoding)
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_API_KEY}&geocode=${encodeURIComponent(address)}&format=json&lang=tr_TR`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    const coordinates = geoObject?.Point?.pos;
    
    if (coordinates) {
      const [lon, lat] = coordinates.split(' ').map(Number);
      return [lat, lon];
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Popüler kategoriler için önceden tanımlanmış arama terimleri
export const POPULAR_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant', query: 'restaurant' },
  { id: 'cafe', name: 'Cafe', query: 'cafe' },
  { id: 'hotel', name: 'Hotel', query: 'hotel' },
  { id: 'shopping', name: 'Shopping', query: 'shopping mall' },
  { id: 'hospital', name: 'Hospital', query: 'hospital' },
  { id: 'pharmacy', name: 'Pharmacy', query: 'pharmacy' },
  { id: 'gas_station', name: 'Gas Station', query: 'gas station' },
  { id: 'bank', name: 'Bank', query: 'bank' },
  { id: 'atm', name: 'ATM', query: 'atm' },
  { id: 'park', name: 'Park', query: 'park' }
];