import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Calendar, Book, Users, Heart, Share, ArrowLeft, Plus, Eye, BookOpen } from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { fontConfig } from '../../../styles/global';
import { getBookImageUrl, formatBookPublicationDate, getAuthorsString, getCategoriesString } from '../../../services/googleBooksApi';

const { width: screenWidth } = Dimensions.get('window');

interface BookDetail {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    readingModes?: {
      text: boolean;
      image: boolean;
    };
    pageCount?: number;
    printType?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    allowAnonLogging?: boolean;
    contentVersion?: string;
    panelizationSummary?: {
      containsEpubBubbles: boolean;
      containsImageBubbles: boolean;
    };
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
    canonicalVolumeLink?: string;
  };
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
    retailPrice?: {
      amount: number;
      currencyCode: string;
    };
    buyLink?: string;
    offers?: Array<{
      finskyOfferType: number;
      listPrice: {
        amountInMicros: number;
        currencyCode: string;
      };
      retailPrice: {
        amountInMicros: number;
        currencyCode: string;
      };
    }>;
  };
  accessInfo?: {
    country?: string;
    viewability?: string;
    embeddable?: boolean;
    publicDomain?: boolean;
    textToSpeechPermission?: string;
    epub?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    pdf?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    webReaderLink?: string;
    accessViewStatus?: string;
    quoteSharingAllowed?: boolean;
  };
  searchInfo?: {
    textSnippet?: string;
  };
}

