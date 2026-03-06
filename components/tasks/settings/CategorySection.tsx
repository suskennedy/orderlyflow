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
    colors: any;
    children: React.ReactNode;
}

const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    isExpanded,
    onToggle,
    onAdd,
    addLabel = 'Add',
    colors,
    children,
}) => {
    return (
        <View style={{ marginBottom: 12, marginHorizontal: 20 }}>
            <TouchableOpacity
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={onToggle}
            >
                <Text style={[styles.categoryCardTitle, { color: colors.text }]}>{category}</Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={colors.textSecondary}
                />
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
