import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { usePaintsStore } from '../../../lib/stores/paintsStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import PaintColorCard from './PaintColorCard';

export default function PaintColorsScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const paints = usePaintsStore(state => state.paintsByHome[homeId] || []);
  const loading = usePaintsStore(state => state.loadingByHome[homeId] ?? false);
  const fetchPaints = usePaintsStore(state => state.fetchPaints);
  const setPaints = usePaintsStore(state => state.setPaints);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const lastHomeIdRef = useRef<string | null>(null);
  
  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchPaints(homeId);
    }
  }, [homeId, fetchPaints]);
  
  // Real-time subscription
  const handlePaintChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = usePaintsStore.getState();
    const currentPaints = store.paintsByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      const newPaint = payload.new;
      if (!currentPaints.some(p => p.id === newPaint.id)) {
        setPaints(homeId, [newPaint, ...currentPaints]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setPaints(homeId, currentPaints.map(p => p.id === payload.new.id ? payload.new : p));
    } else if (payload.eventType === 'DELETE') {
      setPaints(homeId, currentPaints.filter(p => p.id !== payload.old.id));
    }
  }, [homeId, setPaints]);
  
  useRealTimeSubscription(
    { table: 'paint_colors', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handlePaintChange
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Paint Colors" 
        showBackButton
        onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/paints/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={paints}
          renderItem={({ item }) => <PaintColorCard paint={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No paint colors added yet.</Text>
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