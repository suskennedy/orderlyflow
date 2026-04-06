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
    const badgeLabel = [task.category, task.suggestedFrequency].filter(Boolean).join(' · ');

    return (
        <View style={[styles.taskDetailsContainer, { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }]}>

            {/* ── A. Title Card ── */}
            <View style={[styles.titleCard, { borderBottomColor: colors.border }]}>
                <View style={styles.titleCardBody}>
                    {badgeLabel ? (
                        <View style={[styles.titleBadge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.titleBadgeText, { color: colors.primary }]}>{badgeLabel}</Text>
                        </View>
                    ) : null}
                    <Text style={[styles.titleName, { color: colors.text }]}>{task.name}</Text>
                    {(task.description || task.databaseTask?.description) ? (
                        <Text style={[styles.titleDesc, { color: colors.textSecondary }]}>
                            {task.description || task.databaseTask?.description}
                        </Text>
                    ) : null}
                </View>

                {/* Active toggle */}
                <TouchableOpacity
                    style={[
                        styles.toggleSwitch,
                        { backgroundColor: taskForm?.is_active !== false ? colors.primary : colors.border, marginTop: 2 }
                    ]}
                    onPress={() => onUpdateForm('is_active', !(taskForm?.is_active !== false))}
                >
                    <View style={[
                        styles.toggleKnob,
                        {
                            backgroundColor: '#FFFFFF',
                            transform: [{ translateX: taskForm?.is_active !== false ? 18 : 0 }]
                        }
                    ]} />
                </TouchableOpacity>
            </View>

            {/* ── Form Body ── */}
            <View style={styles.detailFormSection}>

                {/* ── B. Settings section ── */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Settings</Text>

                {/* Vendor field */}
                <TouchableOpacity
                    style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={onOpenVendorModal}
                    activeOpacity={0.7}
                >
                    <View style={styles.fieldRow}>
                        <View style={[styles.fieldIconBox, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.fieldBody}>
                            <Text style={[styles.fieldLbl, { color: colors.textSecondary }]}>Assign Vendor</Text>
                            {assignedVendor ? (
                                <Text style={[styles.fieldVal, { color: colors.text }]}>{assignedVendor.name}</Text>
                            ) : (
                                <Text style={[styles.fieldValEmpty, { color: colors.textSecondary }]}>Select vendor…</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>

                {/* ── D. Schedule section ── */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Schedule</Text>

                {/* Date + Time pills */}
                <View style={styles.dtRow}>
                    <View style={[styles.dtPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.dtPillLabel, { color: colors.textSecondary }]}>Due Date</Text>
                        <View style={styles.dtPillValue}>
                            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                            <Text style={[styles.dtPillText, { color: taskForm?.due_date ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                                {taskForm?.due_date || 'Set date'}
                            </Text>
                            {taskForm?.due_date ? (
                                <TouchableOpacity style={styles.dtClearBtn} onPress={() => onUpdateForm('due_date', null)}>
                                    <Ionicons name="close" size={9} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <View style={styles.dtPickerWrapper}>
                            <DatePicker
                                label=""
                                value={taskForm?.due_date}
                                placeholder="Select date"
                                onChange={(dateString: string | null) => onUpdateForm('due_date', dateString)}
                                isOptional={false}
                            />
                        </View>
                    </View>

                    <View style={[styles.dtPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.dtPillLabel, { color: colors.textSecondary }]}>Time</Text>
                        <View style={styles.dtPillValue}>
                            <Ionicons name="time-outline" size={13} color={colors.primary} />
                            <Text style={[styles.dtPillText, { color: taskForm?.due_time ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                                {taskForm?.due_time || 'Set time'}
                            </Text>
                            {taskForm?.due_time ? (
                                <TouchableOpacity style={styles.dtClearBtn} onPress={() => onUpdateForm('due_time', null)}>
                                    <Ionicons name="close" size={9} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <View style={styles.dtPickerWrapper}>
                            <TimePicker
                                label=""
                                value={taskForm?.due_time}
                                placeholder="Select time"
                                onChange={(timeString: string | null) => onUpdateForm('due_time', timeString)}
                                isOptional={false}
                            />
                        </View>
                    </View>
                </View>

                {/* ── F. Recurring Reminder row ── */}
                <View style={[styles.recurringRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.recurringIconBox, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="repeat-outline" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.recurringText}>
                        <Text style={[styles.recurringTitle, { color: colors.text }]}>Recurring Reminder</Text>
                        <Text style={[styles.recurringSub, { color: colors.textSecondary }]}>Repeat on a set schedule</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggleSwitch,
                            { backgroundColor: taskForm?.is_recurring ? colors.primary : colors.border }
                        ]}
                        onPress={onToggleRecurrence}
                    >
                        <View style={[
                            styles.toggleKnob,
                            {
                                backgroundColor: '#FFFFFF',
                                transform: [{ translateX: taskForm?.is_recurring ? 18 : 0 }]
                            }
                        ]} />
                    </TouchableOpacity>
                </View>

                {/* ── G. Recurrence dropdown (keep existing logic) ── */}
                {taskForm?.is_recurring && (
                    <View style={styles.recurrenceOptions}>
                        <TouchableOpacity
                            style={[styles.recurrencePatternBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={onToggleRecurrenceDropdown}
                        >
                            <Text style={[styles.recurrencePatternBtnText, { color: taskForm.recurrence_pattern ? colors.text : colors.textSecondary }]}>
                                {taskForm.recurrence_pattern
                                    ? RECURRENCE_OPTIONS.find(opt => opt.value === taskForm.recurrence_pattern)?.label
                                    : 'Select frequency…'}
                            </Text>
                            <Ionicons name={showRecurrenceOptions ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
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
                                            <Ionicons name="checkmark" size={16} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={{ marginBottom: 6 }}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 6 }]}>Repeat Until</Text>
                            <DatePicker
                                label=""
                                value={taskForm.recurrence_end_date}
                                placeholder="Select end date (optional)"
                                onChange={(dateString: string | null) => onUpdateForm('recurrence_end_date', dateString)}
                                isOptional={true}
                            />
                        </View>
                    </View>
                )}

                {/* ── H. Additional Notes ── */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
                <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.textArea, { color: colors.text }]}
                        value={taskForm?.notes}
                        onChangeText={(text) => onUpdateForm('notes', text)}
                        placeholder="Any additional instructions…"
                        placeholderTextColor={colors.textSecondary}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>

                {/* ── J. Save Changes button ── */}
                <TouchableOpacity
                    style={[styles.detailSaveButton, { backgroundColor: colors.primary }]}
                    onPress={onSave}
                >
                    <Text style={[styles.detailSaveButtonText, { color: '#FFFFFF' }]}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TaskDetailForm;
