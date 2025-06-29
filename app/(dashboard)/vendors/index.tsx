import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
}

export default function VendorsScreen() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: '',
    contact_name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchVendors();
    }
  }, [user?.id]);

  const fetchVendors = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const addVendor = async () => {
    if (!newVendor.name.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    try {
      const { error } = await supabase.from('vendors').insert([
        {
          name: newVendor.name,
          category: newVendor.category || null,
          contact_name: newVendor.contact_name || null,
          phone: newVendor.phone || null,
          email: newVendor.email || null,
          website: newVendor.website || null,
          address: newVendor.address || null,
          notes: newVendor.notes || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      setNewVendor({
        name: '',
        category: '',
        contact_name: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        notes: '',
      });
      setShowAddForm(false);
      fetchVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor');
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    Linking.openURL(url);
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'plumber': return 'water';
      case 'electrician': return 'flash';
      case 'hvac': return 'thermometer';
      case 'landscaping': return 'leaf';
      case 'cleaning': return 'sparkles';
      case 'handyman': return 'hammer';
      case 'contractor': return 'construct';
      case 'painter': return 'brush';
      case 'roofer': return 'home';
      case 'flooring': return 'grid';
      case 'appliance repair': return 'build';
      case 'pest control': return 'bug';
      case 'security': return 'shield-checkmark';
      case 'pool service': return 'water';
      default: return 'person';
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'plumber': return '#3B82F6';
      case 'electrician': return '#F59E0B';
      case 'hvac': return '#EF4444';
      case 'landscaping': return '#10B981';
      case 'cleaning': return '#8B5CF6';
      case 'handyman': return '#F97316';
      case 'contractor': return '#6B7280';
      case 'painter': return '#EC4899';
      case 'roofer': return '#84CC16';
      case 'flooring': return '#14B8A6';
      case 'appliance repair': return '#F59E0B';
      case 'pest control': return '#DC2626';
      case 'security': return '#1F2937';
      case 'pool service': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  const renderVendorCard = ({ item }: { item: Vendor }) => (
    <View style={styles.vendorCard}>
      <View style={styles.vendorHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
          <Ionicons 
            name={getCategoryIcon(item.category) as any} 
            size={24} 
            color={getCategoryColor(item.category)} 
          />
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.name}</Text>
          {item.category && (
            <Text style={styles.vendorCategory}>{item.category}</Text>
          )}
          {item.contact_name && (
            <Text style={styles.contactName}>Contact: {item.contact_name}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.contactActions}>
        {item.phone && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCall(item.phone!)}
          >
            <Ionicons name="call" size={16} color="#4F46E5" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        {item.email && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEmail(item.email!)}
          >
            <Ionicons name="mail" size={16} color="#4F46E5" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        )}
        {item.website && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleWebsite(item.website!)}
          >
            <Ionicons name="globe" size={16} color="#4F46E5" />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.address && (
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.addressText}>{item.address}</Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Vendors Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add vendors to keep track of your trusted service providers
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(dashboard)/vendors/add')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Vendor</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading vendors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderVendorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          vendors.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {vendors.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(dashboard)/vendors/add')}
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
  vendorCard: {
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
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 14,
    color: '#6B7280',
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  notesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
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