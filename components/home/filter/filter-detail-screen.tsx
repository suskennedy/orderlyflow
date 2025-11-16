import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useFiltersStore } from '../../../lib/stores/filtersStore';


interface Filter {
  id: string;
  name: string;
  room: string;
  type?: string | null;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  last_replaced?: string | null;
  replacement_frequency?: number | null;
  notes?: string | null;
}

function FilterDetailScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const filters = useFiltersStore(state => state.filtersByHome[homeId] || []);
  const deleteFilter = useFiltersStore(state => state.deleteFilter);
  const fetchFilters = useFiltersStore(state => state.fetchFilters);
  const setFilters = useFiltersStore(state => state.setFilters);
  
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
  const params = useLocalSearchParams();
  const filterId = params.id as string;

  const [filter, setFilter] = useState<Filter | null>(null);

  useEffect(() => {
    const foundFilter = filters.find((f: any) => f.id === filterId);
    if (foundFilter) {
      setFilter(foundFilter as Filter);
    }
  }, [filters, filterId]);

  const handleEdit = () => {
    router.push(`/(home)/${params.homeId}/filters/${filterId}/edit`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Filter',
      `Are you sure you want to delete "${filter?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFilter(homeId, filterId);
              router.back();
            } catch (error) {
              console.error('Error deleting filter:', error);
              Alert.alert('Error', 'Failed to delete filter');
            }
          }
        }
      ]
    );
  };

  if (!filter) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filter Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Filter not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Filter Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="funnel" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{filter.name}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{filter.room}</Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{filter.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Room</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{filter.room}</Text>
          </View>

          {filter.type && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{filter.type}</Text>
            </View>
          )}

          {filter.brand && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Brand</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{filter.brand}</Text>
            </View>
          )}

          {filter.model && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Model</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{filter.model}</Text>
            </View>
          )}

          {filter.size && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Size</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{filter.size}</Text>
            </View>
          )}
        </View>

        {/* Maintenance Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maintenance Information</Text>
          
          {filter.last_replaced && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Replaced</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(filter.last_replaced).toLocaleDateString()}
              </Text>
            </View>
          )}

          {filter.replacement_frequency && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Replacement Frequency</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {filter.replacement_frequency} months
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {filter.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{filter.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Edit Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Delete Filter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default function FilterDetailScreenWrapper() {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  
  return <FilterDetailScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
