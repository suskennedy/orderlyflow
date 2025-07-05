import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInventory } from '../../../lib/contexts/InventoryContext';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, refreshing, deleteItem, onRefresh } = useInventory();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleDeletePress = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id);
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    
    try {
      // Parse the ISO date string to a Date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Format the date as MM/DD/YYYY
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };
  
  // Check if a warranty is active or expired
  const checkWarrantyStatus = (expirationDate: string | null): 'active' | 'expired' | 'none' => {
    if (!expirationDate) return 'none';
    
    try {
      const expDate = new Date(expirationDate);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(expDate.getTime())) return 'none';
      
      return expDate > today ? 'active' : 'expired';
    } catch (error) {
      console.error('Error checking warranty status:', error);
      return 'none';
    }
  };

  const renderStats = () => {
    const totalItems = items.length;
    // Use our warranty checker function
    const warrantyActive = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'active'
    ).length;
    const warrantyExpired = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'expired'
    ).length;
    const noWarranty = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'none'
    ).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{warrantyActive}</Text>
          <Text style={styles.statLabel}>Active Warranty</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{warrantyExpired}</Text>
          <Text style={styles.statLabel}>Expired Warranty</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#6B7280' }]}>{noWarranty}</Text>
          <Text style={styles.statLabel}>No Warranty</Text>
        </View>
      </View>
    );
  };

  const renderInventoryCard = ({ item }: { item: any }) => {
    const warrantyStatus = checkWarrantyStatus(item.warranty_expiration);
    const warrantyColor = warrantyStatus === 'active' ? '#10B981' : 
                           warrantyStatus === 'expired' ? '#EF4444' : '#6B7280';

    const getItemIcon = () => {
      const name = item.name?.toLowerCase() || '';
      if (name.includes('refrigerator') || name.includes('fridge')) return 'snow';
      if (name.includes('washer') || name.includes('washing')) return 'water';
      if (name.includes('dryer')) return 'flame';
      if (name.includes('dishwasher')) return 'restaurant';
      if (name.includes('oven') || name.includes('stove')) return 'flame';
      if (name.includes('microwave')) return 'radio';
      if (name.includes('tv') || name.includes('television')) return 'tv';
      if (name.includes('air') || name.includes('hvac')) return 'thermometer';
      return 'home';
    };

    return (
      <View style={styles.inventoryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <View style={styles.itemTitleRow}>
              <View style={[styles.itemIcon, { backgroundColor: `${warrantyColor}15` }]}>
                <Ionicons name={getItemIcon() as any} size={24} color={warrantyColor} />
              </View>
              <View style={styles.itemTitleInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.brand && (
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                )}
              </View>
            </View>
            <View style={[styles.warrantyBadge, { backgroundColor: `${warrantyColor}15` }]}>
              <View style={[styles.warrantyDot, { backgroundColor: warrantyColor }]} />
              <Text style={[styles.warrantyText, { color: warrantyColor }]}>
                {warrantyStatus === 'active' ? 'Active' : 
                 warrantyStatus === 'expired' ? 'Expired' : 'No Warranty'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemDetails}>
          {item.model && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="cube" size={16} color="#6B7280" />
              </View>
              <Text style={styles.detailText}>Model: {item.model}</Text>
            </View>
          )}
          {item.serial_number && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="barcode" size={16} color="#6B7280" />
              </View>
              <Text style={styles.detailText}>S/N: {item.serial_number}</Text>
            </View>
          )}
          {item.location && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={16} color="#6B7280" />
              </View>
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}
          {item.purchase_date && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
              </View>
              <Text style={styles.detailText}>
                Purchased: {formatDate(item.purchase_date)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          {item.warranty_expiration && (
            <View style={styles.warrantyInfo}>
              <Ionicons name="shield-checkmark" size={16} color={warrantyColor} />
              <Text style={[styles.warrantyDetailText, { color: warrantyColor }]}>
                Warranty until {formatDate(item.warranty_expiration)}
              </Text>
            </View>
          )}
          <View style={styles.footerActions}>
            {item.manual_url && (
              <TouchableOpacity style={styles.manualButton}>
                <Ionicons name="document-text" size={16} color="#4F46E5" />
                <Text style={styles.manualText}>Manual</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {item.homes && (
          <View style={styles.homeSection}>
            <Ionicons name="home" size={16} color="#F59E0B" />
            <Text style={styles.homeText}>{item.homes.name}</Text>
          </View>
        )}
      </View>
    );
  };

  // Show empty state if no items
  const renderEmptyState = () => {
    if (loading) return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Items Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking your home inventory by adding your first item
        </Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => router.push('/inventory/add')}
        >
          <Text style={styles.emptyButtonText}>Add First Item</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Manage your items</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/inventory/add')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderStats()}

        <FlatList
          data={items}
          renderItem={renderInventoryCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            items.length === 0 && { flex: 1 }
          ]}
          ListEmptyComponent={renderEmptyState}
        />
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
              <Text style={styles.modalTitle}>Delete Item</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete {selectedItem?.name}? This action cannot be undone.
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  inventorySection: {
    padding: 16,
    paddingTop: 0,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  warrantyBadge: {
    padding: 4,
    borderRadius: 8,
  },
  warrantyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  warrantyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
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
  itemDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  warrantyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warrantyDetailText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    gap: 4,
  },
  manualText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  homeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    margin: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
});