import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

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

interface HomeCardProps {
  home: Home;
  onDelete: (home: Home) => void;
}

export default function HomeCard({ home, onDelete }: HomeCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.homeInfo}>
          <Text style={[styles.homeName, { color: colors.text }]}>{home.name}</Text>
          {home.address && (
            <Text style={[styles.homeAddress, { color: colors.textSecondary }]}>
              {home.address}
              {home.city && `, ${home.city}`}
              {home.state && `, ${home.state}`}
              {home.zip && ` ${home.zip}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => onDelete(home)}
          accessibilityLabel={`Delete ${home.name}`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.homeDetails}>
        <View style={styles.detailsRow}>
          {home.bedrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{home.bedrooms} bed</Text>
            </View>
          )}
          
          {home.bathrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{home.bathrooms} bath</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          {home.square_footage && (
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{home.square_footage.toLocaleString()} sq ft</Text>
            </View>
          )}
          
          {home.year_built && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>Built {home.year_built}</Text>
            </View>
          )}
        </View>
      </View>

      {home.purchase_date && (
        <Text style={[styles.purchaseDate, { color: colors.textTertiary }]}>
          Purchased: {new Date(home.purchase_date).toLocaleDateString()}
        </Text>
      )}

      {home.notes && (
        <View style={styles.notesSection}>
          <Text style={[styles.notesLabel, { color: colors.text }]}>Notes</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{home.notes}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.viewButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(`/homes/view/${home.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={[styles.viewButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.success + '15' }]}
          onPress={() => router.push(`/homes/edit/${home.id}`)}
        >
          <Ionicons name="create-outline" size={16} color={colors.success} />
          <Text style={[styles.editButtonText, { color: colors.success }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 12,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  homeDetails: {
    marginTop: 8,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  purchaseDate: {
    fontSize: 14,
    marginBottom: 12,
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});