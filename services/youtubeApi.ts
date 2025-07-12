const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || ''; // This key is blocked, using oEmbed instead
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  url: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  total: number;
  nextPageToken?: string;
}

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get video details by video ID using oEmbed API (no API key required)
export const getVideoById = async (videoId: string): Promise<YouTubeVideo | null> => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    
    const data = await response.json();
    
    if (data.title) {
      return {
        id: videoId,
        title: data.title,
        description: data.title, // oEmbed doesn't provide full description
        thumbnail: data.thumbnail_url || getVideoThumbnail(videoId, 'high'),
        channelTitle: data.author_name,
        publishedAt: new Date().toISOString(), // oEmbed doesn't provide publish date
        duration: 'Unknown', // oEmbed doesn't provide duration
        viewCount: '0', // oEmbed doesn't provide view count
        likeCount: '0', // oEmbed doesn't provide like count
        url: videoUrl,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

// Get video details by URL
export const getVideoByUrl = async (url: string): Promise<YouTubeVideo | null> => {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return null;
  }
  
  return await getVideoById(videoId);
};

// Search YouTube videos - Limited without API key, returning empty for now
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResult> => {
  try {
    // Since we don't have working API key, we'll return empty results
    // In a real implementation, you would need a valid YouTube API key
    return {
      videos: [],
      total: 0,
    };
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return {
      videos: [],
      total: 0,
    };
  }
};

// Format duration from ISO 8601 to readable format
export const formatDuration = (duration: string): string => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);
  
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// Format view count
export const formatViewCount = (viewCount: string): string => {
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  } else {
    return `${count} views`;
  }
};

// Format published date
export const formatPublishedDate = (publishedAt: string): string => {
  const date = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

// Validate YouTube URL
export const isValidYouTubeUrl = (url: string): boolean => {
  // More specific regex for YouTube URLs
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
  return regex.test(url);
};

// Get video thumbnail URL
export const getVideoThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality === 'maxres' ? 'maxresdefault' : quality === 'high' ? 'hqdefault' : quality === 'medium' ? 'mqdefault' : 'default'}.jpg`;
};