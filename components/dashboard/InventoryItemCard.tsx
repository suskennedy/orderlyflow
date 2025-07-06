import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface InventoryItem {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  location?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  warranty_expiration?: string | null | undefined;
  manual_url?: string | null;
  notes?: string | null;
  home_id?: string | null;
  homes?: { name: string } | null;
  user_id?: string | null;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  onDelete: (item: InventoryItem) => void;
}

export default function InventoryItemCard({ item, onDelete }: InventoryItemCardProps) {
  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    
    try {
      // Parse the ISO date string to a Date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Format the date
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };
  
  // Check if a warranty is active or expired
  const checkWarrantyStatus = (expirationDate: string | null | undefined): 'active' | 'expired' | 'none' => {
    if (!expirationDate) return 'none';
    
    try {
      const expDate = new Date(expirationDate);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(expDate.getTime())) return 'none';
      
      return expDate > today ? 'active' : 'expired';
    } catch (error) {
      console.error('Error checking warranty status:', error);
      return 'none';
    }
  };

  // Determine icon based on item name
  const getItemIcon = () => {
    const name = item.name?.toLowerCase() || '';
    if (name.includes('refrigerator') || name.includes('fridge')) return 'snow';
    if (name.includes('washer') || name.includes('washing')) return 'water';
    if (name.includes('dryer')) return 'flame';
    if (name.includes('dishwasher')) return 'restaurant';
    if (name.includes('oven') || name.includes('stove')) return 'flame';
    if (name.includes('microwave')) return 'radio';
    if (name.includes('tv') || name.includes('television')) return 'tv';
    if (name.includes('air') || name.includes('hvac')) return 'thermometer';
    return 'cube';
  };

  // Handle manual URL opening
  const openManual = () => {
    if (item.manual_url) {
      Linking.openURL(item.manual_url).catch(err => 
        console.error('Error opening manual URL:', err)
      );
    }
  };

  const warrantyStatus = checkWarrantyStatus(item.warranty_expiration);
  const warrantyColor = 
    warrantyStatus === 'active' ? '#10B981' : 
    warrantyStatus === 'expired' ? '#EF4444' : '#6B7280';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.itemTitleRow}>
          <View style={[styles.itemIcon, { backgroundColor: `${warrantyColor}15` }]}>
            <Ionicons name={getItemIcon() as any} size={24} color={warrantyColor} />
          </View>
          <View style={styles.itemTitleInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.brand && (
              <Text style={styles.itemBrand}>{item.brand}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item)}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <Ionicons name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={[styles.warrantyBadge, { backgroundColor: `${warrantyColor}15` }]}>
        <View style={[styles.warrantyDot, { backgroundColor: warrantyColor }]} />
        <Text style={[styles.warrantyText, { color: warrantyColor }]}>
          {warrantyStatus === 'active' ? 'Warranty Active' : 
           warrantyStatus === 'expired' ? 'Warranty Expired' : 'No Warranty'}
        </Text>
      </View>

      <View style={styles.itemDetails}>
        {item.model && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="cube" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>Model: {item.model}</Text>
          </View>
        )}
        {item.serial_number && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="barcode" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>S/N: {item.serial_number}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        {item.purchase_date && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={16} color="#6B7280" />
            </View>
            <Text style={styles.detailText}>
              Purchased: {formatDate(item.purchase_date)}
            </Text>
          </View>
        )}
        {item.warranty_expiration && (
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="shield-checkmark" size={16} color={warrantyColor} />
            </View>
            <Text style={[styles.detailText, { color: warrantyColor }]}>
              Warranty until {formatDate(item.warranty_expiration)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        {item.homes && (
          <View style={styles.homeInfo}>
            <Ionicons name="home" size={16} color="#F59E0B" />
            <Text style={styles.homeText}>{item.homes.name}</Text>
          </View>
        )}

        <View style={styles.footerActions}>
          {item.manual_url && (
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={openManual}
            >
              <Ionicons name="document-text" size={16} color="#4F46E5" />
              <Text style={styles.manualText}>Manual</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push(`/inventory/edit/${item.id}`)}
          >
            <Ionicons name="create-outline" size={16} color="#10B981" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  warrantyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  warrantyText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    gap: 4,
  },
  manualText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});