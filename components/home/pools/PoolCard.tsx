import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { usePoolsStore } from '../../../lib/stores/poolsStore';

interface Pool {
    id: string;
    salt_water_vs_chlorine: string | null;
    in_ground_vs_above_ground: string | null;
    notes: string | null;
}

interface PoolCardProps {
    pool: Pool;
}

export default function PoolCard({ pool }: PoolCardProps) {
    const { colors } = useTheme();
    const { homeId } = useLocalSearchParams<{ homeId: string }>();
    const deletePool = usePoolsStore(state => state.deletePool);
    const [expanded, setExpanded] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            'Delete Pool',
            'Are you sure you want to delete this pool?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (homeId) {
                                await deletePool(homeId, pool.id);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete pool');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        router.push(`/(tabs)/(home)/${homeId}/pools/${pool.id}`);
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: colors.text }]}>Pool</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {pool.in_ground_vs_above_ground?.replace('_', ' ').toUpperCase()} • {pool.salt_water_vs_chlorine?.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={[styles.details, { borderTopColor: colors.border }]}>
                    {pool.notes && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes:</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{pool.notes}</Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
                            onPress={handleEdit}
                        >
                            <Ionicons name="pencil" size={20} color={colors.primary} />
                            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF3B3010' }]}
                            onPress={handleDelete}
                        >
                            <Ionicons name="trash" size={20} color="#FF3B30" />
                            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    details: {
        padding: 16,
        borderTopWidth: 1,
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
