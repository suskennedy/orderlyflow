import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Filters" 
        showBackButton
        onAddPress={() => router.push(`/(home)/${homeId}/filters/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filters}
          renderItem={({ item }) => <FilterCard filter={item as any} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No filters added yet.</Text>
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
  list: {
    padding: 20,
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