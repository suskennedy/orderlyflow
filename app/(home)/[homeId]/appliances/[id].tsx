import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppliancesProvider, useAppliances } from '../../../../lib/contexts/AppliancesContext';
import { useTheme } from '../../../../lib/contexts/ThemeContext';

interface Appliance {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  purchase_date?: string | null;
  warranty_expiration?: string | null;
  manual_url?: string | null;
  notes?: string | null;
  room?: string | null;
  purchased_store?: string | null;
}

function ApplianceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { appliances, deleteAppliance } = useAppliances();
  const params = useLocalSearchParams();
  const applianceId = params.id as string;
  const homeId = params.homeId as string;
  
  const [appliance, setAppliance] = useState<Appliance | null>(null);
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

  const handleManual = () => {
    if (!appliance?.manual_url) {
      Alert.alert('No Manual', 'This appliance does not have a manual URL.');
      return;
    }
    
    Alert.alert(
      'Open Manual',
      `Open the manual for ${appliance.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => Linking.openURL(appliance.manual_url!)
        }
      ]
    );
  };

  const handleDelete = () => {
    if (!appliance) return;
    
    Alert.alert(
      'Delete Appliance',
      `Are you sure you want to delete ${appliance.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppliance(applianceId);
              Alert.alert('Success', 'Appliance deleted successfully!');
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
          onPress={() => router.push(`/(home)/${homeId}/appliances/${applianceId}/edit`)}
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
          <Text style={[styles.heroTitle, { color: colors.text }]}>{appliance.name}</Text>
          {appliance.brand && (
            <View style={[styles.brandBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.brandText, { color: colors.primary }]}>{appliance.brand}</Text>
            </View>
          )}
          {appliance.room && (
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Room: {appliance.room}
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
          
          {appliance.purchased_store && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="storefront" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Purchased Store</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{appliance.purchased_store}</Text>
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
                {formatDate(appliance.purchase_date)}
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
                {formatDate(appliance.warranty_expiration)}
              </Text>
            </View>
          </View>
        </Animated.View>

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

        {/* Bottom Action Buttons - Now part of scrollable content */}
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
          {appliance.manual_url && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleManual}
            >
              <Ionicons name="document-text" size={20} color={colors.background} />
              <Text style={[styles.actionButtonText, { color: colors.background }]}>Manual</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export default function ApplianceDetailScreenWrapper() {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  
  return (
    <AppliancesProvider homeId={homeId}>
      <ApplianceDetailScreen />
    </AppliancesProvider>
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
    justifyContent: 'space-around',
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