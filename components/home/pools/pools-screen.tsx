import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { usePoolsStore } from '../../../lib/stores/poolsStore';
import { matchesHomeScopedRow } from '../../../lib/utils/realtimeHomeScoped';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import PoolCard from './PoolCard';


const EMPTY_ARRAY: any[] = [];
export default function PoolsScreen() {
    const { homeId } = useLocalSearchParams<{ homeId: string }>();
    const pools = usePoolsStore(state => state.poolsByHome[homeId] || EMPTY_ARRAY);
    const loading = usePoolsStore(state => state.loadingByHome[homeId] ?? false);
    const fetchPools = usePoolsStore(state => state.fetchPools);
    const setPools = usePoolsStore(state => state.setPools);
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const lastHomeIdRef = useRef<string | null>(null);

    // Initial data fetch
    useEffect(() => {
        if (homeId && homeId !== lastHomeIdRef.current) {
            lastHomeIdRef.current = homeId;
            fetchPools(homeId);
        }
    }, [homeId, fetchPools]);

    // Real-time subscription
    const handlePoolChange = useCallback((payload: any) => {
        const store = usePoolsStore.getState();
        const currentPools = store.poolsByHome[homeId] || [];
        const ids = currentPools.map((p) => p.id);
        if (!matchesHomeScopedRow(homeId, payload, ids)) return;
        if (payload.eventType === 'INSERT') {
            const newPool = payload.new;
            if (!currentPools.some(p => p.id === newPool.id)) {
                setPools(homeId, [newPool, ...currentPools]);
            }
        } else if (payload.eventType === 'UPDATE') {
            setPools(homeId, currentPools.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPools(homeId, currentPools.filter(p => p.id !== payload.old.id));
        }
    }, [homeId, setPools]);

    useRealTimeSubscription(
        { table: 'pools', filter: homeId ? `home_id=eq.${homeId}` : undefined },
        handlePoolChange
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScreenHeader
                title="Pools"
                showBackButton
                onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/pools/add`)}
            />
            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={pools}
                    extraData={pools.length}
                    renderItem={({ item }) => <PoolCard pool={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.text }]}>No pools added yet.</Text>
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
