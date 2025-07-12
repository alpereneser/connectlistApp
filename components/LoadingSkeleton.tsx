import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ViewStyle 
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { 
          width, 
          height, 
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
      />
    </View>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={80} height={80} borderRadius={8} />
    <View style={styles.listItemContent}>
      <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} />
    </View>
  </View>
);

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />
    <Skeleton width="100%" height={24} style={{ marginBottom: 8 }} />
    <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
    <View style={styles.cardFooter}>
      <Skeleton width={60} height={16} />
      <Skeleton width={40} height={16} />
    </View>
  </View>
);

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => (
  <View style={styles.profile}>
    <View style={styles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width="100%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
    <View style={styles.profileStats}>
      <Skeleton width={60} height={40} borderRadius={8} />
      <Skeleton width={60} height={40} borderRadius={8} />
      <Skeleton width={60} height={40} borderRadius={8} />
    </View>
  </View>
);

// Search Results Skeleton
export const SearchResultsSkeleton: React.FC = () => (
  <View style={styles.searchResults}>
    {[...Array(5)].map((_, index) => (
      <View key={index} style={styles.searchItem}>
        <Skeleton width={60} height={60} borderRadius={6} />
        <View style={styles.searchItemContent}>
          <Skeleton width="100%" height={18} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    ))}
  </View>
);

// Feed Skeleton
export const FeedSkeleton: React.FC = () => (
  <View style={styles.feed}>
    {[...Array(3)].map((_, index) => (
      <View key={index} style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.feedHeaderContent}>
            <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
        <Skeleton width="100%" height={200} borderRadius={12} style={{ marginVertical: 12 }} />
        <Skeleton width="100%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} />
      </View>
    ))}
  </View>
);

// Message List Skeleton
export const MessageListSkeleton: React.FC = () => (
  <View style={styles.messageList}>
    {[...Array(6)].map((_, index) => (
      <View key={index} style={styles.messageItem}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Skeleton width="40%" height={16} />
            <Skeleton width={40} height={12} />
          </View>
          <Skeleton width="80%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    ))}
  </View>
);

// Notification Skeleton
export const NotificationSkeleton: React.FC = () => (
  <View style={styles.notificationList}>
    {[...Array(4)].map((_, index) => (
      <View key={index} style={styles.notificationItem}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.notificationContent}>
          <Skeleton width="100%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={14} />
        </View>
        <Skeleton width={30} height={12} />
      </View>
    ))}
  </View>
);

// Grid Skeleton (for discover section)
export const GridSkeleton: React.FC<{ columns?: number }> = ({ columns = 2 }) => (
  <View style={styles.grid}>
    {[...Array(6)].map((_, index) => (
      <View 
        key={index} 
        style={[
          styles.gridItem, 
          { width: `${100 / columns - 2}%` }
        ]}
      >
        <Skeleton width="100%" height={150} borderRadius={8} />
        <Skeleton width="100%" height={16} style={{ marginTop: 8, marginBottom: 4 }} />
        <Skeleton width="60%" height={12} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  profile: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  searchResults: {
    padding: 16,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  feed: {
    padding: 16,
  },
  feedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageList: {
    padding: 16,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  gridItem: {
    marginBottom: 16,
  },
});

export default Skeleton;