import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';

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
}

export default function VendorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { vendors, deleteVendor } = useVendors();
  const params = useLocalSearchParams();
  const vendorId = params.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const foundVendor = vendors.find(v => v.id === vendorId);
    setVendor(foundVendor || null);
  }, [vendors, vendorId]);

  const handleCall = () => {
    if (!vendor?.phone) {
      Alert.alert('No Phone Number', 'This vendor does not have a phone number.');
      return;
    }
    
    Alert.alert(
      'Call Vendor',
      `Call ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${vendor.phone}`)
        }
      ]
    );
  };

  const handleEmail = () => {
    if (!vendor?.email) {
      Alert.alert('No Email', 'This vendor does not have an email address.');
      return;
    }
    
    Alert.alert(
      'Email Vendor',
      `Send email to ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email', 
          onPress: () => Linking.openURL(`mailto:${vendor.email}`)
        }
      ]
    );
  };

  const handleSchedule = () => {
    if (!vendor?.website) {
      Alert.alert('No Website', 'This vendor does not have a website for online scheduling.');
      return;
    }
    
    Alert.alert(
      'Schedule Appointment',
      `Open ${vendor.name}'s website for scheduling?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Website', 
          onPress: () => Linking.openURL(vendor.website!)
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to delete ${vendor.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendor(vendorId);
              Alert.alert('Success', 'Vendor deleted successfully!');
              router.back();
            } catch (error) {
              console.error('Error deleting vendor:', error);
              Alert.alert('Error', 'Failed to delete vendor');
            }
          }
        }
      ]
    );
  };

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Vendor not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Name and Contact */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
          {vendor.contact_name && (
            <Text style={[styles.contactName, { color: colors.textSecondary }]}>
              {vendor.contact_name}
            </Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          
          {vendor.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.address}</Text>
            </View>
          )}
          
          {vendor.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.phone}</Text>
            </View>
          )}
          
          {vendor.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.email}</Text>
            </View>
          )}
          
          {vendor.website && (
            <View style={styles.infoRow}>
              <Ionicons name="link" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.website}</Text>
            </View>
          )}
          
          {vendor.category && (
            <View style={styles.infoRow}>
              <Ionicons name="list" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.category}</Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        {vendor.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {vendor.notes}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleCall}
        >
          <Ionicons name="call" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleSchedule}
        >
          <Ionicons name="calendar" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleEmail}
        >
          <Ionicons name="mail" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    minHeight: 60,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 