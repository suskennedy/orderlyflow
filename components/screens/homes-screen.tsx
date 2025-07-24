import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import HomeCard from '../home/HomeCard';
import ScreenHeader from '../layout/ScreenHeader';

export default function HomesScreen() {
  const { homes, loading } = useHomes();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="home-outline" size={100} color={colors.primary} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No Homes Yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Add your first home to get started.
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(home)/add')}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
        <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add a Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: colors.primary, alignSelf: 'center' }]}
      onPress={() => router.push('/(home)/add')}
    >
      <Ionicons name="add" size={24} color={colors.textInverse} />
      <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add Home</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Homes" />
      {homes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={homes}
          renderItem={({ item }) => <HomeCard home={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '80%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 