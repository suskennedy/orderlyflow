import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { UserProfile } from '../../types/database';
import { signOut as serverSignOut } from '../auth/actions';
import { supabase } from '../supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfileExists(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureProfileExists(session.user);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfileExists = async (user: User) => {
    try {
      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching user profile:', fetchError);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        setUserProfile(existingProfile);
        setLoading(false);
        return;
      }

      // Profile doesn't exist, create one
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      extractNameFromEmail(user.email || '');

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: user.id,
            full_name: fullName,
            display_name: fullName.split(' ')[0], // Use first name as display name
            notification_email: true,
            notification_push: true,
            notification_sms: false,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        // Even if profile creation fails, we should still allow the user to proceed
        setUserProfile(null);
      } else {
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      // Ensure loading is set to false even on unexpected errors
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const extractNameFromEmail = (email: string): string => {
    const username = email.split('@')[0];
    return username
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await serverSignOut();
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      // Refresh the session to get updated user metadata
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await ensureProfileExists(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return {
    session,
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
    isAuthenticated: !!session,
  };
} 