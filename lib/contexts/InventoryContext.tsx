import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { InventoryItem, InventoryService } from '../services/InventoryService';
import { supabase } from '../supabase';

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  refreshing: boolean;
  deleteItem: (itemId: string, itemType?: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  addItem: (item: Partial<InventoryItem>) => void; // New function to add items for immediate UI update
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all inventory items
  const fetchItems = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const inventoryItems = await InventoryService.getAllInventoryItems(user.id);
      setItems(inventoryItems);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Delete an item
  const deleteItem = async (itemId: string, itemType?: string) => {
    try {
      // Check if this is a temporary ID (starts with "temp_")
      if (itemId.startsWith("temp_")) {
        // Just remove from local state, no need to call the database
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        return;
      }

      // Otherwise proceed with normal deletion from database
      if (!itemType) {
        const item = items.find(i => i.id === itemId);
        if (!item) {
          throw new Error('Item not found');
        }
        itemType = item.item_type;
      }

      await InventoryService.deleteInventoryItem(itemId, itemType);
      
      // Update local state after successful deletion
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error; // Rethrow to allow calling code to handle it
    }
  };
  
  // Add an item to the local state for immediate UI update
  const addItem = (newItem: Partial<InventoryItem>) => {
    // Create a temporary ID if none provided
    const itemWithId = {
      ...newItem,
      id: newItem.id || `temp_${Date.now()}`,
    } as InventoryItem;
    
    // Add to state so it shows immediately
    setItems(current => [...current, itemWithId]);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;
    
    // Array of tables to subscribe to
    const tables = [
      'appliances', 
      'filters', 
      'light_fixtures', 
      'cabinets', 
      'tiles', 
      'paint_colors'
    ];

    // Map to convert table name to item_type
    const tableToType = {
      'appliances': 'appliance',
      'filters': 'filter',
      'light_fixtures': 'light_fixture',
      'cabinets': 'cabinet',
      'tiles': 'tile',
      'paint_colors': 'paint'
    };
    
    // Create subscriptions for each table
    const subscriptions = tables.map(table => {
      return supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          { 
            event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`Change detected in ${table}:`, payload);
            
            // Handle based on event type
            if (payload.eventType === 'INSERT') {
              // For new items, need to fetch homes info
              fetchItems();
            } 
            else if (payload.eventType === 'UPDATE') {
              // For updates, update the existing item
              fetchItems();
            } 
            else if (payload.eventType === 'DELETE') {
              // For deletes, remove the item from the list
              setItems(current => 
                current.filter(item => 
                  !(item.id === payload.old.id && item.item_type === tableToType[table as keyof typeof tableToType])
                )
              );
            }
          }
        )
        .subscribe();
    });
    
    // Clean up subscriptions when component unmounts
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [user?.id]);

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
  };

  // Initial data fetch
  useEffect(() => {
    fetchItems();
  }, [user]);

  const value = {
    items,
    loading,
    refreshing,
    deleteItem,
    onRefresh,
    addItem, // Expose the addItem function
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};