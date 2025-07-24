import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import HomeCard from '../../components/dashboard/HomeCard';
import EmptyState from '../../components/layout/EmptyState';
import LoadingState from '../../components/layout/LoadingState';
import ScreenHeader from '../../components/layout/ScreenHeader';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import StatsDisplay from '../../components/ui/StatsDisplay';

// Import hooks
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';

// Define interface for Home type
interface Home {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_footage?: number | null;
  year_built?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
  user_id?: string | null;
}

export default function HomesScreen() {
  const { user } = useAuth();
  const { homes, loading, refreshing, deleteHome, onRefresh } = useHomes();
  const { colors } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const insets = useSafeAreaInsets();

  const handleDeletePress = (home: Home) => {
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

  // Render statistics component
  const renderStats = () => {
    const totalHomes = homes.length;
    const averageYear = homes.length > 0 
      ? Math.round(homes.reduce((sum, home) => sum + (home.year_built || 0), 0) / homes.length)
      : 0;
    const totalBedrooms = homes.reduce((sum, home) => sum + (home.bedrooms || 0), 0);
    const totalBathrooms = homes.reduce((sum, home) => sum + (home.bathrooms || 0), 0);

    return (
      <StatsDisplay
        stats={[
          { value: totalHomes, label: 'Total Homes' },
          { value: totalBedrooms, label: 'Total Bedrooms', color: colors.info },
          { value: totalBathrooms, label: 'Total Bathrooms', color: colors.success },
          { value: averageYear || 'N/A', label: 'Avg Year Built', color: colors.warning }
        ]}
      />
    );
  };

  // Show loading state while fetching data
  if (loading) {
    return <LoadingState message="Loading homes..." />;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingBottom: insets.bottom + 100 // Extra padding for custom bottom nav
    }]}>
      {/* Screen header */}
      <ScreenHeader
        title="Homes"
        subtitle="Manage your properties"
        paddingTop={insets.top + 20}
        onAddPress={() => router.push('/(dashboard)/homes/add')}
      />

      <View style={styles.content}>
        {homes.length === 0 ? (
          <EmptyState
            title="No Homes Added"
            message="Add your first home to start managing your properties and inventory"
            buttonText="Add Your First Home"
            iconName="home-outline"
            navigateTo="/(dashboard)/homes/add"
          />
        ) : (
          <FlatList
            data={homes}
            renderItem={({ item }) => (
              <HomeCard 
                home={item} 
                onDelete={handleDeletePress} 
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={renderStats}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Home"
        message={`Are you sure you want to delete "${selectedHome?.name}"? This action cannot be undone.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
});