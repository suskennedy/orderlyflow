import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

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
  primary_contact?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching vendor:', error);
        Alert.alert('Error', 'Failed to load vendor details');
        return;
      }

      setVendor(data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      Alert.alert('Error', 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading contact...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Contact not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(tabs)/(dashboard)/vendors/edit/${vendor.id}`)}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Company Name */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Company</Text>
          <Text style={[styles.companyName, { color: colors.text }]}>{vendor.name}</Text>
        </View>

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          
          {vendor.contact_name && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.contact_name}</Text>
            </View>
          )}

          {vendor.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.phone}</Text>
            </View>
          )}

          {vendor.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.email}</Text>
            </View>
          )}

          {vendor.website && (
            <View style={styles.infoRow}>
              <Ionicons name="globe" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.website}</Text>
            </View>
          )}

          {vendor.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.address}</Text>
            </View>
          )}
        </View>

        {/* Category and Priority */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          
          {vendor.category && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{vendor.category}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="star" size={20} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {vendor.primary_contact ? 'Primary Contact' : 'Secondary Contact'}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {vendor.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{vendor.notes}</Text>
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
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
}); 