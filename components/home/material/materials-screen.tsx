import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useMaterialsStore } from '../../../lib/stores/materialsStore';

import ScreenHeader from '../../layouts/layout/ScreenHeader';
import MaterialCard from './MaterialCard';

export default function MaterialsScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const materials = useMaterialsStore(state => state.materialsByHome[homeId] || []);
  const loading = useMaterialsStore(state => state.loadingByHome[homeId] ?? false);
  const fetchMaterials = useMaterialsStore(state => state.fetchMaterials);
  const setMaterials = useMaterialsStore(state => state.setMaterials);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const lastHomeIdRef = useRef<string | null>(null);
  
  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchMaterials(homeId);
    }
  }, [homeId, fetchMaterials]);
  
  // Real-time subscription
  const handleMaterialChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useMaterialsStore.getState();
    const currentMaterials = store.materialsByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      const newMaterial = payload.new;
      if (!currentMaterials.some(m => m.id === newMaterial.id)) {
        setMaterials(homeId, [newMaterial, ...currentMaterials]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setMaterials(homeId, currentMaterials.map(m => m.id === payload.new.id ? payload.new : m));
    } else if (payload.eventType === 'DELETE') {
      setMaterials(homeId, currentMaterials.filter(m => m.id !== payload.old.id));
    }
  }, [homeId, setMaterials]);
  
  useRealTimeSubscription(
    { table: 'materials', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleMaterialChange
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Materials" 
        showBackButton
        onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/materials/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={materials}
          renderItem={({ item }) => <MaterialCard material={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No materials added yet.</Text>
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