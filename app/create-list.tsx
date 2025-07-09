import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import {
  MagnifyingGlass,
  Plus,
  X,
  Check,
  MapPin,
  FilmStrip,
  Television,
  BookOpen,
  GameController,
  User,
  PlayCircle,
  Lock,
  Globe,
  Users,
  ArrowLeft,
  ArrowRight,
  Trash,
  Eye,
  EyeSlash,
  Heart,
  ChatCircle,
  Link,
} from 'phosphor-react-native';

// API services
import { searchPlaces, PlaceResult } from '../services/yandexApi';
import { searchMulti, MovieResult, TVShowResult, PersonResult, getImageUrl } from '../services/tmdbApi';
import { searchGames, GameResult, getGameImageUrl } from '../services/rawgApi';
import { searchBooks, BookResult, getBookImageUrl } from '../services/googleBooksApi';
import { 
  getVideoByUrl, 
  searchYouTubeVideos, 
  YouTubeVideo, 
  isValidYouTubeUrl,
  formatDuration,
  formatViewCount,
  formatPublishedDate 
} from '../services/youtubeApi';

// Supabase
import { supabase } from '../lib/supabase';

interface SelectedItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  external_data?: any;
  content_id?: string;
  content_type?: string;
  url?: string;
}

interface ListData {
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'private' | 'friends';
  allow_comments: boolean;
  allow_collaboration: boolean;
  tags: string[];
}

