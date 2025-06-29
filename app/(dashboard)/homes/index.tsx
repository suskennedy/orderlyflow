import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Home {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_footage: number | null;
  year_built: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
}

export default function HomesScreen() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHome, setNewHome] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    square_footage: '',
    year_built: '',
    purchase_date: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    }
  }, [user?.id]);

  const fetchHomes = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
      Alert.alert('Error', 'Failed to load homes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomes();
  };

  const addHome = async () => {
    if (!newHome.name.trim()) {
      Alert.alert('Error', 'Please enter a home name');
      return;
    }

    try {
      const { error } = await supabase.from('homes').insert([
        {
          name: newHome.name,
          address: newHome.address || null,
          city: newHome.city || null,
          state: newHome.state || null,
          zip: newHome.zip || null,
          bedrooms: newHome.bedrooms ? parseInt(newHome.bedrooms) : null,
          bathrooms: newHome.bathrooms ? parseFloat(newHome.bathrooms) : null,
          square_footage: newHome.square_footage ? parseInt(newHome.square_footage) : null,
          year_built: newHome.year_built ? parseInt(newHome.year_built) : null,
          purchase_date: newHome.purchase_date || null,
          notes: newHome.notes || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      setNewHome({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        bedrooms: '',
        bathrooms: '',
        square_footage: '',
        year_built: '',
        purchase_date: '',
        notes: '',
      });
      setShowAddForm(false);
      fetchHomes();
    } catch (error) {
      console.error('Error adding home:', error);
      Alert.alert('Error', 'Failed to add home');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderHomeCard = ({ item }: { item: Home }) => (
    <TouchableOpacity style={styles.homeCard}>
      <View style={styles.homeHeader}>
        <View style={styles.homeIconContainer}>
          <Ionicons name="business" size={24} color="#4F46E5" />
        </View>
        <View style={styles.homeInfo}>
          <Text style={styles.homeName}>{item.name}</Text>
          {item.address && (
            <Text style={styles.homeAddress}>
              {item.address}
              {item.city && `, ${item.city}`}
              {item.state && `, ${item.state}`}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.homeDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="bed" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.bedrooms || 'N/A'} {item.bedrooms === 1 ? 'bed' : 'beds'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.bathrooms || 'N/A'} {item.bathrooms === 1 ? 'bath' : 'baths'}
            </Text>
          </View>
        </View>
        
        {item.square_footage && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="resize" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.square_footage.toLocaleString()} sq ft</Text>
            </View>
          </View>
        )}
        
        {item.purchase_date && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Purchased {formatDate(item.purchase_date)}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Homes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first home to start managing your property information
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(dashboard)/homes/add')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Home</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading homes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={homes}
        renderItem={renderHomeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          homes.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {homes.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(dashboard)/homes/add')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  homeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  homeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
}); 