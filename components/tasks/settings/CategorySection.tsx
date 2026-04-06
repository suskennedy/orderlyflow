import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface CategorySectionProps {
    category: string;
    isExpanded: boolean;
    onToggle: () => void;
    onAdd?: () => void;
    addLabel?: string;
    taskCount?: number;
    activeCount?: number;
    colors: any;
    children: React.ReactNode;
}

const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    isExpanded,
    onToggle,
    onAdd,
    addLabel = 'Add',
    taskCount,
    activeCount,
    colors,
    children,
}) => {
    const subText = taskCount !== undefined
        ? activeCount !== undefined && activeCount > 0
            ? `${taskCount} reminder${taskCount !== 1 ? 's' : ''} · ${activeCount} active`
            : `${taskCount} reminder${taskCount !== 1 ? 's' : ''}`
        : undefined;

    return (
        <View style={{ marginBottom: 2 }}>
            <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                <View style={styles.categoryTitleBlock}>
                    <Text style={[styles.categoryCardTitle, { color: colors.text }]}>{category}</Text>
                    {subText ? (
                        <Text style={[styles.categoryCardSub, { color: colors.textSecondary }]}>{subText}</Text>
                    ) : null}
                </View>
                <View style={styles.categoryCardRight}>
                    {taskCount !== undefined && (
                        <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{taskCount}</Text>
                        </View>
                    )}
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={[styles.expandedSection, { backgroundColor: colors.surface }]}>
                    {children}

                    {onAdd && (
                        <TouchableOpacity
                            style={[styles.addInlineButton, { borderColor: colors.primary + '30' }]}
                            onPress={onAdd}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            <Text style={[styles.addInlineButtonText, { color: colors.primary }]}>
                                {addLabel}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

export default CategorySection;
