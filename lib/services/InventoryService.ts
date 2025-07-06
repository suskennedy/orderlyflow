import { Database } from '../../supabase';
import { supabase } from '../supabase';

// Define the inventory item types based on your schema
export type ApplianceItem = Database['public']['Tables']['appliances']['Row'];
export type FilterItem = Database['public']['Tables']['filters']['Row'];
export type LightFixtureItem = Database['public']['Tables']['light_fixtures']['Row'];
export type CabinetItem = Database['public']['Tables']['cabinets']['Row'];
export type TileItem = Database['public']['Tables']['tiles']['Row'];
export type PaintColorItem = Database['public']['Tables']['paint_colors']['Row'];

// Generic inventory item with type discriminator
export interface InventoryItem {
  id: string;
  name: string;
  item_type: 'appliance' | 'filter' | 'light_fixture' | 'cabinet' | 'tile' | 'paint';
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  location?: string | null;
  purchase_date?: string | null;
  warranty_expiration?: string | null;
  manual_url?: string | null;
  notes?: string | null;
  home_id?: string | null;
  homes?: { name: string } | null;
  [key: string]: any; // For additional type-specific properties
}

export class InventoryService {
  /**
   * Fetches all inventory items for a user across all item types
   */
  static async getAllInventoryItems(userId: string): Promise<InventoryItem[]> {
    try {
      // 1. Get all homes for this user
      const { data: homes, error: homesError } = await supabase
        .from('homes')
        .select('id, name')
        .eq('user_id', userId);
        
      if (homesError) {
        throw new Error(`Error fetching homes: ${homesError.message}`);
      }
      
      // If no homes, return empty array
      if (!homes || homes.length === 0) {
        return [];
      }
      
      const homeIds = homes.map(home => home.id);
      const homesMap = Object.fromEntries(homes.map(home => [home.id, home]));
      
      // 2. Fetch all appliances for these homes
      const { data: appliances, error: appliancesError } = await supabase
        .from('appliances')
        .select('*')
        .in('home_id', homeIds);
        
      if (appliancesError) {
        throw new Error(`Error fetching appliances: ${appliancesError.message}`);
      }
      
      // 3. Fetch all filters for these homes
      const { data: filters, error: filtersError } = await supabase
        .from('filters')
        .select('*')
        .in('home_id', homeIds);
        
      if (filtersError) {
        throw new Error(`Error fetching filters: ${filtersError.message}`);
      }
      
      // 4. Fetch all light fixtures for these homes
      const { data: lightFixtures, error: lightFixturesError } = await supabase
        .from('light_fixtures')
        .select('*')
        .in('home_id', homeIds);
        
      if (lightFixturesError) {
        throw new Error(`Error fetching light fixtures: ${lightFixturesError.message}`);
      }
      
      // 5. Fetch all cabinets for these homes
      const { data: cabinets, error: cabinetsError } = await supabase
        .from('cabinets')
        .select('*')
        .in('home_id', homeIds);
        
      if (cabinetsError) {
        throw new Error(`Error fetching cabinets: ${cabinetsError.message}`);
      }
      
      // 6. Fetch all tiles for these homes
      const { data: tiles, error: tilesError } = await supabase
        .from('tiles')
        .select('*')
        .in('home_id', homeIds);
        
      if (tilesError) {
        throw new Error(`Error fetching tiles: ${tilesError.message}`);
      }
      
      // 7. Fetch all paint colors for these homes
      const { data: paintColors, error: paintColorsError } = await supabase
        .from('paint_colors')
        .select('*')
        .in('home_id', homeIds);
        
      if (paintColorsError) {
        throw new Error(`Error fetching paint colors: ${paintColorsError.message}`);
      }
      
      // 8. Combine all items and add type discriminators
      const inventoryItems: InventoryItem[] = [
        ...(appliances || []).map(item => ({
          ...item,
          item_type: 'appliance',
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        })),
        ...(filters || []).map(item => ({
          ...item,
          item_type: 'filter',
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        })),
        ...(lightFixtures || []).map(item => ({
          ...item,
          item_type: 'light_fixture',
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        })),
        ...(cabinets || []).map(item => ({
          ...item,
          item_type: 'cabinet',
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        })),
        ...(tiles || []).map(item => ({
          ...item,
          item_type: 'tile',
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        })),
        ...(paintColors || []).map(item => ({
          ...item,
          item_type: 'paint',
          warranty_expiration: null, // Paints don't have warranties
          homes: item.home_id ? { name: homesMap[item.home_id]?.name } : null
        }))
      ];
      
      return inventoryItems;
      
    } catch (error) {
      console.error('Error in getAllInventoryItems:', error);
      throw error;
    }
  }

  /**
   * Deletes an inventory item based on its type
   */
  static async deleteInventoryItem(itemId: string, itemType: string): Promise<void> {
    let table: string;
    
    switch (itemType) {
      case 'appliance':
        table = 'appliances';
        break;
      case 'filter':
        table = 'filters';
        break;
      case 'light_fixture':
        table = 'light_fixtures';
        break;
      case 'cabinet':
        table = 'cabinets';
        break;
      case 'tile':
        table = 'tiles';
        break;
      case 'paint':
        table = 'paint_colors';
        break;
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', itemId);
      
    if (error) {
      throw new Error(`Error deleting ${itemType}: ${error.message}`);
    }
  }
}