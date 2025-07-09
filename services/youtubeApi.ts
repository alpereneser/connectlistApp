const YOUTUBE_API_KEY = 'AIzaSyDe4BIkhTKqHXggqlT88_04nDvfeePXc7w';
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

// Get video details by video ID
export const getVideoById = async (videoId: string): Promise<YouTubeVideo | null> => {
  try {
    const response = await fetch(
      `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount || '0',
        likeCount: video.statistics.likeCount || '0',
        url: `https://www.youtube.com/watch?v=${video.id}`,
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

// Search YouTube videos
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResult> => {
  try {
    let searchUrl = `${YOUTUBE_BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    
    if (pageToken) {
      searchUrl += `&pageToken=${pageToken}`;
    }
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error('Failed to search videos');
    }
    
    const data = await response.json();
    
    // Get detailed information for each video
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }
    
    const detailsData = await detailsResponse.json();
    
    const videos: YouTubeVideo[] = detailsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount || '0',
      likeCount: video.statistics.likeCount || '0',
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }));
    
    return {
      videos,
      total: data.pageInfo.totalResults,
      nextPageToken: data.nextPageToken,
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
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
};

// Get video thumbnail URL
export const getVideoThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality === 'maxres' ? 'maxresdefault' : quality === 'high' ? 'hqdefault' : quality === 'medium' ? 'mqdefault' : 'default'}.jpg`;
};