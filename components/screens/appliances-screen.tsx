import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppliances } from '../../lib/contexts/AppliancesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ApplianceCard from '../home/ApplianceCard';
import ScreenHeader from '../layout/ScreenHeader';

export default function AppliancesScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { appliances, loading } = useAppliances();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAppliancePress = (applianceId: string) => {
    router.push(`/(home)/${homeId}/appliances/${applianceId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Appliances" 
        showBackButton
        onAddPress={() => router.push(`/(home)/${homeId}/appliances/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={appliances}
          renderItem={({ item }) => (
            <ApplianceCard 
              appliance={item} 
              onPress={() => handleAppliancePress(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No appliances added yet.</Text>
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