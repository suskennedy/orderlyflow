// lib/utils/homeDisplayUtils.ts
import { Home } from '../stores/homesStore';

export interface HomeDisplayInfo {
  homeName: string;
  homeId: string | null;
  hasHome: boolean;
}

/**
 * Unified utility to get home display information for any entity type
 * Handles home_id field across all entity types (projects, repairs, tasks)
 */
export const getHomeDisplayInfo = (entity: any, homes: Home[]): HomeDisplayInfo => {
  const homeId = entity.home_id || null;
  const hasHome = homeId != null;
  
  let homeName = 'No home assigned';
  if (hasHome) {
    const home = homes.find(h => h.id === homeId);
    homeName = home?.name || 'Unknown Home';
  }
  
  return {
    homeName,
    homeId,
    hasHome
  };
};

/**
 * Get simple home display text for quick display
 */
export const getHomeDisplayText = (entity: any, homes: Home[]): string => {
  return getHomeDisplayInfo(entity, homes).homeName;
};

/**
 * Get home object for detailed operations
 */
export const getHomeObject = (entity: any, homes: Home[]): Home | null => {
  const homeId = entity.home_id;
  if (!homeId) return null;
  
  return homes.find(h => h.id === homeId) || null;
};

/**
 * Check if entity has a home assigned
 */
export const hasHomeAssigned = (entity: any): boolean => {
  return entity.home_id != null;
};

/**
 * Get home ID for the entity
 */
export const getHomeId = (entity: any): string | null => {
  return entity.home_id || null;
};
