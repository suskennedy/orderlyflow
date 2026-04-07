import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../../../lib/hooks/useRealTimeSubscription';
import { useAppliancesStore } from '../../../../../lib/stores/appliancesStore';
import { downloadPdfFromUrl, openPdfInBrowser } from '../../../../../lib/utils/documentDownload';

const EMPTY_ARRAY: any[] = [];
interface Appliance {
  id: string;
  type?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_date?: string | null;
  warranty_expiration?: string | null;
  manual_url?: string | null;
  warranty_url?: string | null;
  notes?: string | null;
  location?: string | null;
}

function ApplianceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const applianceId = params.id as string;
  const homeId = params.homeId as string;
  const appliances = useAppliancesStore(state => state.appliancesByHome[homeId || ''] || EMPTY_ARRAY);
  const deleteAppliance = useAppliancesStore(state => state.deleteAppliance);
  const fetchAppliances = useAppliancesStore(state => state.fetchAppliances);
  const setAppliances = useAppliancesStore(state => state.setAppliances);

  const lastHomeIdRef = useRef<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchAppliances(homeId);
    }
  }, [homeId, fetchAppliances]);

  // Real-time subscription
  const handleApplianceChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useAppliancesStore.getState();
    const currentAppliances = store.appliancesByHome[homeId || ''] || [];
    if (payload.eventType === 'INSERT') {
      const newAppliance = payload.new;
      if (!currentAppliances.some(a => a.id === newAppliance.id)) {
        setAppliances(homeId || '', [newAppliance, ...currentAppliances]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setAppliances(homeId || '', currentAppliances.map(a => a.id === payload.new.id ? payload.new : a));
    } else if (payload.eventType === 'DELETE') {
      setAppliances(homeId || '', currentAppliances.filter(a => a.id !== payload.old.id));
    }
  }, [homeId, setAppliances]);

  useRealTimeSubscription(
    { table: 'appliances', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleApplianceChange
  );

  const [appliance, setAppliance] = useState<Appliance | null>(null);
  const [busyDoc, setBusyDoc] = useState<'manual' | 'warranty' | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    const foundAppliance = appliances.find(a => a.id === applianceId);
    setAppliance(foundAppliance || null);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [appliances, applianceId, fadeAnim, slideAnim]);

  const handleDownloadDoc = async (url: string | null | undefined, kind: 'manual' | 'warranty') => {
    if (!url) return;
    try {
      setBusyDoc(kind);
      await downloadPdfFromUrl(url, kind === 'manual' ? 'appliance-manual.pdf' : 'appliance-warranty.pdf');
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not download the file.');
    } finally {
      setBusyDoc(null);
    }
  };

  const goEditDocuments = () => {
    router.push(`/(tabs)/(home)/${homeId}/appliances/${applianceId}/edit` as any);
  };

  const handleDelete = () => {
    if (!appliance) return;

    Alert.alert(
      'Delete Appliance',
      `Are you sure you want to delete ${appliance.type || 'this appliance'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppliance(homeId || '', applianceId);
              router.back();
            } catch (error) {
              console.error('Error deleting appliance:', error);
              Alert.alert('Error', 'Failed to delete appliance');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (!appliance) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Appliance Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Appliance not found or has been deleted.
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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Appliance Details</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage appliance information</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(`/(tabs)/(home)/${homeId}/appliances/${applianceId}/edit`)}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.heroIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="hardware-chip" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{`${appliance.brand || ''} ${appliance.type || 'Appliance'}`}</Text>
          {appliance.brand && (
            <View style={[styles.brandBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.brandText, { color: colors.primary }]}>{appliance.brand}</Text>
            </View>
          )}
          {appliance.location && (
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Location: {appliance.location}
            </Text>
          )}
        </Animated.View>

        {/* Basic Information */}
        <Animated.View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          </View>

          {appliance.model && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="settings" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Model</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{appliance.model}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Dates Information */}
        <Animated.View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Important Dates</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Purchase Date</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {formatDate(appliance.purchase_date as string | null)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Warranty Expiration</Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {formatDate(appliance.warranty_expiration as string | null)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Documents: download, open, replace */}
        {(appliance.manual_url || appliance.warranty_url) && (
          <Animated.View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="folder-open-outline" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual & warranty</Text>
            </View>

            {appliance.manual_url ? (
              <View style={[styles.docBlock, { borderColor: colors.border }]}>
                <Text style={[styles.docBlockTitle, { color: colors.text }]}>Manual (PDF)</Text>
                <View style={styles.docActions}>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleDownloadDoc(appliance.manual_url, 'manual')}
                    disabled={busyDoc === 'manual'}
                  >
                    {busyDoc === 'manual' ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={18} color={colors.primary} />
                        <Text style={[styles.docChipText, { color: colors.primary }]}>Download</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={() => openPdfInBrowser(appliance.manual_url!)}
                  >
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                    <Text style={[styles.docChipText, { color: colors.primary }]}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={goEditDocuments}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                    <Text style={[styles.docChipText, { color: colors.primary }]}>Replace</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {appliance.warranty_url ? (
              <View style={[styles.docBlock, { borderColor: colors.border }]}>
                <Text style={[styles.docBlockTitle, { color: colors.text }]}>Warranty (PDF)</Text>
                <View style={styles.docActions}>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleDownloadDoc(appliance.warranty_url, 'warranty')}
                    disabled={busyDoc === 'warranty'}
                  >
                    {busyDoc === 'warranty' ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={18} color={colors.primary} />
                        <Text style={[styles.docChipText, { color: colors.primary }]}>Download</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={() => openPdfInBrowser(appliance.warranty_url!)}
                  >
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                    <Text style={[styles.docChipText, { color: colors.primary }]}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.docChip, { backgroundColor: colors.primaryLight }]}
                    onPress={goEditDocuments}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
                    <Text style={[styles.docChipText, { color: colors.primary }]}>Replace</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </Animated.View>
        )}

        {/* Notes Section */}
        {appliance.notes && (
          <Animated.View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            </View>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>
              {appliance.notes}
            </Text>
          </Animated.View>
        )}

        {/* Delete */}
        <Animated.View
          style={[
            styles.bottomActions,
            {
              backgroundColor: colors.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444', flex: 0, minWidth: 140 }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Delete appliance</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export default function ApplianceDetailScreenWrapper() {
  return <ApplianceDetailScreen />;
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  headerAction: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  brandBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 70,
    gap: 6,
  },
  docBlock: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  docBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  docActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  docChipText: {
    fontSize: 13,
    fontWeight: '600',
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