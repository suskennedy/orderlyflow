import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface TaskItemProps {
    task: any;
    isExpanded: boolean;
    isSelected: boolean;
    onToggle: () => void;
    onExpand: () => void;
    renderDetailForm: () => React.ReactNode;
    colors: any;
}

const TaskItem: React.FC<TaskItemProps> = ({
    task,
    isExpanded,
    isSelected,
    onToggle,
    onExpand,
    renderDetailForm,
    colors,
}) => {
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const d = new Date(year, month - 1, day);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formattedDate = formatDate(task.dueDate);

    return (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[styles.taskCard, { backgroundColor: colors.surface }]}
                onPress={onExpand}
                activeOpacity={0.7}
            >
                {/* Toggle on the left */}
                <TouchableOpacity
                    style={[
                        styles.toggleSwitch,
                        { backgroundColor: isSelected ? colors.primary : colors.border }
                    ]}
                    onPress={(e) => { e.stopPropagation?.(); onToggle(); }}
                    activeOpacity={0.8}
                >
                    <View style={[
                        styles.toggleKnob,
                        {
                            backgroundColor: '#FFFFFF',
                            transform: [{ translateX: isSelected ? 18 : 0 }]
                        }
                    ]} />
                </TouchableOpacity>

                {/* Task info + tags */}
                <View style={styles.taskHeader}>
                    <View style={styles.taskInfo}>
                        <Text
                            style={[styles.taskName, { color: colors.text }]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {task.name}
                        </Text>

                        <View style={styles.taskTagsRow}>
                            {/* Type/frequency tag */}
                            {task.suggestedFrequency ? (
                                <View style={[styles.tagPill, styles.tagPillType]}>
                                    <Text style={[styles.tagText, styles.tagTextType]}>{task.suggestedFrequency}</Text>
                                </View>
                            ) : null}

                            {/* Vendor tag */}
                            {task.assignedVendor ? (
                                <View style={[styles.tagPill, styles.tagPillVendor]}>
                                    <Text style={[styles.tagText, styles.tagTextVendor]}>{task.assignedVendor.name}</Text>
                                </View>
                            ) : null}

                            {/* Due date tag */}
                            {formattedDate ? (
                                <View style={[styles.tagPill, styles.tagPillDate]}>
                                    <Text style={[styles.tagText, styles.tagTextDate]}>{formattedDate}</Text>
                                </View>
                            ) : null}

                            {/* Active tag */}
                            {isSelected ? (
                                <View style={[styles.tagPill, styles.tagPillActive]}>
                                    <Text style={[styles.tagText, styles.tagTextActive]}>Active</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {/* Expand chevron */}
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-forward'}
                        size={16}
                        color={colors.textSecondary}
                        style={styles.editButton}
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && renderDetailForm()}
        </View>
    );
};

export default TaskItem;
