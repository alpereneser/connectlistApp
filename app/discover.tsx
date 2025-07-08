import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import AppBar from '../components/AppBar';
import BottomMenu from '../components/BottomMenu';
import { fontConfig } from '../styles/global';
import { Users, UserPlus, Heart, MapPin } from 'phosphor-react-native';

interface DiscoverScreenProps {
  onTabPress?: (tab: string) => void;
}

export default function DiscoverScreen({ onTabPress }: DiscoverScreenProps) {
  const handleTabPress = (tab: string) => {
    onTabPress?.(tab);
  };

  // Mock data for suggested people
  const suggestedPeople = [
    { id: 1, name: 'Sarah Johnson', location: 'New York', mutualFriends: 5, avatar: '👩‍💼' },
    { id: 2, name: 'Mike Chen', location: 'San Francisco', mutualFriends: 3, avatar: '👨‍💻' },
    { id: 3, name: 'Emma Wilson', location: 'London', mutualFriends: 8, avatar: '👩‍🎨' },
    { id: 4, name: 'Alex Rodriguez', location: 'Madrid', mutualFriends: 2, avatar: '👨‍🎓' },
  ];

  const trendingTopics = [
    { id: 1, title: 'Tech Meetups', members: 1234, icon: '💻' },
    { id: 2, title: 'Food Lovers', members: 856, icon: '🍕' },
    { id: 3, title: 'Travel Buddies', members: 2341, icon: '✈️' },
    { id: 4, title: 'Book Club', members: 567, icon: '📚' },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="Discover People" />
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Suggested People Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>People You May Know</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {suggestedPeople.map((person) => (
                <View key={person.id} style={styles.personCard}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>{person.avatar}</Text>
                  </View>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.locationText}>{person.location}</Text>
                  </View>
                  <Text style={styles.mutualFriends}>{person.mutualFriends} mutual friends</Text>
                  <TouchableOpacity style={styles.connectButton}>
                    <UserPlus size={16} color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Trending Topics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Trending Topics</Text>
            </View>
            
            {trendingTopics.map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicCard}>
                <View style={styles.topicIcon}>
                  <Text style={styles.topicEmoji}>{topic.icon}</Text>
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicMembers}>{topic.members.toLocaleString()} members</Text>
                </View>
                <UserPlus size={20} color="#FF6B35" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Nearby Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Nearby Events</Text>
            </View>
            
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Tech Networking Night</Text>
              <Text style={styles.eventDetails}>Tonight • 7:00 PM • Downtown</Text>
              <Text style={styles.eventAttendees}>23 people attending</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      <BottomMenu activeTab="discover" onTabPress={handleTabPress} />
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
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...fontConfig.semibold,
    fontSize: 18,
    color: '#1F2937',
    marginLeft: 8,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 24,
  },
  personName: {
    ...fontConfig.semibold,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  locationText: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  mutualFriends: {
    ...fontConfig.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    ...fontConfig.medium,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicEmoji: {
    fontSize: 18,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    ...fontConfig.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  topicMembers: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    ...fontConfig.semibold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDetails: {
    ...fontConfig.regular,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  eventAttendees: {
    ...fontConfig.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    ...fontConfig.medium,
    fontSize: 14,
    color: '#374151',
  },
});