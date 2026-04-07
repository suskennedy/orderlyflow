import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { useTasksStore } from '../../lib/stores/tasksStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
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

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const vendors = useVendorsStore(state => state.vendors);
  const fetchVendors = useVendorsStore(state => state.fetchVendors);
  const setVendors = useVendorsStore(state => state.setVendors);
  const allHomeTasks = useTasksStore(state => state.allHomeTasks);
  const fetchAllHomeTasks = useTasksStore(state => state.fetchAllHomeTasks);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [vendor, setVendor] = useState<Vendor | null>(null);

  // Sync vendor from store
  useEffect(() => {
    if (id && vendors.length > 0) {
      const foundVendor = vendors.find(v => v.id === id);
      setVendor(foundVendor || null);
    }
  }, [id, vendors]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchVendors(user.id);
      fetchAllHomeTasks(user.id);
    }
  }, [user?.id, fetchVendors, fetchAllHomeTasks]);

  // Real-time sub
  const handleVendorChange = useCallback((payload: any) => {
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const currentVendors = useVendorsStore.getState().vendors;
      if (payload.eventType === 'UPDATE' && payload.new.id === id) {
        setVendor(payload.new);
      }
    }
  }, [user?.id, id]);

  useRealTimeSubscription({ table: 'vendors', filter: `id=eq.${id}` }, handleVendorChange);

  // Tasks for this vendor
  const vendorTasks = useMemo(() => {
    return allHomeTasks.filter(task => task.assigned_vendor_id === id);
  }, [allHomeTasks, id]);

  const handleShare = async () => {
    if (!vendor) return;
    try {
      await Share.share({
        message: `Vendor: ${vendor.name}\n${vendor.phone ? `Phone: ${vendor.phone}\n` : ''}${vendor.email ? `Email: ${vendor.email}\n` : ''}${vendor.category ? `Category: ${vendor.category}\n` : ''}${vendor.notes ? `Notes: ${vendor.notes}` : ''}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Vendor not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { marginTop: 20 }]}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { icon, color } = getVendorCategoryInfo(vendor.category);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Featured Header */}
        <View style={styles.featuredHeader}>
          <LinearGradient
            colors={[color, color + '80', 'transparent']}
            style={styles.headerGradient}
          />
          <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTopActions}>
              <TouchableOpacity onPress={handleShare} style={[styles.headerButton, { marginRight: 10 }]}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(tabs)/(vendors)/${vendor.id}/edit`)} style={styles.headerButton}>
                <Ionicons name="create-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerContent}>
            <View style={[styles.largeIconContainer, { backgroundColor: '#FFF' }]}>
              <Ionicons name={icon as any} size={40} color={color} />
            </View>
            <Text style={styles.vendorNameLarge}>{vendor.name}</Text>
            {vendor.category && (
              <View style={styles.categoryBadgeLarge}>
                <Text style={styles.categoryTextLarge}>{vendor.category}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Quick Actions */}
          <View style={styles.actionRow}>
            {vendor.phone && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`tel:${vendor.phone}`);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="call" size={20} color="#10B981" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Call</Text>
              </TouchableOpacity>
            )}
            {vendor.phone && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`sms:${vendor.phone}`);
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="chatbubble" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Text</Text>
              </TouchableOpacity>
            )}
            {vendor.email && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => Linking.openURL(`mailto:${vendor.email}`)}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="mail" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Email</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contact */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitleRefined, { color: colors.textTertiary }]}>CONTACT</Text>

            <View style={styles.infoRowRefined}>
              <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
              <View style={styles.infoValueWrapper}>
                <Text style={[styles.infoLabelSmall, { color: colors.textTertiary }]}>Phone</Text>
                <Text style={[styles.infoValueLarge, { color: colors.text }]}>{vendor.phone || 'Not specified'}</Text>
              </View>
            </View>

            <View style={[styles.infoRowRefined, { marginTop: 15 }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
              <View style={styles.infoValueWrapper}>
                <Text style={[styles.infoLabelSmall, { color: colors.textTertiary }]}>Email</Text>
                <Text style={[styles.infoValueLarge, { color: colors.text }]}>{vendor.email || 'Not specified'}</Text>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          {vendor.notes && (
            <View style={[styles.infoSection, { backgroundColor: colors.surface, marginTop: 15 }]}>
              <Text style={[styles.sectionTitleRefined, { color: colors.textTertiary }]}>NOTES</Text>
              <Text style={[styles.notesTextRefined, { color: colors.text }]}>{vendor.notes}</Text>
            </View>
          )}

          {/* Tasks Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, marginTop: 15, paddingBottom: 10 }]}>
            <Text style={[styles.sectionTitleRefined, { color: colors.textTertiary }]}>ASSIGNED TASKS</Text>
            {vendorTasks.length === 0 ? (
              <Text style={[styles.emptyTasksText, { color: colors.textTertiary }]}>No tasks assigned yet</Text>
            ) : (
              vendorTasks.map((task) => {
                const itemType = (task as any).item_type || 'task';
                const originalId = (task as any).original_id || task.id;
                const homeName = (task as any).homes?.name || 'Unknown Property';

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskItemRefined, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      if (itemType === 'repair') {
                        router.push(`/(tabs)/(tasks)/repair/${originalId}`);
                      } else if (itemType === 'project') {
                        router.push(`/(tabs)/(tasks)/project/${originalId}`);
                      } else {
                        router.push(`/(tabs)/(tasks)/task/${originalId}`);
                      }
                    }}
                  >
                    <View style={[styles.statusIndicator, { backgroundColor: task.status === 'completed' ? colors.success : colors.warning }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.taskHeaderRow}>
                        <Text style={[styles.taskTitleRefined, { color: colors.text }]} numberOfLines={1}>
                          {task.title}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
                            {itemType.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskMetaRow}>
                        <Ionicons name="home-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.taskHomeRefined, { color: colors.textSecondary }]}> {homeName}</Text>
                        <Text style={[styles.taskDot, { color: colors.textTertiary }]}> • </Text>
                        <Text style={[styles.taskDateRefined, { color: colors.textTertiary }]}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.border} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  featuredHeader: { height: 320, paddingHorizontal: 20 },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  headerTopActions: { flexDirection: 'row' },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  largeIconContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  vendorNameLarge: { fontSize: 32, fontWeight: 'bold', color: '#FFF', textAlign: 'center', fontFamily: 'CormorantGaramond_700Bold' },
  categoryBadgeLarge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  categoryTextLarge: { color: '#FFF', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },

  contentWrapper: { marginTop: -40, paddingHorizontal: 20, zIndex: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionButton: { flex: 1, marginHorizontal: 5, paddingVertical: 15, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600' },

  infoSection: { padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionTitleRefined: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 15 },
  infoRowRefined: { flexDirection: 'row', alignItems: 'center' },
  infoValueWrapper: { marginLeft: 15 },
  infoLabelSmall: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  infoValueLarge: { fontSize: 16, fontWeight: '600' },

  notesTextRefined: { fontSize: 15, lineHeight: 22 },

  emptyTasksText: { textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  taskItemRefined: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 15 },
  taskTitleRefined: { fontSize: 16, fontWeight: '600', flex: 1 },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center' },
  taskHomeRefined: { fontSize: 13, fontWeight: '500' },
  taskDateRefined: { fontSize: 13 },
  taskDot: { fontSize: 13 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  errorText: { fontSize: 18, marginTop: 15 },
  backButton: { padding: 10 }
});