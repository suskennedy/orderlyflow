import React, { createContext, useContext, useEffect, useState } from 'react';
import { Paint } from '../../types/database';
import { supabase } from '../supabase';

interface PaintsContextType {
  paints: Paint[];
  loading: boolean;
  createPaint: (paintData: Omit<Paint, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const PaintsContext = createContext<PaintsContextType | undefined>(undefined);

export function PaintsProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaints();
  }, [homeId]);

  const fetchPaints = async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('paints')
        .select('*')
        .eq('home_id', homeId);
      if (error) throw error;
      setPaints(data || []);
    } catch (error) {
      console.error('Error fetching paints:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaint = async (paintData: Omit<Paint, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('paints')
        .insert([{ ...paintData, home_id: homeId, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      setPaints(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating paint:', error);
      throw error;
    }
  };

  return (
    <PaintsContext.Provider value={{ paints, loading, createPaint }}>
      {children}
    </PaintsContext.Provider>
  );
}

export function usePaints(homeId: string) {
  const context = useContext(PaintsContext);
  if (context === undefined) {
    throw new Error('usePaints must be used within a PaintsProvider');
  }
  return context;
} 