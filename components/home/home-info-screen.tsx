import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { FONTS } from '../../lib/typography';
import { useHomesStore } from '../../lib/stores/homesStore';

export default function HomeInfoScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const getHomeById = useHomesStore(state => state.getHomeById);
  const home = getHomeById(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!home) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/edit` as any);
  };

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: value != null && value !== '' ? colors.text : colors.textTertiary }]}>
        {value != null && value !== '' ? String(value) : 'Not set'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.background }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Home Info</Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={16} color={colors.textInverse} />
          <Text style={[styles.editButtonText, { color: colors.textInverse }]}>Edit</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 40 }]}
      >
        <InfoRow label="Address" value={home.address} />
        <InfoRow label="Square Footage" value={home.square_footage ? `${home.square_footage} sq ft` : null} />
        <InfoRow label="Bedrooms" value={home.bedrooms} />
        <InfoRow label="Bathrooms" value={home.bathrooms} />
        <InfoRow
          label="Sewer Type"
          value={home.sewer_vs_septic ? home.sewer_vs_septic.charAt(0).toUpperCase() + home.sewer_vs_septic.slice(1) : null}
        />
        <InfoRow
          label="Water Source"
          value={home.water_source === 'city' ? 'City Water' : home.water_source === 'well' ? 'Well Water' : null}
        />
        <InfoRow label="Water Heater Location" value={home.water_heater_location} />
      </ScrollView>
    </View>
  );
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    padding: 20,
  },
  infoRow: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontFamily: FONTS.body,
    fontSize: 17,
  },
});
