import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useFiltersStore } from '../../../lib/stores/filtersStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import FilterCard from './FilterCard';

export default function FiltersScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const filters = useFiltersStore(state => state.filtersByHome[homeId] || []);
  const loading = useFiltersStore(state => state.loadingByHome[homeId] ?? false);
  const fetchFilters = useFiltersStore(state => state.fetchFilters);
  const setFilters = useFiltersStore(state => state.setFilters);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const lastHomeIdRef = useRef<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchFilters(homeId);
    }
  }, [homeId, fetchFilters]);

  // Real-time subscription
  const handleFilterChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useFiltersStore.getState();
    const currentFilters = store.filtersByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      const newFilter = payload.new;
      const normalizedFilter = { ...newFilter, room: newFilter.room ?? newFilter.location ?? null };
      if (!currentFilters.some(f => f.id === normalizedFilter.id)) {
        setFilters(homeId, [normalizedFilter, ...currentFilters]);
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedFilter = payload.new;
      const normalizedFilter = { ...updatedFilter, room: updatedFilter.room ?? updatedFilter.location ?? null };
      setFilters(homeId, currentFilters.map(f => f.id === normalizedFilter.id ? normalizedFilter : f));
    } else if (payload.eventType === 'DELETE') {
      setFilters(homeId, currentFilters.filter(f => f.id !== payload.old.id));
    }
  }, [homeId, setFilters]);

  useRealTimeSubscription(
    { table: 'filters', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleFilterChange
  );

  const uniqueTypes = Array.from(new Set(filters.map(f => f.type).filter(Boolean))) as string[];
  const uniqueSizes = Array.from(new Set(filters.map(f => f.size).filter(Boolean))) as string[];

  const filteredData = filters.filter(f => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (f.room?.toLowerCase().includes(searchLower)) ||
      (f.name?.toLowerCase().includes(searchLower)) ||
      (f.brand?.toLowerCase().includes(searchLower));

    const matchesType = !selectedType || f.type === selectedType;
    const matchesSize = !selectedSize || f.size === selectedSize;

    return matchesSearch && matchesType && matchesSize;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader
        title="Filters"
        showBackButton
        onAddPress={() => router.push(`/(home)/${homeId}/filters/add`)}
      />

      <View style={styles.filterSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search filters or locations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {(uniqueTypes.length > 0 || uniqueSizes.length > 0) && (
          <View style={styles.chipsContainer}>
            {uniqueTypes.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: !selectedType ? colors.primary : colors.surface, borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedType(null)}
                >
                  <Text style={[styles.chipText, { color: !selectedType ? '#fff' : colors.text }]}>All Types</Text>
                </TouchableOpacity>
                {uniqueTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      { backgroundColor: selectedType === type ? colors.primary : colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.chipText, { color: selectedType === type ? '#fff' : colors.text }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {uniqueSizes.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { backgroundColor: !selectedSize ? colors.primary : colors.surface, borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedSize(null)}
                >
                  <Text style={[styles.chipText, { color: !selectedSize ? '#fff' : colors.text }]}>All Sizes</Text>
                </TouchableOpacity>
                {uniqueSizes.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.chip,
                      { backgroundColor: selectedSize === size ? colors.primary : colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.chipText, { color: selectedSize === size ? '#fff' : colors.text }]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={({ item }) => <FilterCard filter={item as any} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {filters.length === 0 ? "No filters added yet." : "No filters match your search."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  chipsContainer: {
    gap: 8,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  }
}); 