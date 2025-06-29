import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

interface InventoryItem {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  location?: string | null;
  purchase_date?: string | null;
  warranty_expiration?: string | null;
  manual_url?: string | null;
  home_id?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  homes?: {
    name: string;
  } | null;
}

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  refreshing: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      if (!user?.id) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('appliances')
        .select(`
          *,
          homes (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('appliances')
        .insert([itemData])
        .select(`
          *,
          homes (
            name
          )
        `)
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('appliances')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          homes (
            name
          )
        `)
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => item.id === id ? data : item));
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appliances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      Alert.alert('Success', 'Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
      throw error;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  useEffect(() => {
    if (user?.id) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('appliances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appliances',
        },
        (payload) => {
          console.log('Real-time inventory update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setItems(prev => {
                const exists = prev.find(item => item.id === payload.new.id);
                if (exists) return prev;
                return [payload.new as InventoryItem, ...prev];
              });
              break;
            case 'UPDATE':
              setItems(prev => prev.map(item => 
                item.id === payload.new.id ? payload.new as InventoryItem : item
              ));
              break;
            case 'DELETE':
              setItems(prev => prev.filter(item => item.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const value: InventoryContextType = {
    items,
    loading,
    refreshing,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    onRefresh,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}; 