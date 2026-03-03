import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserSettings {
    full_name: string;
    phone: string;
    notification_sms: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string; // HH:mm
    quiet_hours_end: string;   // HH:mm
    timezone: string;
}

const DEFAULT_SETTINGS: UserSettings = {
    full_name: '',
    phone: '',
    notification_sms: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    timezone: Localization.getCalendars()[0]?.timeZone ?? 'UTC',
};

export default function UserSettingsSection() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

    // ─── Load ────────────────────────────────────────────────────────
    const loadSettings = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading user settings:', error);
                return;
            }

            if (data) {
                const loaded: UserSettings = {
                    full_name: data.full_name ?? '',
                    phone: data.phone ?? '',
                    notification_sms: data.notification_sms ?? false,
                    quiet_hours_enabled: data.quiet_hours_enabled ?? false,
                    quiet_hours_start: formatTimeFromDB(data.quiet_hours_start) ?? '22:00',
                    quiet_hours_end: formatTimeFromDB(data.quiet_hours_end) ?? '07:00',
                    timezone: data.timezone ?? Localization.getCalendars()[0]?.timeZone ?? 'UTC',
                };
                setSettings(loaded);
                setOriginalSettings(loaded);
            }
        } catch (err) {
            console.error('Error loading user settings:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // ─── Helpers ─────────────────────────────────────────────────────
    /** DB may store TIME as "22:00:00", strip seconds for display. */
    const formatTimeFromDB = (value: string | null | undefined): string | null => {
        if (!value) return null;
        // "22:00:00" → "22:00"
        const parts = value.split(':');
        if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        return value;
    };

    const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            setHasChanges(JSON.stringify(next) !== JSON.stringify(originalSettings));
            return next;
        });
    };

    // ─── Save ────────────────────────────────────────────────────────
    const saveSettings = async () => {
        if (!user?.id) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('user_profiles')
                .upsert(
                    {
                        id: user.id,
                        full_name: settings.full_name,
                        phone: settings.phone,
                        notification_sms: settings.notification_sms,
                        quiet_hours_enabled: settings.quiet_hours_enabled,
                        quiet_hours_start: settings.quiet_hours_start,
                        quiet_hours_end: settings.quiet_hours_end,
                        timezone: settings.timezone,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'id' }
                );

            if (error) {
                console.error('Error saving user settings:', error);
                Alert.alert('Error', `Failed to save settings: ${error.message}`);
                return;
            }

            setOriginalSettings(settings);
            setHasChanges(false);
            Alert.alert('Saved', 'Your settings have been updated.');
        } catch (err) {
            console.error('Error saving user settings:', err);
            Alert.alert('Error', 'Something went wrong while saving.');
        } finally {
            setSaving(false);
        }
    };

    // ─── Time picker helpers (simple scroll-based) ───────────────────
    const cycleTime = (current: string, direction: 'up' | 'down'): string => {
        const [h, m] = current.split(':').map(Number);
        let totalMins = h * 60 + m;
        totalMins += direction === 'up' ? 30 : -30;
        if (totalMins < 0) totalMins = 24 * 60 - 30;
        if (totalMins >= 24 * 60) totalMins = 0;
        const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
        const mm = String(totalMins % 60).padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const formatTime12h = (time24: string): string => {
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    // ─── Render ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>User Settings</Text>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
                <TextInput
                    style={[styles.textInput, {
                        backgroundColor: colors.surfaceVariant,
                        color: colors.text,
                        borderColor: colors.border,
                    }]}
                    value={settings.full_name}
                    onChangeText={text => updateField('full_name', text)}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textTertiary}
                />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                <TextInput
                    style={[styles.textInput, {
                        backgroundColor: colors.surfaceVariant,
                        color: colors.text,
                        borderColor: colors.border,
                    }]}
                    value={settings.phone}
                    onChangeText={text => updateField('phone', text)}
                    placeholder="Required for SMS reminders"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                />
                {settings.notification_sms && !settings.phone.trim() && (
                    <Text style={[styles.warningText, { color: colors.error }]}>
                        Phone number is required when SMS reminders are enabled.
                    </Text>
                )}
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* SMS Reminders toggle */}
            <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                    <View style={styles.switchTextContainer}>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>SMS Reminders</Text>
                        <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                            Receive task reminders via text message
                        </Text>
                    </View>
                </View>
                <Switch
                    value={settings.notification_sms}
                    onValueChange={value => updateField('notification_sms', value)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={settings.notification_sms ? 'white' : colors.textSecondary}
                />
            </View>

            {/* Quiet Hours (visible only when SMS is on) */}
            {settings.notification_sms && (
                <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <Ionicons name="moon-outline" size={20} color={colors.text} />
                            <View style={styles.switchTextContainer}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>Quiet Hours</Text>
                                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                                    Pause SMS during sleeping hours
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.quiet_hours_enabled}
                            onValueChange={value => updateField('quiet_hours_enabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={settings.quiet_hours_enabled ? 'white' : colors.textSecondary}
                        />
                    </View>

                    {settings.quiet_hours_enabled && (
                        <View style={styles.timePickerContainer}>
                            {/* Start time */}
                            <View style={styles.timeBlock}>
                                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>From</Text>
                                <View style={styles.timeControls}>
                                    <TouchableOpacity
                                        onPress={() => updateField('quiet_hours_start', cycleTime(settings.quiet_hours_start, 'down'))}
                                        style={[styles.timeButton, { backgroundColor: colors.surfaceVariant }]}
                                    >
                                        <Ionicons name="chevron-down" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.timeValue, { color: colors.text }]}>
                                        {formatTime12h(settings.quiet_hours_start)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => updateField('quiet_hours_start', cycleTime(settings.quiet_hours_start, 'up'))}
                                        style={[styles.timeButton, { backgroundColor: colors.surfaceVariant }]}
                                    >
                                        <Ionicons name="chevron-up" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* End time */}
                            <View style={styles.timeBlock}>
                                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Until</Text>
                                <View style={styles.timeControls}>
                                    <TouchableOpacity
                                        onPress={() => updateField('quiet_hours_end', cycleTime(settings.quiet_hours_end, 'down'))}
                                        style={[styles.timeButton, { backgroundColor: colors.surfaceVariant }]}
                                    >
                                        <Ionicons name="chevron-down" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.timeValue, { color: colors.text }]}>
                                        {formatTime12h(settings.quiet_hours_end)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => updateField('quiet_hours_end', cycleTime(settings.quiet_hours_end, 'up'))}
                                        style={[styles.timeButton, { backgroundColor: colors.surfaceVariant }]}
                                    >
                                        <Ionicons name="chevron-up" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </>
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Time Zone */}
            <View style={styles.timezoneRow}>
                <View style={styles.switchInfo}>
                    <Ionicons name="globe-outline" size={20} color={colors.text} />
                    <View style={styles.switchTextContainer}>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>Time Zone</Text>
                        <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                            Auto-detected from your device
                        </Text>
                    </View>
                </View>
                <Text style={[styles.timezoneValue, { color: colors.primary }]}>
                    {settings.timezone}
                </Text>
            </View>

            {/* Save button */}
            {hasChanges && (
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={saveSettings}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 16,
    },
    warningText: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    switchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    switchTextContainer: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    switchDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        marginBottom: 4,
    },
    timeBlock: {
        alignItems: 'center',
        gap: 6,
    },
    timeLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    timeControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '600',
        minWidth: 80,
        textAlign: 'center',
    },
    timezoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    timezoneValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        marginTop: 20,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
