import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  manual_url: string | null;
  home_id: string | null;
  notes: string | null;
  created_at: string | null;
  homes?: {
    name: string;
  } | null;
}

const INVENTORY_TYPES = [
  { key: 'appliance', label: 'Appliances', icon: 'tv-outline' },
  { key: 'filter', label: 'Filters', icon: 'funnel-outline' },
  { key: 'fixture', label: 'Light Fixtures', icon: 'bulb-outline' },
  { key: 'cabinet', label: 'Cabinets', icon: 'library-outline' },
  { key: 'tile', label: 'Tiles', icon: 'grid-outline' },
  { key: 'paint', label: 'Paint Colors', icon: 'color-palette-outline' },
  { key: 'infrastructure', label: 'Infrastructure', icon: 'construct-outline' },
];

export default function InventoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('appliances')
        .select(`
          *,
          homes (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const getCategoryIcon = (brand: string | null) => {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('samsung') || brandLower.includes('lg') || brandLower.includes('whirlpool')) return 'tv';
    if (brandLower.includes('carrier') || brandLower.includes('trane')) return 'thermometer';
    if (brandLower.includes('kohler') || brandLower.includes('moen')) return 'water';
    if (brandLower.includes('ge') || brandLower.includes('square d')) return 'flash';
    return 'cube';
  };

  const getCategoryColor = (brand: string | null) => {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('samsung') || brandLower.includes('lg') || brandLower.includes('whirlpool')) return '#3B82F6';
    if (brandLower.includes('carrier') || brandLower.includes('trane')) return '#EF4444';
    if (brandLower.includes('kohler') || brandLower.includes('moen')) return '#06B6D4';
    if (brandLower.includes('ge') || brandLower.includes('square d')) return '#F59E0B';
    return '#6B7280';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isWarrantyExpiring = (warrantyDate: string | null) => {
    if (!warrantyDate) return false;
    const warranty = new Date(warrantyDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return warranty <= thirtyDaysFromNow && warranty >= today;
  };

  const isWarrantyExpired = (warrantyDate: string | null) => {
    if (!warrantyDate) return false;
    return new Date(warrantyDate) < new Date();
  };

  const renderInventoryCard = ({ item }: { item: InventoryItem }) => (
    <View style={styles.inventoryCard}>
      <View style={styles.itemHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(item.brand)}20` }]}>
          <Ionicons 
            name={getCategoryIcon(item.brand) as any} 
            size={24} 
            color={getCategoryColor(item.brand)} 
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.brand && item.model && (
            <Text style={styles.itemModel}>{item.brand} - {item.model}</Text>
          )}
          {item.brand && (
            <Text style={styles.itemCategory}>{item.brand}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemDetails}>
        {item.serial_number && (
          <View style={styles.detailRow}>
            <Ionicons name="barcode" size={16} color="#6B7280" />
            <Text style={styles.detailText}>S/N: {item.serial_number}</Text>
          </View>
        )}
        
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        
        {item.manual_url && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Manual Available</Text>
          </View>
        )}
      </View>

      <View style={styles.itemMeta}>
        {item.purchase_date && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Purchased</Text>
            <Text style={styles.metaValue}>{formatDate(item.purchase_date)}</Text>
          </View>
        )}
        
        {item.warranty_expiration && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Warranty</Text>
            <Text style={[
              styles.metaValue,
              isWarrantyExpired(item.warranty_expiration) && styles.expiredWarranty,
              isWarrantyExpiring(item.warranty_expiration) && styles.expiringWarranty
            ]}>
              {formatDate(item.warranty_expiration)}
            </Text>
          </View>
        )}
      </View>

      {item.homes?.name && (
        <View style={styles.homeContainer}>
          <Ionicons name="home" size={14} color="#6B7280" />
          <Text style={styles.homeText}>{item.homes.name}</Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Inventory Items</Text>
      <Text style={styles.emptySubtitle}>
        Track your appliances, furniture, and other valuable items
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(dashboard)/inventory/add')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Item</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderInventoryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          items.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(dashboard)/inventory/add')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemModel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  itemDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  expiredWarranty: {
    color: '#EF4444',
  },
  expiringWarranty: {
    color: '#F59E0B',
  },
  homeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  homeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
}); 