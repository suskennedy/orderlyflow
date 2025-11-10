import { useCallback, useEffect } from 'react';
import { Filter, useFiltersStore } from '../stores/filtersStore';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useFilters(homeId: string) {
  const {
    filtersByHome,
    loadingByHome,
    fetchFilters,
    setFilters,
    setLoading,
    createFilter,
    updateFilter,
    deleteFilter,
  } = useFiltersStore();

  const filters = filtersByHome[homeId] || [];
  const loading = loadingByHome[homeId] ?? false;

  // Handle real-time changes
  const handleFilterChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) {
      return; // Not for this home
    }

    console.log('🔥 Real-time filter change:', payload);
    const store = useFiltersStore.getState();
    const currentFilters = store.filtersByHome[homeId] || [];

    if (payload.eventType === 'INSERT') {
      const newFilter = payload.new as Filter;
      // Normalize the filter (handle location -> room migration)
      const normalizedFilter: Filter = {
        ...newFilter,
        room: newFilter.room ?? (payload.new as any).location ?? null,
      };
      if (!currentFilters.some(f => f.id === normalizedFilter.id)) {
        setFilters(homeId, [normalizedFilter, ...currentFilters]);
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedFilter = payload.new as Filter;
      const normalizedFilter: Filter = {
        ...updatedFilter,
        room: updatedFilter.room ?? (payload.new as any).location ?? null,
      };
      setFilters(
        homeId,
        currentFilters.map(filter =>
          filter.id === normalizedFilter.id ? normalizedFilter : filter
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setFilters(
        homeId,
        currentFilters.filter(filter => filter.id !== payload.old.id)
      );
    }
  }, [homeId, setFilters]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'filters',
      filter: homeId ? `home_id=eq.${homeId}` : undefined,
    },
    handleFilterChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchFilters(homeId);
    } else {
      setFilters(homeId, []);
      setLoading(homeId, false);
    }
  }, [homeId, fetchFilters, setFilters, setLoading]);

  return {
    filters,
    loading,
    createFilter: (filterData: Omit<Filter, 'id' | 'created_at' | 'updated_at' | 'home_id'>) =>
      createFilter(homeId, filterData),
    updateFilter: (id: string, updates: Partial<Filter>) =>
      updateFilter(homeId, id, updates),
    deleteFilter: (id: string) => deleteFilter(homeId, id),
  };
}

