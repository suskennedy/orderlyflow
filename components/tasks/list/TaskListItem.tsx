import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getHomeDisplayText } from '../../../lib/utils/homeDisplayUtils';
import { getVendorDisplayText } from '../../../lib/utils/vendorDisplayUtils';
import { styles } from './styles';

interface TaskListItemProps {
    item: any;
    isExpanded: boolean;
    isCompleted: boolean;
    savingTaskId: string | null;
    colors: any;
    homes: any[];
    vendors: any[];
    onPress: () => void;
    onToggle: () => void;
    onClose: () => void;
    formatDate: (date: string | null) => string;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
    item,
    isExpanded,
    isCompleted,
    savingTaskId,
    colors,
    homes,
    vendors,
    onPress,
    onToggle,
    onClose,
    formatDate,
}) => {
    const getTypeInfo = () => {
        if (item.item_type === 'repair') {
            return { icon: 'construct' as const, color: '#FF6B35', label: 'Repair' };
        } else if (item.item_type === 'project') {
            return { icon: 'hammer' as const, color: '#4ECDC4', label: 'Project' };
        } else {
            return { icon: 'notifications' as const, color: colors.primary, label: 'Reminder' };
        }
    };

    const typeInfo = getTypeInfo();
    const displayDate = item.next_due || item.due_date || item.completed_at;

    return (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[
                    styles.taskCard,
                    {
                        backgroundColor: isCompleted ? colors.surfaceVariant : colors.surface,
                        opacity: isCompleted ? 0.8 : 1,
                    },
                ]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={[styles.taskIndicator, { backgroundColor: typeInfo.color }]} />

                <View style={styles.taskContent}>
                    <View style={styles.taskInfo}>
                        <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}15` }]}>
                            <Text style={[styles.typeText, { color: typeInfo.color }]}>
                                {typeInfo.label}
                            </Text>
                        </View>

                        <Text
                            style={[
                                styles.taskTitle,
                                {
                                    color: colors.text,
                                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                                },
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>

                        <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>
                            {item.category && `${item.category} • `}{getHomeDisplayText(item, homes)}
                        </Text>

                        <View style={styles.metaContainer}>
                            {displayDate && (
                                <View style={styles.metaItem}>
                                    <Ionicons
                                        name={isCompleted ? "checkmark-circle" : "calendar-clear-outline"}
                                        size={14}
                                        color={isCompleted ? colors.success : colors.textTertiary}
                                    />
                                    <Text style={[styles.metaText, { color: isCompleted ? colors.success : colors.textTertiary }]}>
                                        {isCompleted ? `Completed ${formatDate(item.completed_at)}` : formatDate(displayDate)}
                                    </Text>
                                </View>
                            )}

                            {item.is_recurring && !isCompleted && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="repeat" size={14} color={colors.primary} />
                                    <Text style={[styles.metaText, { color: colors.primary }]}>
                                        {item.recurrence_pattern}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[
                                styles.checkbox,
                                {
                                    borderColor: isCompleted ? colors.success : colors.border,
                                    backgroundColor: isCompleted ? colors.success : 'transparent',
                                    opacity: savingTaskId === item.id ? 0.5 : 1,
                                },
                            ]}
                            onPress={onToggle}
                            disabled={savingTaskId === item.id}
                        >
                            {isCompleted && <Ionicons name="checkmark" size={18} color="#FFF" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.expandButton} onPress={onPress}>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={[styles.dropdownContainer, { backgroundColor: isCompleted ? colors.surfaceVariant : colors.surface }]}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.detailSection}>
                        <View style={styles.detailRow}>
                            <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Assigned Vendor</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {getVendorDisplayText(item, vendors)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="prism-outline" size={18} color={colors.textSecondary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Priority</Text>
                                <Text style={[styles.detailValue, {
                                    color: item.priority === 'high' ? colors.error :
                                        item.priority === 'medium' ? colors.warning : colors.success
                                }]}>
                                    {(item.priority || 'Medium').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {item.notes && (
                            <View style={styles.detailRow}>
                                <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Notes</Text>
                                    <View style={[styles.notesContainer, { backgroundColor: `${colors.primary}05` }]}>
                                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                                            {item.notes}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: `${colors.textTertiary}15` }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                                Close Details
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

export default TaskListItem;
