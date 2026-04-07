import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useMaterialsStore } from '../../../lib/stores/materialsStore';
import { FONTS } from '../../../lib/typography';

interface Material {
  id: string;
  type: string | null;
  location: string | null;
  brand: string | null;
  notes: string | null;
}

interface MaterialCardProps {
  material: Material;
}

export default function MaterialCard({ material }: MaterialCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  const deleteMaterial = useMaterialsStore(state => state.deleteMaterial);

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/materials/${material.id}/edit` as any);
  };

  const handleDelete = () => {
    const label = material.brand ? `${material.brand} ${material.type || ''}`.trim() : material.type || 'this material';
    Alert.alert(
      'Delete material',
      `Remove ${label} from this home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMaterial(homeId, material.id);
            } catch {
              Alert.alert('Error', 'Could not delete this material.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>
            {material.brand ? `${material.brand} ${material.type || ''}`.trim() : material.type || 'Material'}
          </Text>
          <Text style={[styles.type, { color: colors.textSecondary }]}>
            {material.location || 'No location specified'}
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
            Type: {material.type || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Brand: {material.brand || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Location: {material.location || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Notes: {material.notes || 'No notes'}
          </Text>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B3010' }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  type: {
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
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 