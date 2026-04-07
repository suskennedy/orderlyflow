import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    SectionList,
    SectionListData,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { matchesUserScopedRow } from '../../lib/utils/realtimeUserScoped';
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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
const { width } = Dimensions.get('window');

export default function VendorsScreen() {
  const { user } = useAuth();
  const vendors = useVendorsStore(state => state.vendors);
  const loading = useVendorsStore(state => state.loading);
  const refreshing = useVendorsStore(state => state.refreshing);
  const fetchVendors = useVendorsStore(state => state.fetchVendors);
  const setVendors = useVendorsStore(state => state.setVendors);
  const deleteVendor = useVendorsStore(state => state.deleteVendor);
  const onRefresh = useVendorsStore(state => state.onRefresh);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const sectionListRef = useRef<SectionList>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByCategory, setSearchByCategory] = useState(false);

  // Phone book integration states
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchVendors(user.id);
    }
  }, [user?.id, fetchVendors]);

  // Real-time subscription for vendors
  const handleVendorChange = useCallback((payload: any) => {
    if (!user?.id) return;
    const currentVendors = useVendorsStore.getState().vendors;
    const ids = currentVendors.map((v) => v.id);
    if (!matchesUserScopedRow(user.id, payload, ids)) return;

    const eventType = payload.eventType;
    if (eventType === 'INSERT') {
      const row = payload.new;
      if (!currentVendors.some((v) => v.id === row.id)) {
        setVendors([row, ...currentVendors].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } else if (eventType === 'UPDATE') {
      setVendors(
        currentVendors
          .map((vendor) => (vendor.id === payload.new.id ? payload.new : vendor))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } else if (eventType === 'DELETE' && payload.old?.id) {
      setVendors(currentVendors.filter((vendor) => vendor.id !== payload.old.id));
    }
  }, [user?.id, setVendors]);

  useRealTimeSubscription(
    {
      table: 'vendors',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleVendorChange
  );

  // Group vendors alphabetically for SectionList
  const sections = useMemo(() => {
    const filtered = vendors.filter(vendor => {
      const query = searchQuery.toLowerCase();
      if (searchByCategory) {
        return vendor.category?.toLowerCase().includes(query);
      }
      return (
        vendor.name.toLowerCase().includes(query) ||
        vendor.phone?.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query)
      );
    });

    const groups: { [key: string]: Vendor[] } = {};
    filtered.forEach(vendor => {
      let char = vendor.name.charAt(0).toUpperCase();
      if (!/[A-Z]/.test(char)) char = '#';
      if (!groups[char]) groups[char] = [];
      groups[char].push(vendor);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .map(char => ({
        title: char,
        data: groups[char].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [vendors, searchQuery, searchByCategory]);

  const scrollToSection = (index: number) => {
    if (index >= 0 && index < sections.length) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const loadContactsFromPhoneBook = async () => {
    try {
      setLoadingContacts(true);
      const { status: currentStatus } = await Contacts.getPermissionsAsync();

      let permissionStatus = currentStatus;
      if (currentStatus === 'undetermined') {
        const { status } = await Contacts.requestPermissionsAsync();
        permissionStatus = status;
      }

      if (permissionStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please allow contacts access in settings.');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company,
        ],
      });

      const validContacts = data
        .filter(c => (c.phoneNumbers?.length || c.emails?.length) && (c.name || c.company))
        .map(c => ({
          name: c.company || c.name,
          contact_name: c.name,
          phone: c.phoneNumbers?.[0]?.number || '',
          email: c.emails?.[0]?.email || '',
          company: c.company || null
        }));

      if (validContacts.length === 0) {
        Alert.alert('No Contacts Found', 'No valid contacts with phone or email.');
        return;
      }

      setContacts(validContacts);
      setShowContactsModal(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleContactSelection = (contact: any) => {
    setShowContactsModal(false);
    router.push({
      pathname: '/(tabs)/(vendors)/add',
      params: contact
    });
  };

  const handleDelete = (vendor: Vendor) => {
    Alert.alert(
      'Delete Vendor',
      `Delete ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteVendor(vendor.id), style: 'destructive' }
      ]
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<Vendor> }) => (
    <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
    </BlurView>
  );

  const renderVendorItem = ({ item }: { item: Vendor }) => {
    const { icon, color } = getVendorCategoryInfo(item.category);

    return (
      <TouchableOpacity
        style={[styles.vendorCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/(tabs)/(vendors)/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        <View style={styles.vendorInfo}>
          <Text style={[styles.vendorName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {item.category && (
            <Text style={[styles.vendorCategory, { color: colors.textTertiary }]}>{item.category}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error + '80'} />
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '20', 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendors</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={loadContactsFromPhoneBook}
              style={[styles.roundButton, { marginRight: 8 }]}
              disabled={loadingContacts}
            >
              <Ionicons name="people" size={22} color={loadingContacts ? colors.primary : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(vendors)/add')}
              style={[styles.roundButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={28} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={searchByCategory ? "Search by category..." : "Search vendors..."}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.searchTypeToggle, { backgroundColor: colors.background }]}
            onPress={() => {
              setSearchByCategory(!searchByCategory);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.searchTypeText, { color: colors.primary }]}>
              {searchByCategory ? 'Category' : 'Name'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.listWrapper}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          extraData={vendors.length}
          renderItem={renderVendorItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => user?.id && onRefresh(user.id)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No vendors found</Text>
            </View>
          }
        />

        {/* Alphabet Sidebar */}
        <View style={styles.alphabetSidebar}>
          {ALPHABET.map((char) => {
            const index = sections.findIndex(s => s.title === char);
            const isActive = index !== -1;
            return (
              <TouchableOpacity
                key={char}
                onPress={() => index !== -1 && scrollToSection(index)}
                style={styles.alphabetChar}
              >
                <Text style={[
                  styles.alphabetText,
                  { color: isActive ? colors.primary : colors.textTertiary + '40' },
                  isActive && { fontWeight: 'bold' }
                ]}>
                  {char}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Contacts Modal - Keeping basic but clean */}
      <Modal visible={showContactsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Import Contacts</Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <SectionList
              sections={[{ title: 'Suggested', data: contacts }]}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.contactItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleContactSelection(item)}
                >
                  <View>
                    <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.contactInfo, { color: colors.textTertiary }]}>{item.phone || item.email}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              initialNumToRender={20}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', fontFamily: 'CormorantGaramond_700Bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  searchInput: { flex: 1, height: '100%', marginLeft: 10, fontSize: 16, fontFamily: 'Jost_400Regular' },
  searchTypeToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  searchTypeText: { fontSize: 12, fontWeight: 'bold' },

  listWrapper: { flex: 1, flexDirection: 'row' },
  listContent: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: -20,
    marginBottom: 10
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },

  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 17, fontWeight: '600', fontFamily: 'Jost_600SemiBold', marginBottom: 2 },
  vendorCategory: { fontSize: 13, fontFamily: 'Jost_400Regular' },
  deleteButton: { padding: 8, marginRight: 5 },

  alphabetSidebar: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  alphabetChar: { paddingVertical: 2 },
  alphabetText: { fontSize: 10, fontWeight: '500' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  contactItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  contactName: { fontSize: 16, fontWeight: '600' },
  contactInfo: { fontSize: 13, marginTop: 2 }
});
