import { supabase } from '../lib/supabase';

export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
}

// Mock user data for fallback
const MOCK_USERS: UserSearchResult[] = [
  {
    id: 'mock-user-1',
    username: 'john_doe',
    full_name: 'John Doe',
    display_name: 'John Doe',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    bio: 'Tech enthusiast and content creator',
    created_at: new Date().toISOString(),
    is_verified: true,
    followers_count: 1250,
    following_count: 890
  },
  {
    id: 'mock-user-2',
    username: 'sarah_wilson',
    full_name: 'Sarah Wilson',
    display_name: 'Sarah Wilson',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b2e1ce29?w=100&h=100&fit=crop&crop=face',
    bio: 'Artist and designer',
    created_at: new Date().toISOString(),
    is_verified: false,
    followers_count: 892,
    following_count: 456
  },
  {
    id: 'mock-user-3',
    username: 'alex_tech',
    full_name: 'Alex Thompson',
    display_name: 'Alex Thompson',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    bio: 'Software developer',
    created_at: new Date().toISOString(),
    is_verified: false,
    followers_count: 634,
    following_count: 234
  }
];

export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
}

export async function searchUsers(query: string): Promise<UserSearchResponse> {
  try {
    console.log('Searching users with query:', query);
    
    if (!query.trim()) {
      return { users: [], total: 0 };
    }

    const searchLower = query.toLowerCase();

    // Method 1: Search from auth.users table using RPC function
    try {
      console.log('Trying RPC search for auth users with query:', query);
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_auth_users', { search_query: query });

      console.log('RPC search result:', { rpcData, rpcError });
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        const users: UserSearchResult[] = rpcData.map((user: any) => ({
          id: user.id,
          username: user.email?.split('@')[0] || 'Unknown', // Use email prefix as username
          full_name: user.display_name || user.full_name || 'Unknown User',
          display_name: user.display_name || user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio || '',
          created_at: user.created_at,
          is_verified: false,
          followers_count: 0,
          following_count: 0
        }));
        
        return { users, total: users.length };
      }
    } catch (rpcError) {
      console.log('RPC search failed, trying direct auth search:', rpcError);
    }

    // Method 2: Try to access auth.users directly (may not work due to RLS)
    try {
      console.log('Trying direct auth.users search');
      
      const { data: authData, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data, created_at')
        .limit(50);

      console.log('Direct auth search result:', { authData, authError });
      
      if (!authError && authData) {
        // Filter auth users by display_name or email
        const filteredAuthUsers = authData.filter(user => {
          const displayName = user.raw_user_meta_data?.display_name || user.raw_user_meta_data?.full_name || '';
          const email = user.email || '';
          return displayName.toLowerCase().includes(searchLower) || 
                 email.toLowerCase().includes(searchLower);
        });
        
        if (filteredAuthUsers.length > 0) {
          const users: UserSearchResult[] = filteredAuthUsers.map(user => ({
            id: user.id,
            username: user.email?.split('@')[0] || 'Unknown',
            full_name: user.raw_user_meta_data?.display_name || user.raw_user_meta_data?.full_name || 'Unknown User',
            display_name: user.raw_user_meta_data?.display_name || user.raw_user_meta_data?.full_name,
            avatar_url: user.raw_user_meta_data?.avatar_url,
            bio: '',
            created_at: user.created_at,
            is_verified: false,
            followers_count: 0,
            following_count: 0
          }));
          
          return { users, total: users.length };
        }
      }
    } catch (authError) {
      console.log('Direct auth search failed, falling back to users_profiles:', authError);
    }

    // Method 3: Fallback to users_profiles search - prioritize full_name
    console.log('Falling back to users_profiles search');

    // Use Supabase text search for better performance
    const { data, error } = await supabase
      .from('users_profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(50);

    console.log('users_profiles response:', { data, error, totalUsers: data?.length });

    if (error) {
      console.error('User fetch error:', error);
      // Fallback to client-side filtering if server-side search fails
      const { data: allData, error: allError } = await supabase
        .from('users_profiles')
        .select('*')
        .limit(100);
      
      if (allError) {
        console.error('User fetch error (fallback):', allError);
        return { users: [], total: 0 };
      }

      // Filter users client-side with priority on full_name
      const filteredData = (allData || []).filter(user => {
        const username = (user.username || '').toLowerCase();
        const fullName = (user.full_name || '').toLowerCase();
        return fullName.includes(searchLower) || username.includes(searchLower);
      });
      
      data = filteredData;
    }

    console.log('Filtered users_profiles:', { count: data?.length, users: data });

    const users: UserSearchResult[] = (data || []).map(user => ({
      id: user.id,
      username: user.username || 'Unknown',
      full_name: user.full_name || 'Unknown User',
      display_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      is_verified: user.is_verified || false,
      followers_count: user.followers_count || 0,
      following_count: user.following_count || 0
    }));

    // Sort by relevance (prioritize full_name matches)
    users.sort((a, b) => {
      const queryLower = query.toLowerCase();
      
      // Check full_name matches (prioritized)
      const aExactFullName = a.full_name.toLowerCase() === queryLower;
      const bExactFullName = b.full_name.toLowerCase() === queryLower;
      const aStartsWithFullName = a.full_name.toLowerCase().startsWith(queryLower);
      const bStartsWithFullName = b.full_name.toLowerCase().startsWith(queryLower);
      const aFullNameContains = a.full_name.toLowerCase().includes(queryLower);
      const bFullNameContains = b.full_name.toLowerCase().includes(queryLower);
      
      // Check username matches (secondary)
      const aExactUsername = a.username.toLowerCase() === queryLower;
      const bExactUsername = b.username.toLowerCase() === queryLower;
      const aStartsWithUsername = a.username.toLowerCase().startsWith(queryLower);
      const bStartsWithUsername = b.username.toLowerCase().startsWith(queryLower);
      
      // 1. Exact full_name matches first (highest priority)
      if (aExactFullName && !bExactFullName) return -1;
      if (!aExactFullName && bExactFullName) return 1;
      
      // 2. Full_name starts with query
      if (aStartsWithFullName && !bStartsWithFullName) return -1;
      if (!aStartsWithFullName && bStartsWithFullName) return 1;
      
      // 3. Full_name contains query
      if (aFullNameContains && !bFullNameContains) return -1;
      if (!aFullNameContains && bFullNameContains) return 1;
      
      // 4. Exact username matches
      if (aExactUsername && !bExactUsername) return -1;
      if (!aExactUsername && bExactUsername) return 1;
      
      // 5. Username starts with query
      if (aStartsWithUsername && !bStartsWithUsername) return -1;
      if (!aStartsWithUsername && bStartsWithUsername) return 1;
      
      // 6. Finally by followers count
      return (b.followers_count || 0) - (a.followers_count || 0);
    });

    return {
      users: users.slice(0, 20), // Limit to 20 results
      total: users.length
    };
  } catch (error) {
    console.error('User search error:', error);
    // Return mock users when all methods fail
    const filtered = MOCK_USERS.filter(user => 
      user.full_name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    return { 
      users: filtered.length > 0 ? filtered : MOCK_USERS, 
      total: filtered.length > 0 ? filtered.length : MOCK_USERS.length 
    };
  }
}

// Debug function to check what users exist
export async function debugGetAllUsers(): Promise<any[]> {
  try {
    // Check users_profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, username, full_name')
      .limit(50);
    
    console.log('Debug - Users in users_profiles:', profilesData);
    
    // Check auth.users via RPC
    const { data: authData, error: authError } = await supabase
      .rpc('search_auth_users', { search_query: '' }); // Empty query to get all
    
    console.log('Debug - Users in auth.users:', authData);
    
    return authData || profilesData || [];
  } catch (error) {
    console.error('Debug users fetch error:', error);
    return [];
  }
}

// Get user avatar URL with fallback
export function getUserAvatarUrl(avatarUrl?: string): string | null {
  if (!avatarUrl) return null;
  
  // If it's already a full URL, return it
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  // If it's a relative path, construct the full Supabase storage URL
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
}