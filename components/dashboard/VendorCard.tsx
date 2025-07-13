import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    if (!category) return '#6B7280';
    
    switch (category.toLowerCase()) {
      case 'plumber': return '#3B82F6';
      case 'electrician': return '#F59E0B';
      case 'hvac': return '#EF4444';
      case 'landscaping': return '#10B981';
      case 'cleaning': return '#8B5CF6';
      case 'handyman': return '#F97316';
      case 'contractor': return '#6B7280';
      case 'painter': return '#EC4899';
      case 'roofer': return '#84CC16';
      case 'flooring': return '#14B8A6';
      case 'appliance repair': return '#F59E0B';
      case 'pest control': return '#DC2626';
      case 'security': return '#1F2937';
      case 'pool service': return '#06B6D4';
      default: return '#6B7280';
    }
  };
  
  const categoryColor = getCategoryColor(vendor?.category);
  const categoryIcon = getCategoryIcon(vendor?.category);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.vendorInfo}>
          <View style={styles.titleRow}>
            <View style={[styles.categoryIcon, { backgroundColor: `${categoryColor}15` }]}>
              <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              {vendor.contact_name && (
                <Text style={styles.contactName}>Contact: {vendor.contact_name}</Text>
              )}
            </View>
          </View>
          {vendor.category && (
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {vendor.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Ionicons name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.contactSection}>
        {vendor.phone && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleCall(vendor.phone!)}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="call" size={16} color="#10B981" />
            </View>
            <Text style={styles.contactText}>{vendor.phone}</Text>
          </TouchableOpacity>
        )}
        {vendor.email && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleEmail(vendor.email!)}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.contactText}>{vendor.email}</Text>
          </TouchableOpacity>
        )}
        {vendor.website && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleWebsite(vendor.website!)}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="globe" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.contactText}>{vendor.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      {vendor.address && (
        <View style={styles.addressSection}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={16} color="#F59E0B" />
          </View>
          <Text style={styles.addressText}>{vendor.address}</Text>
        </View>
      )}

      {vendor.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{vendor.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#FEF2F2',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
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
    color: '#111827',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});