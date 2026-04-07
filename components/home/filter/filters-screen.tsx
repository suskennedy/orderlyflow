import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useFiltersStore } from '../../../lib/stores/filtersStore';
import { FONTS } from '../../../lib/typography';
import { matchesHomeScopedRow } from '../../../lib/utils/realtimeHomeScoped';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import FilterCard from './FilterCard';


const EMPTY_ARRAY: any[] = [];

// Compact dropdown-style filter selector
function FilterSelector({
  label, options, selected, onSelect, colors,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (val: string | null) => void;
  colors: any;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.selectorBtn}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.selectorValueRow}>
          <Text style={[styles.selectorValue, { color: selected ? colors.primary : colors.text }]} numberOfLines={1}>
            {selected || 'All'}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={[styles.selectorDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.selectorOption, !selected && { backgroundColor: colors.primaryLight }]}
            onPress={() => { onSelect(null); setOpen(false); }}
          >
            <Text style={[styles.selectorOptionText, { color: !selected ? colors.primary : colors.text }]}>All</Text>
            {!selected && <Ionicons name="checkmark" size={14} color={colors.primary} />}
          </TouchableOpacity>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.selectorOption, selected === opt && { backgroundColor: colors.primaryLight }]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.selectorOptionText, { color: selected === opt ? colors.primary : colors.text }]} numberOfLines={1}>{opt}</Text>
              {selected === opt && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function FiltersScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const filters = useFiltersStore(state => state.filtersByHome[homeId] || EMPTY_ARRAY);
  const loading = useFiltersStore(state => state.loadingByHome[homeId] ?? false);
  const fetchFilters = useFiltersStore(state => state.fetchFilters);
  const setFilters = useFiltersStore(state => state.setFilters);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

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
    const store = useFiltersStore.getState();
    const currentFilters = store.filtersByHome[homeId] || [];
    const ids = currentFilters.map((f) => f.id);
    if (!matchesHomeScopedRow(homeId, payload, ids)) return;
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
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setFilters(homeId, currentFilters.filter(f => f.id !== payload.old.id));
    }
  }, [homeId, setFilters]);

  useRealTimeSubscription(
    { table: 'filters', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleFilterChange
  );

  const uniqueTypes = Array.from(new Set(filters.map(f => f.type).filter(Boolean))) as string[];
  const uniqueSizes = Array.from(new Set(filters.map(f => f.size).filter(Boolean))) as string[];
  const uniqueLocations = Array.from(new Set(filters.map(f => f.room).filter(Boolean))) as string[];

  const filteredData = filters.filter(f => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (f.room?.toLowerCase().includes(searchLower)) ||
      (f.name?.toLowerCase().includes(searchLower)) ||
      (f.brand?.toLowerCase().includes(searchLower));

    const matchesType = !selectedType || f.type === selectedType;
    const matchesSize = !selectedSize || f.size === selectedSize;
    const matchesLocation = !selectedLocation || f.room === selectedLocation;

    return matchesSearch && matchesType && matchesSize && matchesLocation;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Filters"
        showBackButton
        onAddPress={() => router.push(`/(home)/${homeId}/filters/add`)}
      />

      <View style={styles.filterSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, room, or brand..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Active filter summary pills */}
        {(selectedLocation || selectedType || selectedSize) && (
          <View style={styles.activeFiltersRow}>
            <Text style={[styles.activeFiltersLabel, { color: colors.textSecondary }]}>Filtering by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
              {selectedLocation && (
                <TouchableOpacity
                  style={[styles.activeChip, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedLocation(null)}
                >
                  <Ionicons name="location-outline" size={12} color="#fff" />
                  <Text style={styles.activeChipText}>{selectedLocation}</Text>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              )}
              {selectedType && (
                <TouchableOpacity
                  style={[styles.activeChip, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedType(null)}
                >
                  <Ionicons name="funnel-outline" size={12} color="#fff" />
                  <Text style={styles.activeChipText}>{selectedType}</Text>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              )}
              {selectedSize && (
                <TouchableOpacity
                  style={[styles.activeChip, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedSize(null)}
                >
                  <Ionicons name="resize-outline" size={12} color="#fff" />
                  <Text style={styles.activeChipText}>{selectedSize}</Text>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.clearAllChip, { borderColor: colors.border }]}
                onPress={() => { setSelectedLocation(null); setSelectedType(null); setSelectedSize(null); }}
              >
                <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>Clear all</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Filter selectors — grouped row */}
        {(uniqueTypes.length > 0 || uniqueSizes.length > 0 || uniqueLocations.length > 0) && (
          <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {uniqueLocations.length > 0 && (
              <FilterSelector
                label="Location"
                options={uniqueLocations}
                selected={selectedLocation}
                onSelect={setSelectedLocation}
                colors={colors}
              />
            )}
            {uniqueLocations.length > 0 && uniqueTypes.length > 0 && (
              <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
            )}
            {uniqueTypes.length > 0 && (
              <FilterSelector
                label="Type"
                options={uniqueTypes}
                selected={selectedType}
                onSelect={setSelectedType}
                colors={colors}
              />
            )}
            {uniqueTypes.length > 0 && uniqueSizes.length > 0 && (
              <View style={[styles.filterDivider, { backgroundColor: colors.border }]} />
            )}
            {uniqueSizes.length > 0 && (
              <FilterSelector
                label="Size"
                options={uniqueSizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
                colors={colors}
              />
            )}
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredData}
          extraData={`${filters.length}-${searchQuery}-${selectedType}-${selectedSize}-${selectedLocation}`}
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
  container: { flex: 1 },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 42,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginTop: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.body,
    paddingVertical: 0,
    margin: 0,
    lineHeight: 22,
  },
  // Active filter pills
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  clearAllChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Filter bar
  filterBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'visible',
  },
  filterDivider: {
    width: 1,
    marginVertical: 10,
  },
  // Selector
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectorValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  selectorDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    marginTop: 4,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectorOptionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
  },
}); 