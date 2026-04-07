import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { getVendorCategoryInfo } from '../../lib/utils/vendorIcons';

interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

interface VendorCardProps {
  vendor: Vendor;
  onDelete: () => void;
}

export default function VendorCard({ vendor, onDelete }: VendorCardProps) {
  const { colors } = useTheme();

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const { icon: categoryIcon, color: categoryColor } = getVendorCategoryInfo(vendor?.category);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.vendorInfo}>
          <View style={styles.titleRow}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '15' }]}>
              <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
            </View>
            <View style={styles.titleInfo}>
              <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
            </View>
          </View>
          {vendor.category && (
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {vendor.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
          onPress={onDelete}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.contactSection}>
        {vendor.phone && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleCall(vendor.phone!)}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="call" size={16} color={colors.success} />
            </View>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>{vendor.phone}</Text>
          </TouchableOpacity>
        )}
        {vendor.email && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleEmail(vendor.email!)}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="mail" size={16} color={colors.info} />
            </View>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>{vendor.email}</Text>
          </TouchableOpacity>
        )}
      </View>

      {vendor.notes && (
        <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.notesLabel, { color: colors.text }]}>Notes</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{vendor.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  contactSection: {
    marginTop: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
