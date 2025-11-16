import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useHomesStore } from '../../lib/stores/homesStore';
import ScreenHeader from '../layouts/layout/ScreenHeader';
import HomeCard from './HomeCard';

export default function HomesScreen() {
  const homes = useHomesStore(state => state.homes);
  const loading = useHomesStore(state => state.loading);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="home-outline" size={80} color={colors.primary} />
      </View>
      <Text style={[styles.emptyText, { color: colors.text }]}>No Homes Yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Add your first home to get started managing your properties.
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(home)/add')}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
        <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add Your First Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: colors.primary, alignSelf: 'center' }]}
      onPress={() => router.push('/(home)/add')}
    >
      <Ionicons name="add" size={24} color={colors.textInverse} />
      <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add Another Home</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Homes" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader 
        title="My Homes" 
        subtitle={`${homes.length} ${homes.length === 1 ? 'property' : 'properties'}`}
        showBackButton 
        showDecorativeIcons={true}
        onBackPress={() => router.push('/(dashboard)')}
      />
      {homes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={homes}
          renderItem={({ item }) => <HomeCard home={item} onDelete={() => {}} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 24,
    marginBottom: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 