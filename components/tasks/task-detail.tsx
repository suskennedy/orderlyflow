import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useTasksStore } from '../../lib/stores/tasksStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { supabase } from '../../lib/supabase';
import DatePicker from '../DatePicker';

export default function TaskDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const { user } = useAuth();
    const { allHomeTasks, updateHomeTask, fetchHomeTasks } = useTasksStore();
    const { vendors } = useVendorsStore();

    const [task, setTask] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: '',
        priority: '',
        due_date: '',
        assigned_vendor_id: '',
        notes: '',
        room_location: '',
    });

    useEffect(() => {
        if (!id) return;
        const taskId = Array.isArray(id) ? id[0] : id;

        const foundTask = allHomeTasks.find((t) => t.id === taskId || (t as any).original_id === taskId);
        if (foundTask) {
            setTask(foundTask);
            setFormData({
                title: foundTask.title || '',
                description: foundTask.description || '',
                status: foundTask.status || 'pending',
                priority: foundTask.priority || 'medium',
                due_date: foundTask.due_date || '',
                assigned_vendor_id: foundTask.assigned_vendor_id || '',
                notes: foundTask.notes || '',
                room_location: foundTask.room_location || '',
            });
        } else {
            // Fallback: fetch from DB if not in store
            const fetchTask = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('home_tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();

                if (!error && data) {
                    setTask(data);
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        status: data.status || 'pending',
                        priority: data.priority || 'medium',
                        due_date: data.due_date || '',
                        assigned_vendor_id: data.assigned_vendor_id || '',
                        notes: data.notes || '',
                        room_location: data.room_location || '',
                    });
                }
                setLoading(false);
            };
            fetchTask();
        }
    }, [id, allHomeTasks]);

    const handleSave = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        setLoading(true);
        try {
            const homeTaskId = (task as any).original_id || task.id;
            await updateHomeTask(homeTaskId, formData);
            setIsEditing(false);
            Alert.alert('Success', 'Task updated successfully');
            if (task.home_id) {
                fetchHomeTasks(task.home_id);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !task) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Task not found</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {isEditing ? 'Edit Task' : 'Task Details'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={formData.title}
                                onChangeText={(text) => setFormData({ ...formData, title: text })}
                            />
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>{task.title}</Text>
                        )}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
                        <Text style={[styles.value, { color: colors.text, textTransform: 'capitalize' }]}>
                            {task.status || 'Pending'}
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date</Text>
                        {isEditing ? (
                            <DatePicker
                                label="Due Date"
                                value={formData.due_date || ''}
                                onChange={(date) => setFormData({ ...formData, due_date: date || '' })}
                                placeholder="Select due date"
                            />
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Assigned Vendor</Text>
                        {isEditing ? (
                            <View style={styles.pickerContainer}>
                                {vendors.map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        onPress={() => setFormData({ ...formData, assigned_vendor_id: v.id })}
                                        style={[
                                            styles.pickerItem,
                                            formData.assigned_vendor_id === v.id && { backgroundColor: colors.primary + '20' }
                                        ]}
                                    >
                                        <Text style={{ color: formData.assigned_vendor_id === v.id ? colors.primary : colors.text }}>
                                            {v.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    onPress={() => setFormData({ ...formData, assigned_vendor_id: '' })}
                                    style={[
                                        styles.pickerItem,
                                        !formData.assigned_vendor_id && { backgroundColor: colors.primary + '20' }
                                    ]}
                                >
                                    <Text style={{ color: !formData.assigned_vendor_id ? colors.primary : colors.text }}>
                                        None
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>
                                {vendors.find(v => v.id === task.assigned_vendor_id)?.name || 'Not assigned'}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                value={formData.room_location}
                                onChangeText={(text) => setFormData({ ...formData, room_location: text })}
                                placeholder="e.g. Kitchen, Backyard"
                            />
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>
                                {task.room_location || 'Not specified'}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                multiline
                            />
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>
                                {task.description || 'No description'}
                            </Text>
                        )}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
                                value={formData.notes}
                                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                                multiline
                            />
                        ) : (
                            <Text style={[styles.value, { color: colors.text }]}>
                                {task.notes || 'No notes'}
                            </Text>
                        )}
                    </View>

                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        lineHeight: 22,
    },
    input: {
        fontSize: 16,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 5,
    },
    pickerItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButton: {
        marginTop: 20,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
