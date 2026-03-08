import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from '../../DatePicker';
import TimePicker from '../../TimePicker';
import { RECURRENCE_OPTIONS } from './constants';
import { styles } from './styles';

interface TaskDetailFormProps {
    task: any;
    taskForm: any;
    colors: any;
    assignedVendor: any;
    showRecurrenceOptions: boolean;
    onOpenVendorModal: () => void;
    onUpdateForm: (field: string, value: any) => void;
    onToggleRecurrence: () => void;
    onToggleRecurrenceDropdown: () => void;
    onSelectRecurrence: (value: string | null) => void;
    onSave: () => void;
}

const TaskDetailForm: React.FC<TaskDetailFormProps> = ({
    task,
    taskForm,
    colors,
    assignedVendor,
    showRecurrenceOptions,
    onOpenVendorModal,
    onUpdateForm,
    onToggleRecurrence,
    onToggleRecurrenceDropdown,
    onSelectRecurrence,
    onSave,
}) => {
    return (
        <View style={[styles.taskDetailsContainer, { backgroundColor: colors.surface }]}>
            {/* Description Section */}
            {(task.description || task.databaseTask?.description) && (
                <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.textSecondary }]}>Description</Text>
                    <Text style={[styles.detailDescriptionText, { color: colors.text }]}>
                        {task.description || task.databaseTask?.description}
                    </Text>
                    {task.databaseTask?.suggested_use && (
                        <Text style={[styles.suggestedUseText, { color: colors.primary }]}>
                            Suggested Use: {task.databaseTask.suggested_use}
                        </Text>
                    )}
                </View>
            )}

            {/* Settings Sections */}
            <View style={styles.detailFormSection}>
                <Text style={[styles.detailSectionTitle, { color: colors.textSecondary }]}>Settings</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Assign Vendor</Text>
                    <TouchableOpacity
                        style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={onOpenVendorModal}
                    >
                        <Ionicons name="business-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                        <Text
                            style={[styles.inputText, { color: assignedVendor ? colors.text : colors.textTertiary }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {assignedVendor ? assignedVendor.name : 'Select vendor...'}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Due Date</Text>
                        <DatePicker
                            label=""
                            value={taskForm.due_date}
                            placeholder="Select date"
                            onChange={(dateString: string | null) => onUpdateForm('due_date', dateString)}
                            isOptional={false}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Time</Text>
                        <TimePicker
                            label=""
                            value={taskForm.due_time}
                            placeholder="Select time"
                            onChange={(timeString: string | null) => onUpdateForm('due_time', timeString)}
                            isOptional={false}
                        />
                    </View>
                </View>

                {/* Recurrence Section */}
                <View style={[styles.recurrenceSettingContainer, { borderColor: colors.border }]}>
                    <View style={styles.switchRow}>
                        <View style={styles.switchLabelGroup}>
                            <Ionicons name="repeat-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.switchLabel, { color: colors.text }]}>Recurring Reminder</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.toggleSwitch,
                                { backgroundColor: taskForm.is_recurring ? colors.primary : colors.border }
                            ]}
                            onPress={onToggleRecurrence}
                        >
                            <View style={[
                                styles.toggleKnob,
                                {
                                    backgroundColor: '#FFFFFF',
                                    transform: [{ translateX: taskForm.is_recurring ? 22 : 2 }]
                                }
                            ]} />
                        </TouchableOpacity>
                    </View>

                    {taskForm.is_recurring && (
                        <View style={styles.recurrenceOptions}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recurrence Pattern</Text>
                                <TouchableOpacity
                                    style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={onToggleRecurrenceDropdown}
                                >
                                    <Text style={[styles.inputText, { color: taskForm.recurrence_pattern ? colors.text : colors.textTertiary }]}>
                                        {taskForm.recurrence_pattern ?
                                            RECURRENCE_OPTIONS.find(opt => opt.value === taskForm.recurrence_pattern)?.label :
                                            'Select frequency...'
                                        }
                                    </Text>
                                    <Ionicons name={showRecurrenceOptions ? "chevron-up" : "chevron-down"} size={18} color={colors.textTertiary} />
                                </TouchableOpacity>

                                {showRecurrenceOptions && (
                                    <View style={[styles.recurrenceDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        {RECURRENCE_OPTIONS.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value || 'none'}
                                                style={styles.recurrenceOption}
                                                onPress={() => onSelectRecurrence(opt.value)}
                                            >
                                                <Text style={[styles.recurrenceOptionText, { color: colors.text }]}>{opt.label}</Text>
                                                {taskForm.recurrence_pattern === opt.value && (
                                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Repeat Until</Text>
                                <DatePicker
                                    label=""
                                    value={taskForm.recurrence_end_date}
                                    placeholder="Select end date"
                                    onChange={(dateString: string | null) => onUpdateForm('recurrence_end_date', dateString)}
                                    isOptional={true}
                                />
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={taskForm.notes}
                        onChangeText={(text) => onUpdateForm('notes', text)}
                        placeholder="Any additional instructions..."
                        placeholderTextColor={colors.textTertiary}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.detailSaveButton, { backgroundColor: colors.primary }]}
                onPress={onSave}
            >
                <Text style={[styles.detailSaveButtonText, { color: '#FFFFFF' }]}>Save Changes</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TaskDetailForm;
