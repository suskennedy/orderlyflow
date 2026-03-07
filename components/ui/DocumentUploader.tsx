import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { uploadFileToSupabase, UploadResult } from '../../lib/services/uploadService';

interface DocumentUploaderProps {
    label: string;
    onUploadComplete: (result: UploadResult) => void;
    onUploadStart?: () => void;
    onUploadError?: (error: string) => void;
    currentFileUrl?: string;
    disabled?: boolean;
    userId?: string;
    targetFolder?: string;
}

export default function DocumentUploader({
    label,
    onUploadComplete,
    onUploadStart,
    onUploadError,
    currentFileUrl,
    disabled = false,
    userId,
    targetFolder = 'appliances',
}: DocumentUploaderProps) {
    const { colors } = useTheme();
    const [uploading, setUploading] = useState(false);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadDocument(asset.uri);
            }
        } catch (error) {
            console.error('Document picker error:', error);
            onUploadError?.('Failed to pick document');
        }
    };

    const uploadDocument = async (uri: string) => {
        if (!userId) {
            Alert.alert('Error', 'User ID is required for uploads');
            return;
        }

        setUploading(true);
        onUploadStart?.();

        try {
            const result = await uploadFileToSupabase(uri, {
                bucketName: 'profiles', // We are using 'profiles' bucket but 'appliances' folder as per plan
                targetFolder: targetFolder as any,
                userId,
            });

            onUploadComplete(result);
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            onUploadError?.(errorMessage);
            Alert.alert('Upload Failed', errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const getFileNameFromUrl = (url?: string) => {
        if (!url) return '';
        const parts = url.split('/');
        return parts[parts.length - 1];
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

            {currentFileUrl ? (
                <View style={[styles.filePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
                        {getFileNameFromUrl(currentFileUrl)}
                    </Text>
                    <TouchableOpacity
                        style={[styles.replaceButton, { backgroundColor: colors.primaryLight }]}
                        onPress={pickDocument}
                        disabled={uploading || disabled}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[styles.replaceButtonText, { color: colors.primary }]}>Replace</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        disabled && styles.disabled
                    ]}
                    onPress={pickDocument}
                    disabled={uploading || disabled}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                            <Text style={[styles.uploadButtonText, { color: colors.primary }]}>Upload PDF</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    uploadButton: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    filePreview: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
    },
    replaceButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    replaceButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    }
});
