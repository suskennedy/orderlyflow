import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
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

  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    Linking.openURL(url);
  };

  const getCategoryIcon = (category: string | null | undefined) => {
    if (!category) return 'person';
    
    switch (category.toLowerCase()) {
      case 'plumber': return 'water';
      case 'electrician': return 'flash';
      case 'hvac': return 'thermometer';
      case 'landscaping': return 'leaf';
      case 'cleaning': return 'sparkles';
      case 'handyman': return 'hammer';
      case 'contractor': return 'construct';
      case 'painter': return 'brush';
      case 'roofer': return 'home';
      case 'flooring': return 'grid';
      case 'appliance repair': return 'build';
      case 'pest control': return 'bug';
      case 'security': return 'shield-checkmark';
      case 'pool service': return 'water';
      default: return 'person';
    }
  };

  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return colors.textTertiary;
    
    switch (category.toLowerCase()) {
      case 'plumber': return colors.info;
      case 'electrician': return colors.warning;
      case 'hvac': return colors.error;
      case 'landscaping': return colors.success;
      case 'cleaning': return colors.accent;
      case 'handyman': return colors.warning;
      case 'contractor': return colors.textTertiary;
      case 'painter': return colors.accent;
      case 'roofer': return colors.success;
      case 'flooring': return colors.info;
      case 'appliance repair': return colors.warning;
      case 'pest control': return colors.error;
      case 'security': return colors.text;
      case 'pool service': return colors.info;
      default: return colors.textTertiary;
    }
  };
  
  const categoryColor = getCategoryColor(vendor?.category);
  const categoryIcon = getCategoryIcon(vendor?.category);

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
              {vendor.contact_name && (
                <Text style={[styles.contactName, { color: colors.textSecondary }]}>Contact: {vendor.contact_name}</Text>
              )}
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
        {vendor.website && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleWebsite(vendor.website!)}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="globe" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>{vendor.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      {vendor.address && (
        <View style={styles.addressSection}>
          <View style={[styles.addressIconContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="location" size={16} color={colors.warning} />
          </View>
          <Text style={[styles.addressText, { color: colors.textSecondary }]}>{vendor.address}</Text>
        </View>
      )}

      {vendor.notes && (
        <View style={styles.notesSection}>
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
  contactName: {
    fontSize: 14,
    fontWeight: '500',
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
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  addressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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