// Google Books API integration for book search

const GOOGLE_BOOKS_API_KEY = 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w';
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1';

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

// Search books function
export const searchBooks = async (query: string, startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

// Search books by category
export const searchBooksByCategory = async (category: string, startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=subject:${encodeURIComponent(category)}&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching books by category:', error);
    throw error;
  }
};

// Get popular books
export const getPopularBooks = async (startIndex: number = 0, maxResults: number = 20): Promise<GoogleBooksSearchResponse> => {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes?q=*&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching popular books:', error);
    throw error;
  }
};

// Get book details
export const getBookDetails = async (bookId: string): Promise<BookResult> => {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_BASE_URL}/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching book details:', error);
    throw error;
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