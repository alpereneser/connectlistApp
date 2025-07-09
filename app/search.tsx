import React from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { MagnifyingGlass, MapPin, Star, Clock, FilmStrip, Television, User, GameController, Book } from 'phosphor-react-native';
import { searchPlaces, PlaceResult, POPULAR_CATEGORIES } from '../services/yandexApi';
import { searchMulti, CategorizedResults, MovieResult, TVShowResult, PersonResult, getImageUrl, TMDB_CATEGORIES } from '../services/tmdbApi';
import { searchGames, getGameImageUrl, RAWG_CATEGORIES, GameResult, formatGameReleaseDate, getPlatformNames } from '../services/rawgApi';
import { searchBooks, getBookImageUrl, GOOGLE_BOOKS_CATEGORIES, BookResult, formatBookPublicationDate, getAuthorsString } from '../services/googleBooksApi';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [tmdbResults, setTmdbResults] = useState<CategorizedResults>({ movies: [], tvShows: [], people: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'places' | 'movies' | 'tv' | 'people' | 'games' | 'books'>('all');
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  
  // Discover states
  const [discoverData, setDiscoverData] = useState({
    places: [] as PlaceResult[],
    movies: [] as MovieResult[],
    tvShows: [] as TVShowResult[],
    people: [] as PersonResult[],
    games: [] as GameResult[],
    books: [] as BookResult[]
  });
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);

  const handleTabPress = (tab: string) => {
    if (tab === 'home') {
      router.push('/');
    } else if (tab === 'search') {
      // Already on search page, do nothing
    } else if (tab === 'discover') {
      router.push('/discover');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else if (tab === 'add') {
      router.push('/create');
    }
  };

  // Load discover content on component mount and when active category changes
  useEffect(() => {
    loadDiscoverContent();
  }, [activeCategory]);

  const loadDiscoverContent = async () => {
    setIsLoadingDiscover(true);
    try {
      // Random search terms for varied content
      const placeTerms = ['restaurant', 'cafe', 'hotel', 'park', 'museum', 'shopping', 'bar', 'gym', 'hospital', 'bank', 'library', 'pharmacy', 'cinema', 'theater', 'stadium', 'airport', 'school', 'market', 'bakery', 'gallery'];
      const movieTerms = ['action', 'comedy', 'drama', 'thriller', 'adventure', 'romance', 'sci-fi', 'horror', 'animation', 'documentary', 'fantasy', 'crime', 'war', 'western', 'musical', 'biography', 'mystery', 'family', 'superhero', 'indie'];
      const gameTerms = ['action', 'adventure', 'rpg', 'strategy', 'racing', 'sports', 'indie', 'puzzle', 'shooter', 'platformer', 'simulation', 'fighting', 'horror', 'arcade', 'casual', 'mmorpg', 'survival', 'sandbox', 'rhythm', 'card'];
      const bookTerms = ['fiction', 'mystery', 'romance', 'thriller', 'science', 'history', 'biography', 'fantasy', 'horror', 'business', 'self-help', 'cooking', 'travel', 'poetry', 'philosophy', 'psychology', 'health', 'technology', 'art', 'education'];
      
      // Get random terms for each category
      const randomPlace = placeTerms[Math.floor(Math.random() * placeTerms.length)];
      const randomMovie = movieTerms[Math.floor(Math.random() * movieTerms.length)];
      const randomGame = gameTerms[Math.floor(Math.random() * gameTerms.length)];
      const randomBook = bookTerms[Math.floor(Math.random() * bookTerms.length)];
      
      // Load random content from all categories
      const [placesResponse, tmdbResponse, gamesResponse, booksResponse] = await Promise.all([
        searchPlaces(randomPlace),
        searchMulti(randomMovie),
        searchGames(randomGame),
        searchBooks(randomBook)
      ]);
      
      // Randomize slice positions for variety
      const placeStart = Math.floor(Math.random() * Math.max(1, placesResponse.results.length - 6));
      const movieStart = Math.floor(Math.random() * Math.max(1, tmdbResponse.movies.length - 6));
      const tvStart = Math.floor(Math.random() * Math.max(1, tmdbResponse.tvShows.length - 6));
      const peopleStart = Math.floor(Math.random() * Math.max(1, tmdbResponse.people.length - 6));
      const gameStart = Math.floor(Math.random() * Math.max(1, (gamesResponse.results?.length || 0) - 6));
      const bookStart = Math.floor(Math.random() * Math.max(1, (booksResponse.items?.length || 0) - 6));
      
      setDiscoverData({
        places: placesResponse.results.slice(placeStart, placeStart + 6),
        movies: tmdbResponse.movies.slice(movieStart, movieStart + 6),
        tvShows: tmdbResponse.tvShows.slice(tvStart, tvStart + 6),
        people: tmdbResponse.people.slice(peopleStart, peopleStart + 6),
        games: gamesResponse.results?.slice(gameStart, gameStart + 6) || [],
        books: booksResponse.items?.slice(bookStart, bookStart + 6) || []
      });
    } catch (error) {
      console.error('Discover content load error:', error);
    } finally {
      setIsLoadingDiscover(false);
    }
  };

  const handlePlacePress = (place: PlaceResult) => {
    // Place verisini query parametresi olarak geçir
    const placeData = encodeURIComponent(JSON.stringify(place));
    router.push(`/details/${place.id}?data=${placeData}`);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTmdbResults({ movies: [], tvShows: [], people: [], total: 0 });
      setGameResults([]);
      setBookResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Paralel olarak mekan, TMDB, RAWG ve Google Books araması yap
      const [placesResponse, tmdbResponse, gamesResponse, booksResponse] = await Promise.all([
        searchPlaces(query),
        searchMulti(query),
        searchGames(query),
        searchBooks(query)
      ]);
      
      setSearchResults(placesResponse.results);
      setTmdbResults(tmdbResponse);
      setGameResults(gamesResponse.results || []);
      setBookResults(booksResponse.items || []);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setTmdbResults({ movies: [], tvShows: [], people: [], total: 0 });
      setGameResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (category: { id: string; name: string; query: string }) => {
    const queryString = String(category.query || '');
    setSearchQuery(queryString);
    handleSearch(queryString);
  };

  const handleTMDBCategoryPress = (category: { id: string; name: string; query: string; type: string }) => {
    const queryString = String(category.query || '');
    setSearchQuery(queryString);
    handleSearch(queryString);
  };

  const handleMoviePress = (movie: MovieResult) => {
    const movieData = encodeURIComponent(JSON.stringify({ ...movie, type: 'movie' }));
    router.push(`/details/movie/${movie.id}?data=${movieData}`);
  };

  const handleTVShowPress = (tvShow: TVShowResult) => {
    const tvData = encodeURIComponent(JSON.stringify({ ...tvShow, type: 'tv' }));
    router.push(`/details/tv/${tvShow.id}?data=${tvData}`);
  };

  const handlePersonPress = (person: PersonResult) => {
    const personData = encodeURIComponent(JSON.stringify({ ...person, type: 'person' }));
    router.push(`/details/person/${person.id}?data=${personData}`);
  };

  const handleGamePress = (game: GameResult) => {
    const gameData = encodeURIComponent(JSON.stringify({ ...game, type: 'game' }));
    router.push(`/details/game/${game.id}?data=${gameData}`);
  };

  const handleBookPress = (book: BookResult) => {
    const bookData = encodeURIComponent(JSON.stringify({ ...book, type: 'book' }));
    router.push(`/details/book/${book.id}?data=${bookData}`);
  };

  const [failedImages, setFailedImages] = React.useState<Set<string>>(new Set());

  const renderPlaceItem = (place: PlaceResult) => {
    const shouldShowImage = place.image && !failedImages.has(place.id);
    
    return (
      <TouchableOpacity 
        key={place.id} 
        style={styles.placeItem}
        onPress={() => handlePlacePress(place)}
      >
        <View style={styles.placeImageContainer}>
          {shouldShowImage ? (
            <Image 
              source={{ uri: place.image }} 
              style={[styles.placeImage, { backgroundColor: '#F3F4F6' }]}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image load error for:', place.name, 'URL:', place.image, error.nativeEvent?.error);
                setFailedImages(prev => new Set(prev).add(place.id));
              }}
              onLoad={() => {
                console.log('Image loaded successfully for:', place.name, 'URL:', place.image);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MapPin size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
      
      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>{String(place.name || '')}</Text>
        <Text style={styles.placeCategory} numberOfLines={1}>{String(place.category || '')}</Text>
        <Text style={styles.placeAddress} numberOfLines={2}>{String(place.address || '')}</Text>
        
        {place.rating && (
          <View style={styles.ratingContainer}>
            <Star size={14} color="#F59E0B" weight="fill" />
            <Text style={styles.ratingText}>{String(place.rating || '')}</Text>
          </View>
        )}
        
        {place.workingHours && (
          <View style={styles.hoursContainer}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.hoursText} numberOfLines={1}>{String(place.workingHours || '')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const renderMovieItem = (movie: MovieResult) => {
    const imageUrl = getImageUrl(movie.poster_path);
    
    return (
      <TouchableOpacity 
        key={`movie-${movie.id}`} 
        style={styles.mediaItem}
        onPress={() => handleMoviePress(movie)}
      >
        <View style={styles.mediaImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderMediaImage}>
              <FilmStrip size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle} numberOfLines={2}>{movie.title}</Text>
          <Text style={styles.mediaSubtitle}>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</Text>
          {movie.vote_average > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={12} color="#F59E0B" weight="fill" />
              <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTVShowItem = (tvShow: TVShowResult) => {
    const imageUrl = getImageUrl(tvShow.poster_path);
    
    return (
      <TouchableOpacity 
        key={`tv-${tvShow.id}`} 
        style={styles.mediaItem}
        onPress={() => handleTVShowPress(tvShow)}
      >
        <View style={styles.mediaImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderMediaImage}>
              <Television size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle} numberOfLines={2}>{tvShow.name}</Text>
          <Text style={styles.mediaSubtitle}>{tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'Unknown'}</Text>
          {tvShow.vote_average > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={12} color="#F59E0B" weight="fill" />
              <Text style={styles.ratingText}>{tvShow.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPersonItem = (person: PersonResult) => {
    const imageUrl = getImageUrl(person.profile_path);
    
    return (
      <TouchableOpacity 
        key={`person-${person.id}`} 
        style={styles.mediaItem}
        onPress={() => handlePersonPress(person)}
      >
        <View style={styles.mediaImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderMediaImage}>
              <User size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTitle} numberOfLines={2}>{person.name}</Text>
          <Text style={styles.mediaSubtitle}>{person.known_for_department}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGameItem = (game: GameResult) => {
     const imageUrl = getGameImageUrl(game.background_image);
     
     return (
       <TouchableOpacity 
         key={`game-${game.id}`} 
         style={styles.mediaItem}
         onPress={() => handleGamePress(game)}
       >
         <View style={styles.mediaImageContainer}>
           {imageUrl ? (
             <Image 
               source={{ uri: imageUrl }} 
               style={styles.mediaImage}
               resizeMode="cover"
             />
           ) : (
             <View style={styles.placeholderMediaImage}>
               <GameController size={24} color="#9CA3AF" />
             </View>
           )}
         </View>
         <View style={styles.mediaInfo}>
           <Text style={styles.mediaTitle} numberOfLines={2}>{game.name}</Text>
           <Text style={styles.mediaSubtitle}>{getPlatformNames(game.platforms)}</Text>
           <Text style={styles.mediaSubtitle}>{formatGameReleaseDate(game.released)}</Text>
           {game.rating > 0 && (
             <View style={styles.ratingContainer}>
               <Star size={12} color="#F59E0B" weight="fill" />
               <Text style={styles.ratingText}>{game.rating.toFixed(1)}</Text>
             </View>
           )}
         </View>
       </TouchableOpacity>
     );
   };

   const renderBookItem = (book: BookResult) => {
     const imageUrl = getBookImageUrl(book.volumeInfo.imageLinks);
     
     return (
       <TouchableOpacity 
         key={`book-${book.id}`} 
         style={styles.mediaItem}
         onPress={() => handleBookPress(book)}
       >
         <View style={styles.mediaImageContainer}>
           {imageUrl ? (
             <Image 
               source={{ uri: imageUrl }} 
               style={styles.mediaImage}
               resizeMode="cover"
             />
           ) : (
             <View style={styles.placeholderMediaImage}>
               <Book size={24} color="#9CA3AF" />
             </View>
           )}
         </View>
         <View style={styles.mediaInfo}>
           <Text style={styles.mediaTitle} numberOfLines={2}>{book.volumeInfo.title}</Text>
           <Text style={styles.mediaSubtitle}>{getAuthorsString(book.volumeInfo.authors)}</Text>
           <Text style={styles.mediaSubtitle}>{formatBookPublicationDate(book.volumeInfo.publishedDate)}</Text>
           {book.volumeInfo.averageRating && book.volumeInfo.averageRating > 0 && (
             <View style={styles.ratingContainer}>
               <Star size={12} color="#F59E0B" weight="fill" />
               <Text style={styles.ratingText}>{book.volumeInfo.averageRating.toFixed(1)}</Text>
             </View>
           )}
         </View>
       </TouchableOpacity>
     );
   };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All', icon: MagnifyingGlass },
          { key: 'places', label: 'Places', icon: MapPin },
          { key: 'movies', label: 'Movies', icon: FilmStrip },
          { key: 'tv', label: 'TV Shows', icon: Television },
          { key: 'people', label: 'People', icon: User },
          { key: 'games', label: 'Games', icon: GameController },
          { key: 'books', label: 'Books', icon: Book }
        ].map((category) => {
          const IconComponent = category.icon;
          const isActive = activeCategory === category.key;
          
          return (
            <TouchableOpacity
              key={category.key}
              style={[styles.categoryFilterItem, isActive && styles.categoryFilterItemActive]}
              onPress={() => setActiveCategory(category.key as any)}
            >
              <IconComponent 
                size={16} 
                color={isActive ? '#FFFFFF' : '#6B7280'} 
                weight={isActive ? 'fill' : 'regular'}
              />
              <Text style={[styles.categoryFilterText, isActive && styles.categoryFilterTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCategories = () => {
     // Combine Yandex, TMDB, RAWG, and Google Books categories
     const allCategories = [
       ...POPULAR_CATEGORIES.slice(0, 2),
       ...TMDB_CATEGORIES.slice(0, 2),
       ...RAWG_CATEGORIES.slice(0, 2),
       ...GOOGLE_BOOKS_CATEGORIES.slice(0, 3)
     ];

    return (
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Popular Categories</Text>
        <View style={styles.categoriesGrid}>
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleSearch(category.query || category.name)}
            >
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDiscoverSection = (title: string, items: any[], renderItem: (item: any) => React.ReactNode, viewAllAction?: () => void) => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.discoverSection}>
        <View style={styles.discoverHeader}>
          <Text style={styles.discoverTitle}>{title}</Text>
          {viewAllAction && (
            <TouchableOpacity onPress={viewAllAction}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.discoverScrollView}>
          <View style={styles.discoverItemsContainer}>
            {items.map(renderItem)}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDiscoverContent = () => {
    if (isLoadingDiscover) {
      return (
        <View style={styles.discoverLoadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading discover content...</Text>
        </View>
      );
    }

    return (
      <View style={styles.discoverContainer}>
        <Text style={styles.discoverMainTitle}>Discover</Text>
        
        {renderDiscoverSection(
          "Popular Places",
          discoverData.places,
          (place) => (
            <TouchableOpacity 
              key={`discover-place-${place.id}`} 
              style={styles.discoverCard}
              onPress={() => handlePlacePress(place)}
            >
              <View style={styles.discoverImageContainer}>
                {place.image ? (
                  <Image 
                    source={{ uri: place.image }} 
                    style={styles.discoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.discoverPlaceholder}>
                    <MapPin size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={styles.discoverCardTitle} numberOfLines={2}>{place.name}</Text>
              <Text style={styles.discoverCardSubtitle} numberOfLines={1}>{place.category}</Text>
              {place.rating && (
                <View style={styles.discoverRating}>
                  <Star size={12} color="#F59E0B" weight="fill" />
                  <Text style={styles.discoverRatingText}>{place.rating}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
        
        {renderDiscoverSection(
          "Popular Movies",
          discoverData.movies,
          (movie) => (
            <TouchableOpacity 
              key={`discover-movie-${movie.id}`} 
              style={styles.discoverCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.discoverImageContainer}>
                {getImageUrl(movie.poster_path) ? (
                  <Image 
                    source={{ uri: getImageUrl(movie.poster_path) }} 
                    style={styles.discoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.discoverPlaceholder}>
                    <FilmStrip size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={styles.discoverCardTitle} numberOfLines={2}>{movie.title}</Text>
              <Text style={styles.discoverCardSubtitle} numberOfLines={1}>
                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
              </Text>
              {movie.vote_average > 0 && (
                <View style={styles.discoverRating}>
                  <Star size={12} color="#F59E0B" weight="fill" />
                  <Text style={styles.discoverRatingText}>{movie.vote_average.toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
        
        {renderDiscoverSection(
          "Popular TV Shows",
          discoverData.tvShows,
          (tvShow) => (
            <TouchableOpacity 
              key={`discover-tv-${tvShow.id}`} 
              style={styles.discoverCard}
              onPress={() => handleTVShowPress(tvShow)}
            >
              <View style={styles.discoverImageContainer}>
                {getImageUrl(tvShow.poster_path) ? (
                  <Image 
                    source={{ uri: getImageUrl(tvShow.poster_path) }} 
                    style={styles.discoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.discoverPlaceholder}>
                    <Television size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={styles.discoverCardTitle} numberOfLines={2}>{tvShow.name}</Text>
              <Text style={styles.discoverCardSubtitle} numberOfLines={1}>
                {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'Unknown'}
              </Text>
              {tvShow.vote_average > 0 && (
                <View style={styles.discoverRating}>
                  <Star size={12} color="#F59E0B" weight="fill" />
                  <Text style={styles.discoverRatingText}>{tvShow.vote_average.toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
        
        {renderDiscoverSection(
          "Popular Games",
          discoverData.games,
          (game) => (
            <TouchableOpacity 
              key={`discover-game-${game.id}`} 
              style={styles.discoverCard}
              onPress={() => handleGamePress(game)}
            >
              <View style={styles.discoverImageContainer}>
                {getGameImageUrl(game.background_image) ? (
                  <Image 
                    source={{ uri: getGameImageUrl(game.background_image) }} 
                    style={styles.discoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.discoverPlaceholder}>
                    <GameController size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={styles.discoverCardTitle} numberOfLines={2}>{game.name}</Text>
              <Text style={styles.discoverCardSubtitle} numberOfLines={1}>
                {formatGameReleaseDate(game.released)}
              </Text>
              {game.rating > 0 && (
                <View style={styles.discoverRating}>
                  <Star size={12} color="#F59E0B" weight="fill" />
                  <Text style={styles.discoverRatingText}>{game.rating.toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
        
        {renderDiscoverSection(
          "Popular Books",
          discoverData.books,
          (book) => (
            <TouchableOpacity 
              key={`discover-book-${book.id}`} 
              style={styles.discoverCard}
              onPress={() => handleBookPress(book)}
            >
              <View style={styles.discoverImageContainer}>
                {getBookImageUrl(book.volumeInfo.imageLinks) ? (
                  <Image 
                    source={{ uri: getBookImageUrl(book.volumeInfo.imageLinks) }} 
                    style={styles.discoverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.discoverPlaceholder}>
                    <Book size={20} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={styles.discoverCardTitle} numberOfLines={2}>{book.volumeInfo.title}</Text>
              <Text style={styles.discoverCardSubtitle} numberOfLines={1}>
                {getAuthorsString(book.volumeInfo.authors)}
              </Text>
              {book.volumeInfo.averageRating && book.volumeInfo.averageRating > 0 && (
                <View style={styles.discoverRating}>
                  <Star size={12} color="#F59E0B" weight="fill" />
                  <Text style={styles.discoverRatingText}>{book.volumeInfo.averageRating.toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppBar title="Search" />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MagnifyingGlass size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places, restaurants, cafes..."
            placeholderTextColor="#9CA3AF"
              value={String(searchQuery || '')}
              onChangeText={(text) => setSearchQuery(String(text || ''))}
              onSubmitEditing={() => handleSearch(String(searchQuery || ''))}
              returnKeyType="search"
            />
          </View>
        </View>
        
        <ScrollView 
          style={styles.resultsContainer} 
          showsVerticalScrollIndicator={false}
        >
          {!hasSearched ? (
            <>
              {renderDiscoverContent()}
            </>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (searchResults.length > 0 || tmdbResults.total > 0) ? (
            <>
              {renderCategoryFilter()}
              <View style={styles.resultsListContainer}>
                <Text style={styles.resultsHeader}>
                  {String((searchResults.length + tmdbResults.total + gameResults.length + bookResults.length) || 0)} results found
                </Text>
                {activeCategory === 'all' ? (
                  <>
                    {searchResults.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>Places</Text>
                        {searchResults.map(renderPlaceItem)}
                      </View>
                    )}
                    {tmdbResults.movies.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>Movies</Text>
                        {tmdbResults.movies.map(renderMovieItem)}
                      </View>
                    )}
                    {tmdbResults.tvShows.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>TV Shows</Text>
                        {tmdbResults.tvShows.map(renderTVShowItem)}
                      </View>
                    )}
                    {tmdbResults.people.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>People</Text>
                        {tmdbResults.people.map(renderPersonItem)}
                      </View>
                    )}
                    {gameResults.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>Games</Text>
                        {gameResults.map(renderGameItem)}
                      </View>
                    )}
                    {bookResults.length > 0 && (
                      <View style={styles.categorySection}>
                        <Text style={styles.categorySectionTitle}>Books</Text>
                        {bookResults.map(renderBookItem)}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {activeCategory === 'places' && searchResults.map(renderPlaceItem)}
                    {activeCategory === 'movies' && tmdbResults.movies.map(renderMovieItem)}
                    {activeCategory === 'tv' && tmdbResults.tvShows.map(renderTVShowItem)}
                    {activeCategory === 'people' && tmdbResults.people.map(renderPersonItem)}
                    {activeCategory === 'games' && gameResults.map(renderGameItem)}
                    {activeCategory === 'books' && bookResults.map(renderBookItem)}
                  </>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <MagnifyingGlass size={48} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                No results found for "{String(searchQuery || '')}". Try a different search term.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomMenu activeTab="search" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: 40,
    fontFamily: 'Inter',
  },
  resultsContainer: {
    flex: 1,
  },
  // Categories
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 16,
  },
  // Results
  resultsListContainer: {
    paddingBottom: 20,
  },
  resultsHeader: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
  },
  placeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
  },
  placeImageContainer: {
    marginRight: 16,
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  placeName: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#F97316',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#F59E0B',
    marginLeft: 4,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 4,
  },
  // Empty states
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // Category Filter
  categoryFilterContainer: {
    marginBottom: 16,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  categoryFilterItemActive: {
    backgroundColor: '#F97316',
  },
  categoryFilterText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 6,
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  // Media Items
  mediaItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaImageContainer: {
    marginRight: 12,
  },
  mediaImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  placeholderMediaImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  mediaTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 4,
  },
  mediaSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 6,
  },
  // Discover Styles
  discoverContainer: {
    paddingVertical: 20,
  },
  discoverMainTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 20,
  },
  discoverSection: {
    marginBottom: 24,
  },
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discoverTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#F97316',
  },
  discoverScrollView: {
    marginHorizontal: -20,
  },
  discoverItemsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  discoverCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  discoverImageContainer: {
    marginBottom: 8,
  },
  discoverImage: {
    width: '100%',
    height: 156,
    borderRadius: 8,
  },
  discoverPlaceholder: {
    width: '100%',
    height: 156,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 4,
  },
  discoverCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 6,
  },
  discoverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverRatingText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#F59E0B',
    marginLeft: 4,
  },
  discoverLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});