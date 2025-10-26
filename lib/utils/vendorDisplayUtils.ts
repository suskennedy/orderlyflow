// lib/utils/vendorDisplayUtils.ts
import { Vendor } from '../contexts/VendorsContext';

export interface VendorDisplayInfo {
  vendorNames: string[];
  displayText: string;
  hasVendors: boolean;
  vendorCount: number;
}

/**
 * Unified utility to get vendor display information for any entity type
 * Handles different vendor field patterns across projects, repairs, and tasks
 */
export const getVendorDisplayInfo = (entity: any, vendors: Vendor[]): VendorDisplayInfo => {
  let vendorIds: string[] = [];
  
  // Handle different vendor field patterns
  if (entity.vendor_ids && Array.isArray(entity.vendor_ids)) {
    // Projects: multiple vendors (new schema)
    vendorIds = entity.vendor_ids;
  } else if (entity.vendor_id) {
    // Repairs: single vendor
    vendorIds = [entity.vendor_id];
  } else if (entity.assigned_vendor_id) {
    // Tasks: single vendor (projects no longer use this field)
    vendorIds = [entity.assigned_vendor_id];
  }
  
  // Filter out null/undefined IDs and get vendor names
  const vendorNames = vendorIds
    .filter(id => id != null)
    .map(id => vendors.find(v => v.id === id)?.name)
    .filter(Boolean) as string[];
  
  const vendorCount = vendorNames.length;
  const hasVendors = vendorCount > 0;
  
  // Generate display text
  let displayText = 'Not assigned';
  if (vendorCount === 1) {
    displayText = vendorNames[0];
  } else if (vendorCount > 1) {
    displayText = `${vendorCount} vendors assigned`;
  }
  
  return {
    vendorNames,
    displayText,
    hasVendors,
    vendorCount
  };
};

/**
 * Get simple vendor display text for quick display
 */
export const getVendorDisplayText = (entity: any, vendors: Vendor[]): string => {
  return getVendorDisplayInfo(entity, vendors).displayText;
};

/**
 * Get vendor names array for detailed display
 */
export const getVendorNames = (entity: any, vendors: Vendor[]): string[] => {
  return getVendorDisplayInfo(entity, vendors).vendorNames;
};

/**
 * Check if entity has any vendors assigned
 */
export const hasVendorsAssigned = (entity: any, vendors: Vendor[]): boolean => {
  return getVendorDisplayInfo(entity, vendors).hasVendors;
};

/**
 * Get vendor count for the entity
 */
export const getVendorCount = (entity: any, vendors: Vendor[]): number => {
  return getVendorDisplayInfo(entity, vendors).vendorCount;
};

/**
 * Get vendor objects for detailed operations
 */
export const getVendorObjects = (entity: any, vendors: Vendor[]): Vendor[] => {
  let vendorIds: string[] = [];
  
  if (entity.vendor_ids && Array.isArray(entity.vendor_ids)) {
    vendorIds = entity.vendor_ids;
  } else if (entity.vendor_id) {
    vendorIds = [entity.vendor_id];
  } else if (entity.assigned_vendor_id) {
    // Tasks: single vendor (projects no longer use this field)
    vendorIds = [entity.assigned_vendor_id];
  }
  
  return vendorIds
    .filter(id => id != null)
    .map(id => vendors.find(v => v.id === id))
    .filter(Boolean) as Vendor[];
};
