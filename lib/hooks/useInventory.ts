import { useEffect } from 'react';
import { useInventoryStore } from '../stores/inventoryStore';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export function useInventory() {
  const { user } = useAuth();
  const {
    items,
    loading,
    refreshing,
    fetchItems,
    setItems,
    deleteItem,
    addItem,
    onRefresh,
  } = useInventoryStore();

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
    const tableToType: Record<string, string> = {
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
              fetchItems(user.id);
            } 
            else if (payload.eventType === 'UPDATE') {
              // For updates, update the existing item
              fetchItems(user.id);
            } 
            else if (payload.eventType === 'DELETE') {
              // For deletes, remove the item from the list
              const currentItems = useInventoryStore.getState().items;
              setItems(
                currentItems.filter(item => 
                  !(item.id === payload.old.id && item.item_type === tableToType[table])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user?.id, use getState() for store functions

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchItems(user.id);
    } else {
      setItems([]);
      useInventoryStore.setState({ loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user?.id to avoid infinite loops

  return {
    items: Array.isArray(items) ? items : [],
    loading,
    refreshing,
    deleteItem,
    onRefresh: () => user?.id ? onRefresh(user.id) : Promise.resolve(),
    addItem,
  };
}

