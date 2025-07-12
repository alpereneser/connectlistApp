// Google Books API integration for book search
import { Platform } from 'react-native';
import { ENV } from '../config/env';

const GOOGLE_BOOKS_API_KEY = ENV.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1';

// Mock book data
const MOCK_BOOKS: BookResult[] = [
  {
    id: 'mock-book-1',
    volumeInfo: {
      title: 'JavaScript: The Good Parts',
      authors: ['Douglas Crockford'],
      publisher: "O'Reilly Media",
      publishedDate: '2008-05-08',
      description: 'A comprehensive guide to JavaScript programming',
      pageCount: 176,
      categories: ['Programming'],
      averageRating: 4.2,
      ratingsCount: 1250,
      imageLinks: {
        thumbnail: 'https://books.google.com/books/content?id=PXa2bby0oQ0C&printsec=frontcover&img=1&zoom=1&source=gbs_api'
      }
    }
  },
  {
    id: 'mock-book-2',
    volumeInfo: {
      title: 'Clean Code',
      authors: ['Robert C. Martin'],
      publisher: 'Prentice Hall',
      publishedDate: '2008-08-01',
      description: 'A handbook of agile software craftsmanship',
      pageCount: 464,
      categories: ['Programming'],
      averageRating: 4.4,
      ratingsCount: 2150,
      imageLinks: {
        thumbnail: 'https://books.google.com/books/content?id=hjEFCAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
      }
    }
  },
  {
    id: 'mock-book-3',
    volumeInfo: {
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      publisher: 'Scribner',
      publishedDate: '1925-04-10',
      description: 'A classic American novel',
      pageCount: 180,
      categories: ['Fiction', 'Classics'],
      averageRating: 3.9,
      ratingsCount: 4320,
      imageLinks: {
        thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop'
      }
    }
  },
  {
    id: 'mock-book-4',
    volumeInfo: {
      title: 'Atomic Habits',
      authors: ['James Clear'],
      publisher: 'Avery',
      publishedDate: '2018-10-16',
      description: 'An easy and proven way to build good habits and break bad ones',
      pageCount: 320,
      categories: ['Self Help', 'Psychology'],
      averageRating: 4.7,
      ratingsCount: 8250,
      imageLinks: {
        thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop'
      }
    }
  },
  {
    id: 'mock-book-5',
    volumeInfo: {
      title: 'Sapiens',
      authors: ['Yuval Noah Harari'],
      publisher: 'Harper',
      publishedDate: '2014-09-04',
      description: 'A brief history of humankind',
      pageCount: 443,
      categories: ['History', 'Anthropology'],
      averageRating: 4.5,
      ratingsCount: 12500,
      imageLinks: {
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop'
      }
    }
  }
];

// Book result interface
export interface BookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
  };
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
    listPrice?: {
      amount?: number;
      currencyCode?: string;
    };
    retailPrice?: {
      amount?: number;
      currencyCode?: string;
    };
  };
}

// Google Books search response interface
export interface GoogleBooksSearchResponse {
  kind: string;
  totalItems: number;
  items?: BookResult[];
}

// Search books function with fallback
export const searchBooks = async (query: string, startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    // If no API key, return mock data
    if (!GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key missing, using mock data');
      const filtered = MOCK_BOOKS.filter(book => 
        book.volumeInfo.title.toLowerCase().includes(query.toLowerCase()) ||
        book.volumeInfo.authors?.some(author => author.toLowerCase().includes(query.toLowerCase())) ||
        book.volumeInfo.categories?.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
      );
      return {
        kind: 'books#volumes',
        totalItems: filtered.length,
        items: filtered.length > 0 ? filtered : MOCK_BOOKS
      };
    }

    // For web platform, we might face CORS issues
    if (Platform.OS === 'web') {
      console.warn('Web platform detected, checking for CORS issues');
    }

    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}`
    );
    
    if (!response.ok) {
      console.error(`Google Books API error: ${response.status}`);
      // Return mock data on API error
      const filtered = MOCK_BOOKS.filter(book => 
        book.volumeInfo.title.toLowerCase().includes(query.toLowerCase())
      );
      return {
        kind: 'books#volumes',
        totalItems: filtered.length,
        items: filtered.length > 0 ? filtered : MOCK_BOOKS
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching books:', error);
    // Return mock data on any error
    const filtered = MOCK_BOOKS.filter(book => 
      book.volumeInfo.title.toLowerCase().includes(query.toLowerCase())
    );
    return {
      kind: 'books#volumes',
      totalItems: filtered.length,
      items: filtered.length > 0 ? filtered : MOCK_BOOKS
    };
  }
};

// Search books by category with fallback
export const searchBooksByCategory = async (category: string, startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    // If no API key, return mock data
    if (!GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key missing, using mock data');
      const filtered = MOCK_BOOKS.filter(book => 
        book.volumeInfo.categories?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
      );
      return {
        kind: 'books#volumes',
        totalItems: filtered.length,
        items: filtered.length > 0 ? filtered : MOCK_BOOKS
      };
    }

    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=subject:${encodeURIComponent(category)}&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`
    );
    
    if (!response.ok) {
      console.error(`Google Books API error: ${response.status}`);
      const filtered = MOCK_BOOKS.filter(book => 
        book.volumeInfo.categories?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
      );
      return {
        kind: 'books#volumes',
        totalItems: filtered.length,
        items: filtered.length > 0 ? filtered : MOCK_BOOKS
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching books by category:', error);
    const filtered = MOCK_BOOKS.filter(book => 
      book.volumeInfo.categories?.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
    );
    return {
      kind: 'books#volumes',
      totalItems: filtered.length,
      items: filtered.length > 0 ? filtered : MOCK_BOOKS
    };
  }
};

