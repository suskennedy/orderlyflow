import { useEffect, useState } from 'react';
import { Home, HomeInsert, HomeUpdate } from '../../types/database';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export function useHomes() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [currentHome, setCurrentHome] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHomes();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile?.default_home_id && homes.length > 0) {
      const defaultHome = homes.find(home => home.id === userProfile.default_home_id);
      if (defaultHome) {
        setCurrentHome(defaultHome);
      } else if (homes.length > 0) {
        setCurrentHome(homes[0]);
      }
    } else if (homes.length > 0) {
      setCurrentHome(homes[0]);
    }
  }, [userProfile, homes]);

  const fetchHomes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching homes:', error);
      } else {
        setHomes(data || []);
      }
    } catch (error) {
      console.error('Error fetching homes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHome = async (homeData: HomeInsert) => {
    if (!user?.id) return { data: null, error: new Error('User not authenticated') };
    
    try {
      const { data, error } = await supabase
        .from('homes')
        .insert([{ ...homeData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating home:', error);
        return { data: null, error };
      }

      setHomes(prev => [data, ...prev]);
      
      // Set as current home if it's the first home
      if (homes.length === 0) {
        setCurrentHome(data);
        // Update user profile to set this as default home
        await supabase
          .from('user_profiles')
          .update({ default_home_id: data.id })
          .eq('id', user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating home:', error);
      return { data: null, error };
    }
  };

  const updateHome = async (homeId: string, updates: HomeUpdate) => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .update(updates)
        .eq('id', homeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating home:', error);
        return { data: null, error };
      }

      setHomes(prev => prev.map(home => home.id === homeId ? data : home));
      if (currentHome?.id === homeId) {
        setCurrentHome(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating home:', error);
      return { data: null, error };
    }
  };

  const deleteHome = async (homeId: string) => {
    try {
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', homeId);

      if (error) {
        console.error('Error deleting home:', error);
        return { error };
      }

      setHomes(prev => prev.filter(home => home.id !== homeId));
      
      // If deleted home was current home, set a new current home
      if (currentHome?.id === homeId) {
        const remainingHomes = homes.filter(home => home.id !== homeId);
        setCurrentHome(remainingHomes.length > 0 ? remainingHomes[0] : null);
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting home:', error);
      return { error };
    }
  };

  const switchHome = async (homeId: string) => {
    if (!user?.id) return;
    
    const home = homes.find(h => h.id === homeId);
    if (home) {
      setCurrentHome(home);
      // Update user profile default home
      await supabase
        .from('user_profiles')
        .update({ default_home_id: homeId })
        .eq('id', user.id);
    }
  };

  return {
    homes,
    currentHome,
    loading,
    fetchHomes,
    createHome,
    updateHome,
    deleteHome,
    switchHome,
  };
} 