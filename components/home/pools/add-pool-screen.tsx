import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { INSTALLATION_TYPES, POOL_TYPES, PoolFormData, poolFormSchema, transformPoolFormData } from '../../../lib/schemas/home/poolFormSchema';
import { usePoolsStore } from '../../../lib/stores/poolsStore';
import { FONTS } from '../../../lib/typography';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function AddPoolScreen() {
    const { homeId } = useLocalSearchParams<{ homeId: string }>();
    const createPool = usePoolsStore(state => state.createPool);
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        clearErrors,
        formState: { errors }
    } = useForm<PoolFormData>({
        resolver: zodResolver(poolFormSchema),
        defaultValues: {
            name: 'Pool',
            salt_water_vs_chlorine: POOL_TYPES[0],
            in_ground_vs_above_ground: INSTALLATION_TYPES[0],
            notes: '',
        }
    });

    const formData = watch();

    const notesRef = useRef<TextInput>(null);

    const onSubmit = async (data: PoolFormData) => {
        setLoading(true);
        try {
            const transformedData = transformPoolFormData(data);
            await createPool(homeId, transformedData as any);
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to add pool. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const getTextAreaStyle = () => {
        const isFocused = focusedField === 'notes';
        return [
            styles.textArea,
            {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: isFocused ? colors.primary : colors.border,
                borderWidth: isFocused ? 2 : 1,
            }
        ];
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader title="Add Pool" showBackButton />
            <ScrollView
                contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.form}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pool Details</Text>

                    <Text style={[styles.label, { color: colors.text }]}>Pool name *</Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: errors.name ? colors.error : focusedField === 'name' ? colors.primary : colors.border,
                                borderWidth: errors.name || focusedField === 'name' ? 2 : 1,
                            },
                        ]}
                        value={formData.name || ''}
                        onChangeText={(text) => {
                            setValue('name', text);
                            if (errors.name) clearErrors('name');
                        }}
                        placeholder="e.g., Main pool, Spa"
                        placeholderTextColor={colors.textTertiary}
                        onFocus={() => handleFocus('name')}
                        onBlur={handleBlur}
                    />
                    {errors.name && (
                        <Text style={[styles.errorText, { color: colors.error }]}>{errors.name.message}</Text>
                    )}

                    <Text style={[styles.label, { color: colors.text }]}>Water Type *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Picker
                            selectedValue={formData.salt_water_vs_chlorine}
                            onValueChange={(itemValue) => setValue('salt_water_vs_chlorine', itemValue)}
                            style={[{ color: colors.text }]}
                            dropdownIconColor={colors.text}
                        >
                            {POOL_TYPES.map((typeOption) => (
                                <Picker.Item key={typeOption} label={typeOption.replace('_', ' ').toUpperCase()} value={typeOption} />
                            ))}
                        </Picker>
                    </View>
                    {errors.salt_water_vs_chlorine && (
                        <Text style={[styles.errorText, { color: colors.error }]}>
                            {errors.salt_water_vs_chlorine.message}
                        </Text>
                    )}

                    <Text style={[styles.label, { color: colors.text }]}>Installation Type *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Picker
                            selectedValue={formData.in_ground_vs_above_ground}
                            onValueChange={(itemValue) => setValue('in_ground_vs_above_ground', itemValue)}
                            style={[{ color: colors.text }]}
                            dropdownIconColor={colors.text}
                        >
                            {INSTALLATION_TYPES.map((typeOption) => (
                                <Picker.Item key={typeOption} label={typeOption.replace('_', ' ').toUpperCase()} value={typeOption} />
                            ))}
                        </Picker>
                    </View>
                    {errors.in_ground_vs_above_ground && (
                        <Text style={[styles.errorText, { color: colors.error }]}>
                            {errors.in_ground_vs_above_ground.message}
                        </Text>
                    )}

                    <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                    <TextInput
                        ref={notesRef}
                        style={[
                            getTextAreaStyle(),
                            errors.notes && { borderColor: colors.error, borderWidth: 2 }
                        ]}
                        value={formData.notes || ''}
                        onChangeText={text => {
                            setValue('notes', text);
                            if (errors.notes) clearErrors('notes');
                        }}
                        placeholder="Any additional notes about this pool..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        onFocus={() => handleFocus('notes')}
                        onBlur={handleBlur}
                        returnKeyType="done"
                    />
                    {errors.notes && (
                        <Text style={[styles.errorText, { color: colors.error }]}>
                            {errors.notes.message}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={loading}
                    >
                        <Ionicons name="water" size={24} color={colors.textInverse} />
                        <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
                            {loading ? 'Adding...' : 'Add Pool'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        padding: 20,
    },
    form: {
        gap: 20,
    },
    sectionTitle: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        fontWeight: '700',
        marginTop: 10,
        marginBottom: 5,
    },
    label: {
        fontFamily: FONTS.bodySemiBold,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        fontFamily: FONTS.body,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        fontFamily: FONTS.body,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 100,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        fontFamily: FONTS.bodySemiBold,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    errorText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
});
