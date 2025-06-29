import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendors } from '../../../lib/contexts/VendorsContext';
import { useAuth } from '../../../lib/hooks/useAuth';

interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

export default function VendorsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { vendors, loading, refreshing, deleteVendor, onRefresh } = useVendors();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleDeletePress = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedVendor) {
      await deleteVendor(selectedVendor.id);
      setShowDeleteModal(false);
      setSelectedVendor(null);
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

  const renderStats = () => {
    const totalVendors = vendors.length;
    const contractorVendors = vendors.filter(vendor => vendor.category === 'contractor').length;
    const supplierVendors = vendors.filter(vendor => vendor.category === 'supplier').length;
    const serviceVendors = vendors.filter(vendor => vendor.category === 'service').length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalVendors}</Text>
          <Text style={styles.statLabel}>Total Vendors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{contractorVendors}</Text>
          <Text style={styles.statLabel}>Contractors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{supplierVendors}</Text>
          <Text style={styles.statLabel}>Suppliers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{serviceVendors}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
      </View>
    );
  };

  const renderVendorCard = ({ item }: { item: Vendor }) => {
    const categoryColor = getCategoryColor(item.category ?? null);
    const categoryIcon = getCategoryIcon(item.category ?? null);

    return (
      <View style={styles.vendorCard}>
        <View style={styles.cardHeader}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorTitleRow}>
              <View style={[styles.categoryIcon, { backgroundColor: `${categoryColor}15` }]}>
                <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
              </View>
              <View style={styles.vendorTitleInfo}>
                <Text style={styles.vendorName}>{item.name}</Text>
                {item.contact_name && (
                  <Text style={styles.contactName}>Contact: {item.contact_name}</Text>
                )}
              </View>
            </View>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          {item.phone && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleCall(item.phone!)}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={16} color="#10B981" />
              </View>
              <Text style={styles.contactText}>{item.phone}</Text>
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleEmail(item.email!)}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.contactText}>{item.email}</Text>
            </TouchableOpacity>
          )}
          {item.website && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleWebsite(item.website!)}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="globe" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.contactText}>{item.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.address && (
          <View style={styles.addressSection}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="location" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Vendors Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first vendor to start managing your home service contacts
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/vendors/add')}
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Vendors</Text>
          <Text style={styles.subtitle}>Manage your contacts</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/vendors/add')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {vendors.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={vendors}
            renderItem={renderVendorCard}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.modalTitle}>Delete Vendor</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete {selectedVendor?.name}? This action cannot be undone.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  vendorsSection: {
    marginBottom: 20,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorTitleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  specialtyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactSection: {
    marginTop: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  addressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  deleteConfirmButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  emptyButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 