import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  home_id: string | null;
  notes: string | null;
  homes?: {
    id: string;
    name: string;
  } | null;
  [key: string]: any;
}

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  refreshing: boolean;
  fetchItems: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({
  items: [],
  loading: true,
  refreshing: false,
  fetchItems: async () => {},
  deleteItem: async () => {},
  onRefresh: async () => {},
});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchItems = async () => {
    try {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appliances')
        .select(`
          *,
          homes (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      // Ensure all date fields are properly formatted
      const formattedData = data.map(item => ({
        ...item,
        purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : null,
        warranty_expiration: item.warranty_expiration ? item.warranty_expiration.split('T')[0] : null
      }));
      
      setItems(formattedData || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appliances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      Alert.alert('Error', 'Failed to delete inventory item');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        loading,
        refreshing,
        fetchItems,
        deleteItem,
        onRefresh,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};