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
import { Star, Calendar, MapPin, Users, Heart, Share, ArrowLeft, Plus, Eye, User } from 'phosphor-react-native';
import AppBar from '../../../components/AppBar';
import BottomMenu from '../../../components/BottomMenu';
import { fontConfig } from '../../../styles/global';
import { getImageUrl } from '../../../services/tmdbApi';

const { width: screenWidth } = Dimensions.get('window');

interface PersonDetail {
  id: number;
  name: string;
  biography?: string;
  profile_path: string | null;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  known_for_department?: string;
  popularity: number;
  gender: number;
  adult: boolean;
  also_known_as?: string[];
  homepage?: string;
  imdb_id?: string;
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    media_type: string;
    vote_average: number;
  }>;
}

export default function PersonDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadPersonDetails();
  }, [id]);

  const loadPersonDetails = async () => {
    try {
      setLoading(true);
      
      if (data) {
        try {
          const personData = JSON.parse(decodeURIComponent(String(data)));
          setPerson(personData);
        } catch (parseError) {
          console.error('Person data parse error:', parseError);
          setMockPerson();
        }
      } else {
        setMockPerson();
      }
    } catch (error) {
      console.error('Error loading person details:', error);
      setMockPerson();
    } finally {
      setLoading(false);
    }
  };

  const setMockPerson = () => {
    const mockPerson: PersonDetail = {
      id: Number(id),
      name: 'Sample Actor',
      biography: 'This is a sample actor biography.',
      profile_path: null,
      birthday: '1980-01-01',
      place_of_birth: 'Los Angeles, California, USA',
      known_for_department: 'Acting',
      popularity: 50.5,
      gender: 2,
      adult: false,
      also_known_as: ['Sample Name'],
      known_for: [
        {
          id: 1,
          title: 'Sample Movie',
          poster_path: null,
          media_type: 'movie',
          vote_average: 7.5
        }
      ]
    };
    setPerson(mockPerson);
  };

  const handleTabPress = (tab: string) => {
    router.push(`/${tab}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share person');
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getAge = (birthday?: string, deathday?: string | null) => {
    if (!birthday) return null;
    try {
      const birthDate = new Date(birthday);
      const endDate = deathday ? new Date(deathday) : new Date();
      const age = endDate.getFullYear() - birthDate.getFullYear();
      return age;
    } catch {
      return null;
    }
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1: return 'Female';
      case 2: return 'Male';
      default: return 'Not specified';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppBar title="Person Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.container}>
        <AppBar title="Person Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Person not found</Text>
        </View>
        <BottomMenu activeTab="search" onTabPress={handleTabPress} />
      </View>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, 'w500');
  const age = getAge(person.birthday, person.deathday);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#1F2937" weight="bold" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share size={24} color="#1F2937" weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                <Heart
                  size={24}
                  color={isFavorite ? "#EF4444" : "#1F2937"}
                  weight={isFavorite ? "fill" : "bold"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Person Info */}
          <View style={styles.personInfo}>
            <View style={styles.profileAndDetails}>
              <View style={styles.profileImageContainer}>
                {profileUrl ? (
                  <Image source={{ uri: profileUrl }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <User size={60} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={styles.personDetails}>
                <Text style={styles.personName}>{person.name}</Text>
                {person.known_for_department && (
                  <Text style={styles.department}>{person.known_for_department}</Text>
                )}
                
                <View style={styles.metaInfo}>
                  {person.birthday && (
                    <View style={styles.metaItem}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {formatDate(person.birthday)}
                        {age && ` (${age} years old)`}
                      </Text>
                    </View>
                  )}
                  {person.place_of_birth && (
                    <View style={styles.metaItem}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{person.place_of_birth}</Text>
                    </View>
                  )}
                </View>
              </View>
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

          {/* Biography */}
          {person.biography && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.biography}>{person.biography}</Text>
            </View>
          )}

          {/* Also Known As */}
          {person.also_known_as && person.also_known_as.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Also Known As</Text>
              <View style={styles.aliasesContainer}>
                {person.also_known_as.map((alias, index) => (
                  <View key={index} style={styles.aliasItem}>
                    <Text style={styles.aliasText}>{alias}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Known For */}
          {person.known_for && person.known_for.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Known For</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.knownForContainer}>
                  {person.known_for.map((item) => {
                    const posterUrl = getImageUrl(item.poster_path, 'w300');
                    return (
                      <View key={item.id} style={styles.knownForItem}>
                        {posterUrl ? (
                          <Image source={{ uri: posterUrl }} style={styles.knownForPoster} />
                        ) : (
                          <View style={styles.knownForPlaceholder}>
                            <User size={30} color="#9CA3AF" />
                          </View>
                        )}
                        <Text style={styles.knownForTitle} numberOfLines={2}>
                          {item.title || item.name}
                        </Text>
                        <View style={styles.knownForRating}>
                          <Star size={12} color="#F59E0B" weight="fill" />
                          <Text style={styles.knownForRatingText}>{(item.vote_average || 0).toFixed(1)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gender:</Text>
                <Text style={styles.detailValue}>{getGenderText(person.gender)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Popularity:</Text>
                <Text style={styles.detailValue}>{(person.popularity || 0).toFixed(1)}</Text>
              </View>
              {person.deathday && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Death:</Text>
                  <Text style={styles.detailValue}>{formatDate(person.deathday)}</Text>
                </View>
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  personInfo: {
    marginBottom: 24,
  },
  profileAndDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  profilePlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 24,
    fontFamily: 'Inter',
    color: '#1F2937',
    marginBottom: 4,
  },
  department: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 12,
  },
  metaInfo: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    flex: 1,
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
  biography: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#374151',
    lineHeight: 24,
  },
  aliasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aliasItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aliasText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#374151',
  },
  knownForContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  knownForItem: {
    width: 100,
    alignItems: 'center',
  },
  knownForPoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 8,
  },
  knownForPlaceholder: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  knownForTitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  knownForRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  knownForRatingText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  detailsContainer: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#1F2937',
  },
});