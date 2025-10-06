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
import { useTasks } from '../../lib/contexts/TasksContext';
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
  const { homeTasks } = useTasks();
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

  // Get tasks assigned to a specific vendor
  const getVendorTasks = (vendorId: string) => {
    return homeTasks.filter(task => task.assigned_vendor_id === vendorId);
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
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{vendor.phone}</Text>
            </TouchableOpacity>
          )}

          {vendor.email && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => Linking.openURL(`mailto:${vendor.email}`)}
            >
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{vendor.email}</Text>
            </TouchableOpacity>
          )}

          {vendor.website && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => Linking.openURL(vendor.website!)}
            >
              <Ionicons name="globe" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>{vendor.website}</Text>
            </TouchableOpacity>
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

        {/* Assigned Tasks */}
        {(() => {
          const vendorTasks = getVendorTasks(vendor.id);
          if (vendorTasks.length === 0) return null;

          return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Assigned Tasks ({vendorTasks.length})
              </Text>
              {vendorTasks.map((task: any) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => {
                    // Navigate to task details
                    router.push(`/(tabs)/(tasks)/repair/${task.id}`);
                  }}
                >
                  <Ionicons
                    name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={task.status === 'completed' ? colors.success : colors.textSecondary}
                  />
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: colors.text }]}>
                      {task.title}
                    </Text>
                    {task.category && (
                      <Text style={[styles.taskCategory, { color: colors.textTertiary }]}>
                        {task.category}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  taskCategory: {
    fontSize: 14,
  },
}); 