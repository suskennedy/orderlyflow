import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useHomes } from '../../../lib/hooks/useHomes';
import { supabase } from '../../../lib/supabase';

type InventoryCategory = 'appliances' | 'filters' | 'light_fixtures' | 'paint_colors' | 'tiles' | 'cabinets' | 'infrastructure_locations';

interface InventoryItem {
  id: string;
  name: string;
  type?: string | null;
  category?: string | null;
  brand?: string | null;
  location?: string | null;
  created_at?: string | null;
}

interface CategoryData {
  title: string;
  icon: string;
  items: InventoryItem[];
  addRoute: string;
}

export default function Inventory() {
  const { currentHome } = useHomes();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Record<InventoryCategory, CategoryData>>({
    appliances: { title: 'Appliances', icon: 'construct-outline', items: [], addRoute: '/inventory/appliances/add' },
    filters: { title: 'Filters', icon: 'filter-outline', items: [], addRoute: '/inventory/filters/add' },
    light_fixtures: { title: 'Light Fixtures', icon: 'bulb-outline', items: [], addRoute: '/inventory/lights/add' },
    paint_colors: { title: 'Paint Colors', icon: 'color-palette-outline', items: [], addRoute: '/inventory/paint/add' },
    tiles: { title: 'Tiles', icon: 'grid-outline', items: [], addRoute: '/inventory/tiles/add' },
    cabinets: { title: 'Cabinets', icon: 'cube-outline', items: [], addRoute: '/inventory/cabinets/add' },
    infrastructure_locations: { title: 'Infrastructure', icon: 'build-outline', items: [], addRoute: '/inventory/infrastructure/add' },
  });

  useEffect(() => {
    if (currentHome) {
      fetchInventoryData();
    }
  }, [currentHome]);

  const fetchInventoryData = async () => {
    if (!currentHome) return;

    try {
      setLoading(true);
      
      // Fetch all inventory data in parallel
      const [
        appliances,
        filters,
        lightFixtures,
        paintColors,
        tiles,
        cabinets,
        infrastructure,
      ] = await Promise.all([
        supabase.from('appliances').select('*').eq('home_id', currentHome.id),
        supabase.from('filters').select('*').eq('home_id', currentHome.id),
        supabase.from('light_fixtures').select('*').eq('home_id', currentHome.id),
        supabase.from('paint_colors').select('*').eq('home_id', currentHome.id),
        supabase.from('tiles').select('*').eq('home_id', currentHome.id),
        supabase.from('cabinets').select('*').eq('home_id', currentHome.id),
        supabase.from('infrastructure_locations').select('*').eq('home_id', currentHome.id),
      ]);

      setCategories(prev => ({
        ...prev,
        appliances: { ...prev.appliances, items: appliances.data || [] },
        filters: { ...prev.filters, items: filters.data || [] },
        light_fixtures: { ...prev.light_fixtures, items: lightFixtures.data || [] },
        paint_colors: { ...prev.paint_colors, items: paintColors.data || [] },
        tiles: { ...prev.tiles, items: tiles.data || [] },
        cabinets: { ...prev.cabinets, items: cabinets.data || [] },
        infrastructure_locations: { ...prev.infrastructure_locations, items: infrastructure.data || [] },
      }));
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = (items: InventoryItem[]) => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getTotalItems = () => {
    return Object.values(categories).reduce((total, category) => total + category.items.length, 0);
  };

  const getFilteredTotal = () => {
    return Object.values(categories).reduce((total, category) => 
      total + getFilteredItems(category.items).length, 0
    );
  };

  const handleAddItem = (category: string) => {
    // TODO: Implement navigation to add item screens
    console.log('Add item for category:', category);
  };

  const handleViewItem = (category: string, itemId: string) => {
    // TODO: Implement navigation to item details
    console.log('View item:', category, itemId);
  };

  if (loading) {
    return <LoadingSpinner text="Loading inventory..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>
            {searchQuery ? `${getFilteredTotal()} of ${getTotalItems()}` : `${getTotalItems()}`} items
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(categories).map(([key, category]) => {
          const filteredItems = getFilteredItems(category.items);
          
          if (searchQuery && filteredItems.length === 0) return null;

          return (
            <View key={key} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name={category.icon as any} size={24} color="#4F46E5" />
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <View style={styles.categoryCount}>
                    <Text style={styles.categoryCountText}>{filteredItems.length}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.addCategoryButton}
                  onPress={() => handleAddItem(key)}
                >
                  <Ionicons name="add" size={20} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {filteredItems.length > 0 ? (
                <View style={styles.itemsList}>
                  {filteredItems.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.itemCard}
                      onPress={() => handleViewItem(key, item.id)}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemMeta}>
                          {item.brand && (
                            <Text style={styles.itemMetaText}>Brand: {item.brand}</Text>
                          )}
                          {item.location && (
                            <Text style={styles.itemMetaText}>Location: {item.location}</Text>
                          )}
                          {item.type && (
                            <Text style={styles.itemMetaText}>Type: {item.type}</Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCategory}>
                  <Text style={styles.emptyCategoryText}>
                    No {category.title.toLowerCase()} added yet
                  </Text>
                  <TouchableOpacity 
                    style={styles.addFirstButton}
                    onPress={() => handleAddItem(key)}
                  >
                    <Text style={styles.addFirstButtonText}>Add First Item</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {getTotalItems() === 0 && !searchQuery && (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No inventory items</Text>
            <Text style={styles.emptyDescription}>
              Start building your home inventory by adding appliances, filters, and other items.
            </Text>
          </View>
        )}

        {searchQuery && getFilteredTotal() === 0 && getTotalItems() > 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search terms or browse all categories.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  categoryCount: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  addCategoryButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemMeta: {
    gap: 2,
  },
  itemMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyCategory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addFirstButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
