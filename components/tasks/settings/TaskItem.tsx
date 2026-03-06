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
    return (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[
                    styles.taskCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? `${colors.primary}20` : 'transparent',
                    }
                ]}
                onPress={onExpand}
                activeOpacity={0.7}
            >
                <View style={styles.taskHeader}>
                    <TouchableOpacity
                        style={styles.taskInfo}
                        onPress={onToggle}
                        activeOpacity={0.6}
                    >
                        <Text
                            style={[styles.taskName, { color: colors.text }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {task.name}
                        </Text>

                        <View style={styles.taskMetaContainer}>
                            {task.suggestedFrequency && (
                                <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
                                    {task.suggestedFrequency}
                                </Text>
                            )}

                            {task.dueDate && (
                                <View style={styles.taskMetaItem}>
                                    <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                                    <Text style={[styles.taskMetaText, { color: colors.textSecondary }]}>
                                        {task.dueDate}
                                    </Text>
                                </View>
                            )}

                            {task.assignedVendor && (
                                <View style={styles.taskMetaItem}>
                                    <Ionicons name="business-outline" size={12} color={colors.primary} />
                                    <Text style={[styles.taskMetaText, { color: colors.textSecondary }]}>
                                        {task.assignedVendor.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.taskActions}>
                        <TouchableOpacity
                            style={[
                                styles.toggleSwitch,
                                { backgroundColor: isSelected ? colors.primary : colors.border }
                            ]}
                            onPress={onToggle}
                        >
                            <View style={[
                                styles.toggleKnob,
                                {
                                    backgroundColor: '#FFFFFF',
                                    transform: [{ translateX: isSelected ? 22 : 2 }]
                                }
                            ]} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.editButton} onPress={onExpand}>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            {isExpanded && renderDetailForm()}
        </View>
    );
};

export default TaskItem;