// Get popular books with fallback
export const getPopularBooks = async (startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    // If no API key, return mock data
    if (!GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key missing, using mock data');
      return {
        kind: 'books#volumes',
        totalItems: MOCK_BOOKS.length,
        items: MOCK_BOOKS
      };
    }

    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=bestseller&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`
    );
    
    if (!response.ok) {
      console.error(`Google Books API error: ${response.status}`);
      return {
        kind: 'books#volumes',
        totalItems: MOCK_BOOKS.length,
        items: MOCK_BOOKS
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching popular books:', error);
    return {
      kind: 'books#volumes',
      totalItems: MOCK_BOOKS.length,
      items: MOCK_BOOKS
    };
  }
};

// Get book details with fallback
export const getBookDetails = async (bookId: string): Promise<BookResult> => {
  try {
    // If mock ID, return mock data
    if (bookId.startsWith('mock-book-')) {
      const mockBook = MOCK_BOOKS.find(b => b.id === bookId);
      if (mockBook) return mockBook;
    }

    // If no API key, return first mock book
    if (!GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key missing, using mock data');
      return MOCK_BOOKS[0];
    }

    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Google Books API error: ${response.status}`);
      return MOCK_BOOKS[0];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching book details:', error);
    return MOCK_BOOKS[0];
  }
};

// Get book image URL helper
export const getBookImageUrl = (imageLinks: BookResult['volumeInfo']['imageLinks'], size: 'small' | 'medium' | 'large' = 'medium'): string => {
  if (!imageLinks) {
    return 'https://via.placeholder.com/128x192?text=No+Cover';
  }
  
  switch (size) {
    case 'small':
      return imageLinks.smallThumbnail || imageLinks.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
    case 'medium':
      return imageLinks.thumbnail || imageLinks.small || imageLinks.medium || 'https://via.placeholder.com/128x192?text=No+Cover';
    case 'large':
      return imageLinks.large || imageLinks.medium || imageLinks.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
    default:
      return imageLinks.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
  }
};

// Popular book categories
export const GOOGLE_BOOKS_CATEGORIES = [
  { id: 'books-popular', name: 'Popular Books', query: '' },
  { id: 'fiction', name: 'Fiction', query: 'fiction' },
  { id: 'non-fiction', name: 'Non-Fiction', query: 'non-fiction' },
  { id: 'mystery', name: 'Mystery', query: 'mystery' },
  { id: 'romance', name: 'Romance', query: 'romance' },
  { id: 'science-fiction', name: 'Science Fiction', query: 'science fiction' },
  { id: 'fantasy', name: 'Fantasy', query: 'fantasy' },
  { id: 'biography', name: 'Biography', query: 'biography' },
  { id: 'history', name: 'History', query: 'history' },
  { id: 'self-help', name: 'Self Help', query: 'self help' },
];

// Format publication date
export const formatBookPublicationDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  
  try {
    // Google Books API returns dates in various formats (YYYY, YYYY-MM, YYYY-MM-DD)
    const year = dateString.split('-')[0];
    return year;
  } catch {
    return 'Unknown';
  }
};

// Get authors string
export const getAuthorsString = (authors: string[] | undefined): string => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(' & ');
  return `${authors[0]} & ${authors.length - 1} others`;
};

// Get categories string
export const getCategoriesString = (categories: string[] | undefined): string => {
  if (!categories || categories.length === 0) return 'General';
  
  return categories.slice(0, 2).join(', ');
};

// Format page count
export const formatPageCount = (pageCount: number | undefined): string => {
  if (!pageCount) return 'Unknown pages';
  return `${pageCount} pages`;
};

// Get book rating
export const getBookRating = (averageRating: number | undefined, ratingsCount: number | undefined): { rating: number; count: number } => {
  return {
    rating: averageRating || 0,
    count: ratingsCount || 0
  };
};