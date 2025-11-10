import { create } from 'zustand';
import { InventoryItem, InventoryService } from '../services/InventoryService';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  refreshing: boolean;

  // Actions
  fetchItems: (userId: string) => Promise<void>;
  deleteItem: (itemId: string, itemType?: string) => Promise<void>;
  addItem: (item: Partial<InventoryItem>) => void;
  onRefresh: (userId: string) => Promise<void>;
  
  // Internal setters
  setItems: (items: InventoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  loading: true,
  refreshing: false,

  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),

  fetchItems: async (userId: string) => {
    if (!userId) {
      set({ items: [], loading: false });
      return;
    }
    
    try {
      set({ loading: true });
      const inventoryItems = await InventoryService.getAllInventoryItems(userId);
      set({ items: inventoryItems, loading: false });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      set({ items: [], loading: false });
    }
  },

  deleteItem: async (itemId: string, itemType?: string) => {
    try {
      const currentItems = get().items;
      
      // Check if this is a temporary ID (starts with "temp_")
      if (itemId.startsWith("temp_")) {
        // Just remove from local state, no need to call the database
        set({ items: currentItems.filter(item => item.id !== itemId) });
        return;
      }

      // Otherwise proceed with normal deletion from database
      if (!itemType) {
        const item = currentItems.find(i => i.id === itemId);
        if (!item) {
          throw new Error('Item not found');
        }
        itemType = item.item_type;
      }

      await InventoryService.deleteInventoryItem(itemId, itemType);
      
      // Update local state after successful deletion
      set({ items: currentItems.filter(item => item.id !== itemId) });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error; // Rethrow to allow calling code to handle it
    }
  },

  addItem: (newItem: Partial<InventoryItem>) => {
    // Create a temporary ID if none provided
    const itemWithId = {
      ...newItem,
      id: newItem.id || `temp_${Date.now()}`,
    } as InventoryItem;
    
    // Add to state so it shows immediately
    const currentItems = get().items;
    set({ items: [...currentItems, itemWithId] });
  },

  onRefresh: async (userId: string) => {
    set({ refreshing: true });
    await get().fetchItems(userId);
    set({ refreshing: false });
  },
}));

