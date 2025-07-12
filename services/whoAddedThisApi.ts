import { supabase } from '../lib/supabase';

export interface WhoAddedThisResult {
  list_id: string;
  list_title: string;
  list_description?: string;
  list_privacy: 'public' | 'private' | 'friends';
  list_created_at: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  added_at: string;
}

export interface WhoAddedThisResponse {
  results: WhoAddedThisResult[];
  total: number;
}

/**
 * Bir içeriği hangi kullanıcıların listelerine eklediğini getirir
 */
export const getWhoAddedThis = async (
  contentId: string,
  contentType: string
): Promise<WhoAddedThisResponse> => {
  try {
    console.log(`🔍 Getting who added content: ${contentId} (${contentType})`);

    const { data, error } = await supabase
      .from('list_items')
      .select(`
        created_at,
        lists!inner (
          id,
          title,
          description,
          privacy,
          created_at,
          users_profiles!inner (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('lists.privacy', 'public') // Sadece public listeler
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching who added this:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} lists containing this content`);

    // Veriyi düzenle
    const results: WhoAddedThisResult[] = (data || []).map((item: any) => ({
      list_id: item.lists.id,
      list_title: item.lists.title,
      list_description: item.lists.description,
      list_privacy: item.lists.privacy,
      list_created_at: item.lists.created_at,
      user_id: item.lists.users_profiles.id,
      username: item.lists.users_profiles.username,
      full_name: item.lists.users_profiles.full_name,
      avatar_url: item.lists.users_profiles.avatar_url,
      added_at: item.created_at,
    }));

    return {
      results,
      total: results.length,
    };
  } catch (error) {
    console.error('❌ Error in getWhoAddedThis:', error);
    return {
      results: [],
      total: 0,
    };
  }
};

/**
 * Bir kullanıcının bu içeriği kaç listesine eklediğini sayar
 */
export const getUserListCountForContent = async (
  userId: string,
  contentId: string,
  contentType: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('list_items')
      .select('id', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('lists.creator_id', userId)
      .eq('lists.privacy', 'public');

    if (error) {
      console.error('❌ Error counting user lists:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error in getUserListCountForContent:', error);
    return 0;
  }
};

/**
 * İçerik türüne göre display name döndürür
 */
export const getContentTypeDisplayName = (contentType: string): string => {
  const typeMap: { [key: string]: string } = {
    'place': 'Place',
    'movie': 'Movie',
    'tv': 'TV Show',
    'person': 'Person',
    'game': 'Game',
    'book': 'Book',
    'music': 'Music',
    'software': 'Software',
  };
  
  return typeMap[contentType] || contentType;
};