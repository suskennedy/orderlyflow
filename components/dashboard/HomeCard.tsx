import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.homeInfo}>
          <Text style={styles.homeName}>{home.name}</Text>
          {home.address && (
            <Text style={styles.homeAddress}>
              {home.address}
              {home.city && `, ${home.city}`}
              {home.state && `, ${home.state}`}
              {home.zip && ` ${home.zip}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(home)}
          accessibilityLabel={`Delete ${home.name}`}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.homeDetails}>
        <View style={styles.detailsRow}>
          {home.bedrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{home.bedrooms} bed</Text>
            </View>
          )}
          
          {home.bathrooms && (
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{home.bathrooms} bath</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          {home.square_footage && (
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{home.square_footage.toLocaleString()} sq ft</Text>
            </View>
          )}
          
          {home.year_built && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Built {home.year_built}</Text>
            </View>
          )}
        </View>
      </View>

      {home.purchase_date && (
        <Text style={styles.purchaseDate}>
          Purchased: {new Date(home.purchase_date).toLocaleDateString()}
        </Text>
      )}

      {home.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{home.notes}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/homes/view/${home.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color="#4F46E5" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/homes/edit/${home.id}`)}
        >
          <Ionicons name="create-outline" size={16} color="#10B981" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
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
    color: '#374151',
    fontWeight: '500',
  },
  purchaseDate: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#EEF2FF',
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});