import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../../lib/contexts/TasksContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useVendors } from '../../../lib/contexts/VendorsContext';

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

export default function VendorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vendors } = useVendors();
  const { homeTasks } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (id && vendors.length > 0) {
      console.log('Looking for vendor with ID:', id);
      console.log('Available vendors:', vendors.map(v => ({ id: v.id, name: v.name })));
      const foundVendor = vendors.find(v => v.id === id);
      console.log('Found vendor:', foundVendor);
      setVendor(foundVendor || null);
    } else if (id && vendors.length === 0) {
      console.log('No vendors available, but looking for ID:', id);
    }
  }, [id, vendors]);

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            The vendor you&apos;re looking for doesn&apos;t exist.
          </Text>
        </View>
      </View>
    );
  }


  const getCategoryIcon = (category?: string | null) => {
    if (!category) return 'business';
    
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('plumber')) return 'water';
    if (categoryLower.includes('electrician')) return 'flash';
    if (categoryLower.includes('cleaner') || categoryLower.includes('cleaning')) return 'sparkles';
    if (categoryLower.includes('gardener') || categoryLower.includes('landscap')) return 'leaf';
    if (categoryLower.includes('painter')) return 'color-palette';
    if (categoryLower.includes('contractor')) return 'construct';
    if (categoryLower.includes('organizer')) return 'grid';
    if (categoryLower.includes('repair')) return 'build';
    if (categoryLower.includes('maintenance')) return 'settings';
    return 'business';
  };

  const getCategoryColor = (category?: string | null) => {
    if (!category) return '#6B7280';
    
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('plumber')) return '#3B82F6';
    if (categoryLower.includes('electrician')) return '#F59E0B';
    if (categoryLower.includes('cleaner') || categoryLower.includes('cleaning')) return '#10B981';
    if (categoryLower.includes('gardener') || categoryLower.includes('landscap')) return '#059669';
    if (categoryLower.includes('painter')) return '#8B5CF6';
    if (categoryLower.includes('contractor')) return '#EF4444';
    if (categoryLower.includes('organizer')) return '#EC4899';
    if (categoryLower.includes('repair')) return '#F97316';
    if (categoryLower.includes('maintenance')) return '#6366F1';
    return '#6B7280';
  };

  const categoryIcon = getCategoryIcon(vendor.category);
  const categoryColor = getCategoryColor(vendor.category);

  // Get tasks assigned to this vendor
  const getVendorTasks = (vendorId: string) => {
    return homeTasks.filter(task => task.assigned_vendor_id === vendorId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Details</Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/(vendors)/${vendor.id}/edit` as any)}
        >
          <Ionicons name="create" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Card */}
        <View style={[styles.vendorCard, { backgroundColor: colors.surface }]}>
          {/* Header Section */}
          <View style={styles.vendorHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
              <Ionicons name={categoryIcon as any} size={32} color={categoryColor} />
            </View>
            <View style={styles.vendorInfo}>
              <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
              {vendor.category && (
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {vendor.category.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            
            {vendor.contact_name && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Contact Person</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{vendor.contact_name}</Text>
                </View>
              </View>
            )}

            {vendor.phone && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '15' }]}>
                  <Ionicons name="call" size={20} color="#10B981" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>{vendor.phone}</Text>
                </View>
              </TouchableOpacity>
            )}

            {vendor.email && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => Linking.openURL(`mailto:${vendor.email}`)}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '15' }]}>
                  <Ionicons name="mail" size={20} color="#3B82F6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: '#3B82F6' }]}>{vendor.email}</Text>
                </View>
              </TouchableOpacity>
            )}

            {vendor.website && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => Linking.openURL(vendor.website!)}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <Ionicons name="globe" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Website</Text>
                  <Text style={[styles.infoValue, { color: '#8B5CF6' }]}>{vendor.website}</Text>
                </View>
              </TouchableOpacity>
            )}

            {vendor.address && (
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' + '15' }]}>
                  <Ionicons name="location" size={20} color="#F59E0B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{vendor.address}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes Section */}
          {vendor.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <View style={[styles.notesContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.notesText, { color: colors.text }]}>{vendor.notes}</Text>
              </View>
            </View>
          )}

          {/* Assigned Tasks */}
          {(() => {
            const vendorTasks = getVendorTasks(vendor.id);
            return (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Assigned Tasks ({vendorTasks.length})
                </Text>
                {vendorTasks.length === 0 ? (
                  <Text style={[styles.taskTitle, { color: colors.textSecondary }]}>
                    No tasks assigned to this vendor
                  </Text>
                ) : (
                  vendorTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { borderBottomColor: colors.border }]}
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
              ))
            )}
              </View>
            );
          })()}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  vendorCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
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