export default function CreateListScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  
  // States
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // List data
  const [listData, setListData] = useState<ListData>({
    title: '',
    description: '',
    category: category || 'general',
    privacy: 'public',
    allow_comments: true,
    allow_collaboration: false,
    tags: [],
  });
  
  // Tag input
  const [tagInput, setTagInput] = useState('');
  
  // YouTube specific
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      Alert.alert('Error', 'Please login to create a list');
      router.push('/auth/login');
    }
  };

  const getCategoryInfo = () => {
    const categoryMap = {
      places: { icon: MapPin, title: 'Places', color: '#FF6B35' },
      movies: { icon: FilmStrip, title: 'Movies', color: '#F97316' },
      tv_shows: { icon: Television, title: 'TV Shows', color: '#EA580C' },
      books: { icon: BookOpen, title: 'Books', color: '#DC2626' },
      games: { icon: GameController, title: 'Games', color: '#F59E0B' },
      videos: { icon: PlayCircle, title: 'Videos', color: '#EF4444' },
      person: { icon: User, title: 'Person', color: '#FB923C' },
    };
    return categoryMap[category as keyof typeof categoryMap] || { icon: Plus, title: 'General', color: '#6B7280' };
  };

  // Auto-search effect
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout for debounced search
      const newTimeout = setTimeout(() => {
        handleSearch();
      }, 500); // 500ms delay
      
      setSearchTimeout(newTimeout);
    } else {
      // Clear results if search is empty
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      let results: any[] = [];
      
      switch (category) {
        case 'places':
          const placesResponse = await searchPlaces(searchQuery);
          results = placesResponse.results.map(place => ({
            ...place,
            type: 'place',
            content_type: 'place',
            content_id: place.id,
            image_url: place.image,
            title: place.name,
            subtitle: place.address || place.category || 'Unknown Location',
          }));
          break;
          
        case 'movies':
          const moviesResponse = await searchMulti(searchQuery);
          results = moviesResponse.movies.map(movie => ({
            ...movie,
            type: 'movie',
            content_type: 'movie',
            content_id: movie.id.toString(),
            image_url: getImageUrl(movie.poster_path),
            title: movie.title,
            subtitle: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'Unknown',
          }));
          break;
          
        case 'tv_shows':
          const tvResponse = await searchMulti(searchQuery);
          results = tvResponse.tvShows.map(tv => ({
            ...tv,
            type: 'tv',
            content_type: 'tv',
            content_id: tv.id.toString(),
            image_url: getImageUrl(tv.poster_path),
            title: tv.name,
            subtitle: tv.first_air_date ? new Date(tv.first_air_date).getFullYear().toString() : 'Unknown',
          }));
          break;
          
        case 'books':
          const booksResponse = await searchBooks(searchQuery);
          results = booksResponse.items?.map(book => ({
            ...book,
            type: 'book',
            content_type: 'book',
            content_id: book.id,
            image_url: getBookImageUrl(book.volumeInfo.imageLinks),
            title: book.volumeInfo.title,
            subtitle: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
          })) || [];
          break;
          
        case 'games':
          const gamesResponse = await searchGames(searchQuery);
          results = gamesResponse.results?.map(game => ({
            ...game,
            type: 'game',
            content_type: 'game',
            content_id: game.id.toString(),
            image_url: getGameImageUrl(game.background_image),
            title: game.name,
            subtitle: game.released || 'Unknown',
          })) || [];
          break;
          
        case 'videos':
          const videosResponse = await searchYouTubeVideos(searchQuery);
          results = videosResponse.videos.map(video => ({
            ...video,
            type: 'video',
            content_type: 'video',
            content_id: video.id,
            image_url: video.thumbnail,
            title: video.title,
            subtitle: video.channelTitle,
            url: video.url,
          }));
          break;
          
        case 'person':
          const peopleResponse = await searchMulti(searchQuery);
          results = peopleResponse.people.map(person => ({
            ...person,
            type: 'person',
            content_type: 'person',
            content_id: person.id.toString(),
            image_url: getImageUrl(person.profile_path),
            title: person.name,
            subtitle: person.known_for_department || 'Unknown',
          }));
          break;
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleYouTubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    
    if (!isValidYouTubeUrl(youtubeUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube URL');
      return;
    }
    
    setIsYouTubeLoading(true);
    try {
      const video = await getVideoByUrl(youtubeUrl);
      if (video) {
        const videoItem: SelectedItem = {
          id: video.id,
          type: 'video',
          content_type: 'video',
          content_id: video.id,
          title: video.title,
          subtitle: video.channelTitle,
          description: video.description,
          image_url: video.thumbnail,
          url: video.url,
          external_data: video,
        };
        
        // Check if already selected
        if (!selectedItems.find(item => item.id === video.id)) {
          setSelectedItems([...selectedItems, videoItem]);
        }
        
        setYoutubeUrl('');
      } else {
        Alert.alert('Error', 'Could not fetch video details');
      }
    } catch (error) {
      console.error('YouTube URL error:', error);
      Alert.alert('Error', 'Failed to fetch video details');
    } finally {
      setIsYouTubeLoading(false);
    }
  };

  const handleSelectItem = (item: any) => {
    const selectedItem: SelectedItem = {
      id: item.id || item.content_id || Math.random().toString(),
      type: item.type,
      content_type: item.content_type,
      content_id: item.content_id,
      title: item.title || item.name,
      subtitle: item.subtitle,
      description: item.description || item.overview,
      image_url: item.image_url,
      url: item.url,
      external_data: item,
    };
    
    // Check if already selected
    const isAlreadySelected = selectedItems.find(selected => selected.id === selectedItem.id);
    
    if (!isAlreadySelected) {
      setSelectedItems([...selectedItems, selectedItem]);
    } else {
      // Remove if already selected (toggle functionality)
      setSelectedItems(selectedItems.filter(selected => selected.id !== selectedItem.id));
    }
    
    // Don't close modal or clear search - allow multiple selections
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !listData.tags.includes(tagInput.trim())) {
      setListData({
        ...listData,
        tags: [...listData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setListData({
      ...listData,
      tags: listData.tags.filter(t => t !== tag),
    });
  };

  const handleCreateList = async () => {
    if (!listData.title.trim()) {
      Alert.alert('Error', 'Please enter a list title');
      return;
    }
    
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your list');
      return;
    }
    
    setIsLoading(true);
    try {
      // First, get category_id from categories table
      let categoryData;
      const { data: existingCategory, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', listData.category)
        .single();
      
      if (categoryError) {
        console.error('Category error:', categoryError);
        // If category doesn't exist, create it or use default
        // Get proper display name for category
        const getCategoryDisplayName = (categoryKey: string) => {
          const categoryMap: { [key: string]: string } = {
            'places': 'Places',
            'movies': 'Movies',
            'tv_shows': 'TV Shows',
            'books': 'Books',
            'games': 'Games',
            'videos': 'Videos',
            'person': 'People'
          };
          return categoryMap[categoryKey] || categoryKey;
        };
        
        const { data: newCategory, error: newCategoryError } = await supabase
          .from('categories')
          .insert({
            name: listData.category,
            display_name: getCategoryDisplayName(listData.category),
            description: `${getCategoryDisplayName(listData.category)} category`,
            icon: 'list',
            color: '#F97316'
          })
          .select()
          .single();
        
        if (newCategoryError) {
          console.error('Error creating category:', newCategoryError);
          Alert.alert('Error', 'Failed to create category. Please try again.');
          setIsLoading(false);
          return;
        }
        categoryData = newCategory;
      } else {
        categoryData = existingCategory;
      }
      
      // Create list
      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert({
          creator_id: currentUser.id,
          title: listData.title,
          description: listData.description,
          category_id: categoryData.id,
          privacy: listData.privacy,
          allow_comments: listData.allow_comments,
          allow_collaboration: listData.allow_collaboration,
          tags: listData.tags,
          item_count: selectedItems.length,
        })
        .select()
        .single();
      
      if (listError) throw listError;
      
      // Create list items
      const listItems = selectedItems.map((item, index) => ({
        list_id: list.id,
        external_id: item.content_id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        image_url: item.image_url,
        content_id: item.content_id,
        content_type: item.content_type,
        external_data: item.external_data,
        position: index + 1,
        source: category === 'videos' ? 'youtube' : 'api',
      }));
      
      const { error: itemsError } = await supabase
        .from('list_items')
        .insert(listItems);
      
      if (itemsError) throw itemsError;
      
      Alert.alert('Success', 'List created successfully!', [
        {
          text: 'OK',
          onPress: () => router.push(`/list/${list.id}`),
        },
      ]);
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Add Content' },
      { number: 2, title: 'List Details' },
      { number: 3, title: 'Settings' }
    ];
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                currentStep >= step.number && styles.stepCircleActive,
                currentStep === step.number && styles.stepCircleCurrent
              ]}>
                {currentStep > step.number ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepText,
                    currentStep >= step.number && styles.stepTextActive
                  ]}>
                    {step.number}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepTitle,
                currentStep >= step.number && styles.stepTitleActive
              ]}>
                {step.title}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                currentStep > step.number && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowSearchModal(false);
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Search {getCategoryInfo().title}</Text>
          <TouchableOpacity onPress={() => {
            setShowSearchModal(false);
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <View style={styles.searchInputWrapper}>
            <MagnifyingGlass size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${getCategoryInfo().title.toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoFocus={true}
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#F97316" />
            )}
          </View>
        </View>
        
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
        
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.resultItem,
                selectedItems.some(selected => selected.id === (item.id || item.content_id)) && styles.resultItemSelected
              ]}
              onPress={() => handleSelectItem(item)}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.resultImage} />
              ) : (
                <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
                  {item.type === 'place' ? (
                    <MapPin size={32} color="#9CA3AF" />
                  ) : (
                    <MagnifyingGlass size={32} color="#9CA3AF" />
                  )}
                </View>
              )}
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {item.title || item.name}
                </Text>
                {item.subtitle && (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              {selectedItems.some(selected => selected.id === (item.id || item.content_id)) ? (
                <Check size={20} color="#F97316" weight="bold" />
              ) : (
                <Plus size={20} color="#F97316" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderStep1 = () => (
    <View style={styles.stepContentContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIconLarge, { backgroundColor: `${getCategoryInfo().color}20` }]}>
            {React.createElement(getCategoryInfo().icon, { size: 32, color: getCategoryInfo().color })}
          </View>
          <Text style={styles.categoryTitle}>
            Add {getCategoryInfo().title} to Your List
          </Text>
        </View>
      </View>
      
      {/* Search Section */}
      <View style={styles.searchSection}>
        {category === 'videos' ? (
          <View style={styles.youtubeContainer}>
            <Text style={styles.sectionTitle}>Add YouTube Video</Text>
            <View style={styles.youtubeInputContainer}>
              <TextInput
                style={styles.youtubeInput}
                placeholder="Paste YouTube video URL here..."
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                multiline={false}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={styles.youtubeButton}
                onPress={handleYouTubeUrl}
                disabled={isYouTubeLoading}
              >
                {isYouTubeLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Plus size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchContainer}>
            <Text style={styles.sectionTitle}>Search {getCategoryInfo().title}</Text>
            <View style={styles.searchInputWrapper}>
              <MagnifyingGlass size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${getCategoryInfo().title.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoFocus={false}
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#F97316" />
              )}
            </View>
          </View>
        )}
      </View>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <ScrollView style={styles.searchResultsList} showsVerticalScrollIndicator={false}>
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.searchResultItem,
                  selectedItems.some(selected => selected.id === (item.id || item.content_id)) && styles.searchResultItemSelected
                ]}
                onPress={() => handleSelectItem(item)}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.searchResultImage} />
                ) : (
                  <View style={[styles.searchResultImage, styles.searchResultImagePlaceholder]}>
                    {item.type === 'place' ? (
                      <MapPin size={32} color="#9CA3AF" />
                    ) : (
                      <MagnifyingGlass size={32} color="#9CA3AF" />
                    )}
                  </View>
                )}
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultTitle} numberOfLines={2}>
                    {item.title || item.name}
                  </Text>
                  {item.subtitle && (
                    <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                {selectedItems.some(selected => selected.id === (item.id || item.content_id)) ? (
                  <Check size={20} color="#F97316" weight="bold" />
                ) : (
                  <Plus size={20} color="#F97316" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedItemsContainer}>
          <Text style={styles.sectionTitle}>Selected Items ({selectedItems.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedItemsScroll}>
            {selectedItems.map((item, index) => (
              <View key={item.id} style={styles.selectedItem}>
                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.selectedItemImage} />
                )}
                <View style={styles.selectedItemContent}>
                  <Text style={styles.selectedItemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={styles.selectedItemSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.id)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {renderSearchModal()}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContentContainer}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>List Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter list title..."
            value={listData.title}
            onChangeText={(text) => setListData({ ...listData, title: text })}
            maxLength={100}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your list..."
            value={listData.description}
            onChangeText={(text) => setListData({ ...listData, description: text })}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add tags..."
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.tagButton} onPress={handleAddTag}>
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {listData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {listData.tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <X size={12} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContentContainer}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Privacy</Text>
          <View style={styles.privacyOptions}>
            {[
              { key: 'public', icon: Globe, label: 'Public', description: 'Anyone can see this list' },
              { key: 'private', icon: Lock, label: 'Private', description: 'Only you can see this list' },
              { key: 'friends', icon: Users, label: 'Friends', description: 'Only your friends can see this list' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.privacyOption,
                  listData.privacy === option.key && styles.privacyOptionSelected
                ]}
                onPress={() => setListData({ ...listData, privacy: option.key as any })}
              >
                <option.icon size={20} color={listData.privacy === option.key ? '#F97316' : '#6B7280'} />
                <View style={styles.privacyOptionContent}>
                  <Text style={[
                    styles.privacyOptionLabel,
                    listData.privacy === option.key && styles.privacyOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Settings</Text>
          <View style={styles.settingsOptions}>
            <TouchableOpacity
              style={styles.settingOption}
              onPress={() => setListData({ ...listData, allow_comments: !listData.allow_comments })}
            >
              <View style={styles.settingOptionLeft}>
                <ChatCircle size={20} color="#6B7280" />
                <Text style={styles.settingOptionLabel}>Allow Comments</Text>
              </View>
              <View style={[
                styles.toggle,
                listData.allow_comments && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  listData.allow_comments && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingOption}
              onPress={() => setListData({ ...listData, allow_collaboration: !listData.allow_collaboration })}
            >
              <View style={styles.settingOptionLeft}>
                <Users size={20} color="#6B7280" />
                <Text style={styles.settingOptionLabel}>Allow Collaboration</Text>
              </View>
              <View style={[
                styles.toggle,
                listData.allow_collaboration && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleThumb,
                  listData.allow_collaboration && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderBottomNavigation = () => (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity
        style={[styles.navButton, styles.backNavButton]}
        onPress={() => {
          if (currentStep === 1) {
            router.back();
          } else {
            setCurrentStep(currentStep - 1);
          }
        }}
      >
        <ArrowLeft size={20} color="#6B7280" />
        <Text style={styles.backNavButtonText}>
          {currentStep === 1 ? 'Back' : 'Previous'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.nextNavButton,
          (currentStep === 1 && selectedItems.length === 0) && styles.disabledButton,
          (currentStep === 2 && !listData.title.trim()) && styles.disabledButton,
          (currentStep === 3 && isLoading) && styles.disabledButton
        ]}
        onPress={() => {
          if (currentStep === 1 && selectedItems.length > 0) {
            setCurrentStep(2);
          } else if (currentStep === 2 && listData.title.trim()) {
            setCurrentStep(3);
          } else if (currentStep === 3) {
            handleCreateList();
          }
        }}
        disabled={
          (currentStep === 1 && selectedItems.length === 0) ||
          (currentStep === 2 && !listData.title.trim()) ||
          (currentStep === 3 && isLoading)
        }
      >
        {currentStep === 3 && isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.nextNavButtonText}>
              {currentStep === 3 ? 'Create List' : 'Next'}
            </Text>
            {currentStep === 3 ? (
              <Check size={20} color="#fff" />
            ) : (
              <ArrowRight size={20} color="#fff" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppBar title="Create List" showBackButton={true} />
      
      <View style={styles.content}>
        {renderStepIndicator()}
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </View>
      
      {renderBottomNavigation()}
      
      <BottomMenu 
        activeTab="add" 
        onTabPress={(tab) => {
          if (tab === 'home') router.push('/');
          else if (tab === 'search') router.push('/search');
          else if (tab === 'discover') router.push('/discover');
          else if (tab === 'profile') router.push('/profile');
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Step Indicator Styles
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepCircleActive: {
    backgroundColor: '#F97316',
  },
  stepCircleCurrent: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  stepTitleActive: {
    color: '#F97316',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#F97316',
  },
  // Content Container
  stepContentContainer: {
    flex: 1,
  },
  // Step 1 Styles
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#1F2937',
  },
  // Search Results
  searchResultsContainer: {
    marginBottom: 20,
    maxHeight: 300,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  searchResultItemSelected: {
    backgroundColor: '#FFF7ED',
    borderBottomColor: '#FED7AA',
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  searchResultImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  categoryInfo: {
    alignItems: 'center',
  },
  categoryIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  youtubeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  youtubeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  youtubeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '400',
    backgroundColor: '#F9FAFB',
  },
  youtubeButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedItemsContainer: {
    marginBottom: 20,
  },
  selectedItemsScroll: {
    maxHeight: 120,
  },
  selectedItem: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedItemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedItemContent: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedItemSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    backgroundColor: '#F9FAFB',
  },
  tagButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 12,
  },
  privacyOptionSelected: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  privacyOptionLabelSelected: {
    color: '#F97316',
  },
  privacyOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  settingsOptions: {
    gap: 16,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  settingOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingOptionLabel: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#F97316',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  // Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  backNavButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  backNavButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  nextNavButton: {
    backgroundColor: '#F97316',
  },
  nextNavButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDoneText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#F97316',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  resultItemSelected: {
    backgroundColor: '#FFF7ED',
    borderBottomColor: '#FED7AA',
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  resultImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
});