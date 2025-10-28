import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';

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

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/warranties/${warranty.id}/edit` as any);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{warranty.item_name}</Text>
          <Text style={[styles.endDate, { color: colors.textSecondary }]}>
            Expires: {warranty.warranty_end_date || 'Not specified'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
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
  },
  name: {
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