export default function BookDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadBookDetails();
  }, [id]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        try {
          const bookData = JSON.parse(decodeURIComponent(String(data)));
          setBook(bookData);
        } catch (parseError) {
          console.error('Book data parse error:', parseError);
          setMockBook();
        }
      } else {
        setMockBook();
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      setMockBook();
    } finally {
      setLoading(false);
    }
  };

  const setMockBook = () => {
    const mockBook: BookDetail = {
      id: String(id),
      volumeInfo: {
        title: 'Sample Book',
        subtitle: 'A Sample Subtitle',
        authors: ['Sample Author'],
        publisher: 'Sample Publisher',
        publishedDate: '2023-01-01',
        description: 'This is a sample book description that provides an overview of the book content.',
        pageCount: 300,
        categories: ['Fiction', 'Adventure'],
        averageRating: 4.2,
        ratingsCount: 150,
        language: 'en',
        imageLinks: {
          thumbnail: 'https://via.placeholder.com/300x450?text=Book+Cover'
        }
      }
    };
    setBook(mockBook);
  };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share book');
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleAddToList = () => {
    console.log('Add to list');
    // TODO: Add to list functionality
  };

  const handleWhoAddedList = () => {
    console.log('Who added to list');
    // TODO: Who added to list functionality
  };

  const handlePreviewLink = () => {
    if (book?.volumeInfo.previewLink) {
      Linking.openURL(book.volumeInfo.previewLink);
    }
  };

  const handleBuyLink = () => {
    if (book?.saleInfo?.buyLink) {
      Linking.openURL(book.saleInfo.buyLink);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Book Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.container}>
        <AppBar title="Book Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Book not found</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  const bookImage = getBookImageUrl(book.volumeInfo.imageLinks);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Book Cover */}
        <View style={styles.headerContainer}>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share size={24} color="#FFFFFF" weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                <Heart
                  size={24}
                  color={isFavorite ? "#EF4444" : "#FFFFFF"}
                  weight={isFavorite ? "fill" : "bold"}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bookCoverContainer}>
            <Image source={{ uri: bookImage }} style={styles.bookCover} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Book Info */}
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.volumeInfo.title}</Text>
            {book.volumeInfo.subtitle && (
              <Text style={styles.bookSubtitle}>{book.volumeInfo.subtitle}</Text>
            )}
            
            <Text style={styles.bookAuthors}>{getAuthorsString(book.volumeInfo.authors)}</Text>
            
            {book.volumeInfo.averageRating && (
              <View style={styles.ratingContainer}>
                <Star size={16} color="#F59E0B" weight="fill" />
                <Text style={styles.ratingText}>{book.volumeInfo.averageRating.toFixed(1)}</Text>
                {book.volumeInfo.ratingsCount && (
                  <Text style={styles.ratingsCount}>({book.volumeInfo.ratingsCount} ratings)</Text>
                )}
              </View>
            )}
            
            <View style={styles.metaInfo}>
              {book.volumeInfo.publisher && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Publisher:</Text>
                  <Text style={styles.metaText}>{book.volumeInfo.publisher}</Text>
                </View>
              )}
              {book.volumeInfo.publishedDate && (
                <View style={styles.metaItem}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{formatBookPublicationDate(book.volumeInfo.publishedDate)}</Text>
                </View>
              )}
              {book.volumeInfo.pageCount && (
                <View style={styles.metaItem}>
                  <BookOpen size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{book.volumeInfo.pageCount} pages</Text>
                </View>
              )}
              {book.volumeInfo.language && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Language:</Text>
                  <Text style={styles.metaText}>{book.volumeInfo.language.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddToList}>
              <Plus size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.primaryButtonText}>Add List</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleWhoAddedList}>
              <Eye size={20} color="#3B82F6" weight="bold" />
              <Text style={styles.secondaryButtonText}>Who Added List</Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          {book.volumeInfo.categories && book.volumeInfo.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {book.volumeInfo.categories.map((category, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {book.volumeInfo.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{book.volumeInfo.description}</Text>
            </View>
          )}

          {/* Book Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Book Details</Text>
            <View style={styles.detailsContainer}>
              {book.volumeInfo.printType && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Format:</Text>
                  <Text style={styles.detailValue}>{book.volumeInfo.printType}</Text>
                </View>
              )}
              {book.volumeInfo.maturityRating && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Maturity Rating:</Text>
                  <Text style={styles.detailValue}>{book.volumeInfo.maturityRating}</Text>
                </View>
              )}
              {book.volumeInfo.industryIdentifiers && book.volumeInfo.industryIdentifiers.length > 0 && (
                book.volumeInfo.industryIdentifiers.map((identifier, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{identifier.type}:</Text>
                    <Text style={styles.detailValue}>{identifier.identifier}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Availability */}
          {(book.saleInfo || book.accessInfo) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.detailsContainer}>
                {book.saleInfo?.saleability && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sale Status:</Text>
                    <Text style={styles.detailValue}>{book.saleInfo.saleability}</Text>
                  </View>
                )}
                {book.saleInfo?.isEbook !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>E-book:</Text>
                    <Text style={styles.detailValue}>{book.saleInfo.isEbook ? 'Available' : 'Not Available'}</Text>
                  </View>
                )}
                {book.accessInfo?.epub?.isAvailable !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>EPUB:</Text>
                    <Text style={styles.detailValue}>{book.accessInfo.epub.isAvailable ? 'Available' : 'Not Available'}</Text>
                  </View>
                )}
                {book.accessInfo?.pdf?.isAvailable !== undefined && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PDF:</Text>
                    <Text style={styles.detailValue}>{book.accessInfo.pdf.isAvailable ? 'Available' : 'Not Available'}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Price Information */}
          {book.saleInfo?.listPrice && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price</Text>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>List Price:</Text>
                  <Text style={styles.detailValue}>
                    {book.saleInfo.listPrice.amount} {book.saleInfo.listPrice.currencyCode}
                  </Text>
                </View>
                {book.saleInfo.retailPrice && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Retail Price:</Text>
                    <Text style={styles.detailValue}>
                      {book.saleInfo.retailPrice.amount} {book.saleInfo.retailPrice.currencyCode}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Links */}
          <View style={styles.section}>
            <View style={styles.linkButtons}>
              {book.volumeInfo.previewLink && (
                <TouchableOpacity style={styles.linkButton} onPress={handlePreviewLink}>
                  <Text style={styles.linkButtonText}>Preview Book</Text>
                </TouchableOpacity>
              )}
              {book.saleInfo?.buyLink && (
                <TouchableOpacity style={styles.buyButton} onPress={handleBuyLink}>
                  <Text style={styles.buyButtonText}>Buy Book</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <BottomMenu activeTab="search" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  headerContainer: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bookCoverContainer: {
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookCover: {
    width: 150,
    height: 225,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bookTitle: {
    fontSize: 24,
    fontFamily: 'Inter',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookAuthors: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingsCount: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginLeft: 4,
  },
  metaInfo: {
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#3B82F6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#374151',
    lineHeight: 24,
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  linkButtons: {
    gap: 12,
  },
  linkButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  buyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
});