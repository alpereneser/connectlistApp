import DOMPurify from 'dompurify';
import { Platform } from 'react-native';

// Configure DOMPurify with safe defaults for React Native
const configurePurify = () => {
  if (Platform.OS === 'web') {
    // Web platform - full DOMPurify configuration
    DOMPurify.setConfig({
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      KEEP_CONTENT: true,
      IN_PLACE: false,
    });
  }
  return DOMPurify;
};

// Sanitize user input to prevent XSS attacks
export const sanitizeText = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic sanitization for React Native
  if (Platform.OS !== 'web') {
    // For mobile platforms, we'll do basic string sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick, onload etc
      .trim();
  }

  // For web platform, use DOMPurify
  const purify = configurePurify();
  return purify.sanitize(input);
};

// Sanitize HTML content (for web platform mostly)
export const sanitizeHTML = (html: string | null | undefined): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (Platform.OS !== 'web') {
    // For mobile, strip all HTML tags
    return html.replace(/<[^>]*>/g, '').trim();
  }

  const purify = configurePurify();
  return purify.sanitize(html);
};

// Sanitize user profile data
export const sanitizeUserData = (userData: {
  full_name?: string;
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
}): typeof userData => {
  return {
    full_name: sanitizeText(userData.full_name),
    username: sanitizeText(userData.username),
    bio: sanitizeText(userData.bio),
    website: sanitizeText(userData.website),
    location: sanitizeText(userData.location),
  };
};

// Sanitize list data
export const sanitizeListData = (listData: {
  title?: string;
  description?: string;
  tags?: string[];
}): typeof listData => {
  return {
    title: sanitizeText(listData.title),
    description: sanitizeText(listData.description),
    tags: listData.tags?.map(tag => sanitizeText(tag)) || [],
  };
};

// Sanitize comment data
export const sanitizeCommentData = (comment: {
  content?: string;
  author_name?: string;
}): typeof comment => {
  return {
    content: sanitizeText(comment.content),
    author_name: sanitizeText(comment.author_name),
  };
};

// URL validation and sanitization
export const sanitizeURL = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove potentially dangerous protocols
  const cleanUrl = url.replace(/^javascript:/i, '').replace(/^data:/i, '').replace(/^vbscript:/i, '');
  
  // Validate URL format
  try {
    const urlObj = new URL(cleanUrl);
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
  } catch (error) {
    // Invalid URL format
    return '';
  }

  return '';
};

// Email sanitization
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Basic email sanitization
  return email.toLowerCase().trim().replace(/[<>'"]/g, '');
};

// Phone number sanitization
export const sanitizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove non-numeric characters except + and spaces
  return phone.replace(/[^+\d\s()-]/g, '').trim();
};