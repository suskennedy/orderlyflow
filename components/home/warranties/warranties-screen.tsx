import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useWarrantiesStore } from '../../../lib/stores/warrantiesStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import WarrantyCard from './WarrantyCard';

export default function WarrantiesScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const warranties = useWarrantiesStore(state => state.warrantiesByHome[homeId] || []);
  const loading = useWarrantiesStore(state => state.loadingByHome[homeId] ?? false);
  const fetchWarranties = useWarrantiesStore(state => state.fetchWarranties);
  const setWarranties = useWarrantiesStore(state => state.setWarranties);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const lastHomeIdRef = useRef<string | null>(null);
  
  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchWarranties(homeId);
    }
  }, [homeId, fetchWarranties]);
  
  // Real-time subscription
  const handleWarrantyChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useWarrantiesStore.getState();
    const currentWarranties = store.warrantiesByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      const newWarranty = payload.new;
      if (!currentWarranties.some(w => w.id === newWarranty.id)) {
        setWarranties(homeId, [newWarranty, ...currentWarranties]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setWarranties(homeId, currentWarranties.map(w => w.id === payload.new.id ? payload.new : w));
    } else if (payload.eventType === 'DELETE') {
      setWarranties(homeId, currentWarranties.filter(w => w.id !== payload.old.id));
    }
  }, [homeId, setWarranties]);
  
  useRealTimeSubscription(
    { table: 'warranties', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleWarrantyChange
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Warranties" 
        showBackButton
        onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/warranties/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={warranties}
          renderItem={({ item }) => <WarrantyCard warranty={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No warranties added yet.</Text>
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