import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../../lib/contexts/HomesContext';
import { useAuth } from '../../../lib/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

export default function HomesScreen() {
  const { user } = useAuth();
  const { homes, loading, refreshing, deleteHome, onRefresh } = useHomes();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHome, setSelectedHome] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const handleDeletePress = (home: any) => {
    setSelectedHome(home);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedHome) {
      await deleteHome(selectedHome.id);
      setShowDeleteModal(false);
      setSelectedHome(null);
    }
  };

  const getPropertyIcon = (type: string | null) => {
    // Default icon since we don't have property_type in this schema
    return 'home-outline';
  };

  const formatSquareFeet = (sqft: number | null) => {
    if (!sqft) return null;
    return sqft.toLocaleString() + ' sq ft';
  };

  const renderStats = () => {
    const totalHomes = homes.length;
    const averageYear = homes.length > 0 
      ? Math.round(homes.reduce((sum, home) => sum + (home.year_built || 0), 0) / homes.length)
      : 0;
    const totalBedrooms = homes.reduce((sum, home) => sum + (home.bedrooms || 0), 0);
    const totalBathrooms = homes.reduce((sum, home) => sum + (home.bathrooms || 0), 0);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalHomes}</Text>
          <Text style={styles.statLabel}>Total Homes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{totalBedrooms}</Text>
          <Text style={styles.statLabel}>Total Bedrooms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{totalBathrooms}</Text>
          <Text style={styles.statLabel}>Total Bathrooms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{averageYear}</Text>
          <Text style={styles.statLabel}>Avg Year Built</Text>
        </View>
      </View>
    );
  };

  const renderHomeCard = ({ item }: { item: any }) => {
    return (
      <View style={styles.homeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.homeInfo}>
            <Text style={styles.homeName}>{item.name}</Text>
            <Text style={styles.homeAddress}>
              {item.address}, {item.city}, {item.state} {item.zip}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.homeDetails}>
          {item.bedrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.bedrooms} bed</Text>
            </View>
          )}
          {item.bathrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.bathrooms} bath</Text>
            </View>
          )}
          {item.square_footage && (
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.square_footage.toLocaleString()} sq ft</Text>
            </View>
          )}
          {item.year_built && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Built {item.year_built}</Text>
            </View>
          )}
        </View>

        {item.purchase_date && (
          <Text style={styles.purchaseDate}>
            Purchased: {new Date(item.purchase_date).toLocaleDateString()}
          </Text>
        )}

        {item.notes && (
          <Text style={styles.notesText}>{item.notes}</Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="home-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Homes Added</Text>
      <Text style={styles.emptySubtitle}>
        Add your first home to start managing your properties and inventory
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Homes</Text>
          <Text style={styles.subtitle}>Manage your properties</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/homes/add')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderStats()}

        <FlatList
          data={homes}
          renderItem={renderHomeCard}
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
              <Text style={styles.modalTitle}>Delete Home</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete &quot;{selectedHome?.name}&quot;? This action cannot be undone.
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
  homesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  homeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  homeDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  purchaseDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    paddingBottom: 20,
  },
}); 