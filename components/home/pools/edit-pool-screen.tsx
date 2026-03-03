import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { INSTALLATION_TYPES, POOL_TYPES } from '../../../lib/schemas/home/poolFormSchema';
import { usePoolsStore } from '../../../lib/stores/poolsStore';

interface Pool {
    id: string;
    type: string | null;
    installation_type: string | null;
    notes: string | null;
}

export default function EditPoolScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { homeId } = useLocalSearchParams<{ homeId: string }>();
    const pools = usePoolsStore(state => state.poolsByHome[homeId] || []);
    const updatePool = usePoolsStore(state => state.updatePool);
    const fetchPools = usePoolsStore(state => state.fetchPools);
    const setPools = usePoolsStore(state => state.setPools);

    const lastHomeIdRef = useRef<string | null>(null);

    // Initial data fetch
    useEffect(() => {
        if (homeId && homeId !== lastHomeIdRef.current) {
            lastHomeIdRef.current = homeId;
            fetchPools(homeId);
        }
    }, [homeId, fetchPools]);

    // Real-time subscription
    const handlePoolChange = useCallback((payload: any) => {
        if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
        const store = usePoolsStore.getState();
        const currentPools = store.poolsByHome[homeId] || [];
        if (payload.eventType === 'INSERT') {
            const newPool = payload.new;
            if (!currentPools.some(p => p.id === newPool.id)) {
                setPools(homeId, [newPool, ...currentPools]);
            }
        } else if (payload.eventType === 'UPDATE') {
            setPools(homeId, currentPools.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
            setPools(homeId, currentPools.filter(p => p.id !== payload.old.id));
        }
    }, [homeId, setPools]);

    useRealTimeSubscription(
        { table: 'pools', filter: homeId ? `home_id=eq.${homeId}` : undefined },
        handlePoolChange
    );
    const poolId = useLocalSearchParams<{ id: string }>();

    const [pool, setPool] = useState<Pool | null>(null);
    const [formData, setFormData] = useState({
        type: POOL_TYPES[0] as string,
        installation_type: INSTALLATION_TYPES[0] as string,
        notes: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const foundPool = pools.find((p: any) => p.id === poolId.id);
        if (foundPool) {
            setPool(foundPool);
            setFormData({
                type: foundPool.type || POOL_TYPES[0],
                installation_type: foundPool.installation_type || INSTALLATION_TYPES[0],
                notes: foundPool.notes || ''
            });
        }
    }, [pools, poolId]);

    const handleSave = async () => {
        if (!pool) return;

        setIsLoading(true);
        try {
            await updatePool(homeId, poolId.id, {
                type: formData.type || null,
                installation_type: formData.installation_type || null,
                notes: formData.notes || null
            });

            Alert.alert('Success', 'Pool updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating pool:', error);
            Alert.alert('Error', 'Failed to update pool');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Discard Changes?',
            'You have unsaved changes. Are you sure you want to discard them?',
            [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() }
            ]
        );
    };

    if (!pool) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Pool</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Pool not found or has been deleted.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleCancel}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Pool</Text>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={[styles.saveButtonText, { color: colors.background }]}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pool Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Water Type *</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Picker
                                selectedValue={formData.type}
                                onValueChange={(itemValue) => setFormData({ ...formData, type: itemValue })}
                                style={[{ color: colors.text }]}
                                dropdownIconColor={colors.text}
                            >
                                {POOL_TYPES.map((typeOption) => (
                                    <Picker.Item key={typeOption} label={typeOption.replace('_', ' ').toUpperCase()} value={typeOption} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Installation Type *</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Picker
                                selectedValue={formData.installation_type}
                                onValueChange={(itemValue) => setFormData({ ...formData, installation_type: itemValue })}
                                style={[{ color: colors.text }]}
                                dropdownIconColor={colors.text}
                            >
                                {INSTALLATION_TYPES.map((typeOption) => (
                                    <Picker.Item key={typeOption} label={typeOption.replace('_', ' ').toUpperCase()} value={typeOption} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            placeholder="Enter any additional notes or information"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerRight: {
        width: 60,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 100,
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
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
});
