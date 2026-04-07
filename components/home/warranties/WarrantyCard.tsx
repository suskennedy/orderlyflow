import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useWarrantiesStore } from '../../../lib/stores/warrantiesStore';
import { FONTS } from '../../../lib/typography';

interface Warranty {
  id: string;
  item_name: string;
  room: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  provider: string | null;
  notes: string | null;
}

interface WarrantyCardProps {
  warranty: Warranty;
}

export default function WarrantyCard({ warranty }: WarrantyCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  const deleteWarranty = useWarrantiesStore((s) => s.deleteWarranty);

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/warranties/${warranty.id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete warranty',
      `Remove “${warranty.item_name}” from this home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWarranty(homeId, warranty.id);
            } catch {
              Alert.alert('Error', 'Could not delete this warranty.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerMain} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {warranty.item_name}
            </Text>
            <Text style={[styles.endDate, { color: colors.textSecondary }]}>
              Expires: {warranty.warranty_end_date || 'Not specified'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Delete warranty">
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      {isExpanded && (
        <View style={styles.details}>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Room: {warranty.room || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Start Date: {warranty.warranty_start_date || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Provider: {warranty.provider || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Notes: {warranty.notes || 'No notes'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  endDate: {
    fontSize: 14,
    marginTop: 4,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 