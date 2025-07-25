import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the PaintColor type based on your current schema
interface PaintColor {
  id: string;
  name: string;
  room: string | null;
  brand: string | null;
  color_code: string | null;
  color_hex: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PaintsContextType {
  paints: PaintColor[];
  loading: boolean;
  createPaint: (paintData: Omit<PaintColor, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updatePaint: (id: string, updates: Partial<PaintColor>) => Promise<void>;
  deletePaint: (id: string) => Promise<void>;
}

const PaintsContext = createContext<PaintsContextType | undefined>(undefined);

export function PaintsProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [paints, setPaints] = useState<PaintColor[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch paints from Supabase
  const fetchPaints = useCallback(async () => {
    if (!homeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('paint_colors')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPaints(data || []);
    } catch (error) {
      console.error('Error fetching paints:', error);
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  // Handle real-time changes
  const handlePaintChange = useCallback((payload: any) => {
    console.log('🔥 Real-time paint change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setPaints(prev => [payload.new as PaintColor, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setPaints(prev => 
        prev.map(paint => 
          paint.id === payload.new.id ? payload.new as PaintColor : paint
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setPaints(prev => 
        prev.filter(paint => paint.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'paint_colors',
      filter: homeId ? `home_id=eq.${homeId}` : undefined
    },
    handlePaintChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchPaints();
    } else {
      setPaints([]);
    }
  }, [homeId, fetchPaints]);

  const createPaint = async (paintData: Omit<PaintColor, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('paint_colors')
        .insert([{ ...paintData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Paint created:', data);
    } catch (error) {
      console.error('Error creating paint:', error);
      throw error;
    }
  };

  const updatePaint = async (id: string, updates: Partial<PaintColor>) => {
    try {
      const { data, error } = await supabase
        .from('paint_colors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Paint updated:', data);
    } catch (error) {
      console.error('Error updating paint:', error);
      throw error;
    }
  };

  const deletePaint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('paint_colors')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Paint deleted:', id);
    } catch (error) {
      console.error('Error deleting paint:', error);
      throw error;
    }
  };

  return (
    <PaintsContext.Provider value={{ 
      paints, 
      loading, 
      createPaint, 
      updatePaint, 
      deletePaint 
    }}>
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