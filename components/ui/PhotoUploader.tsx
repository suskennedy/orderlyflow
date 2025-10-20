import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { uploadMultipleFiles, UploadResult, validateFile } from '../../lib/services/uploadService';

interface PhotoUploaderProps {
  onUploadComplete: (results: UploadResult[]) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  existingFiles?: string[];
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 items per row with padding

export default function PhotoUploader({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  maxFiles = 10,
  existingFiles = [],
  disabled = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(existingFiles);
  const [showPicker, setShowPicker] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to upload photos and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileSelection([result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      onUploadError?.('Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: maxFiles - selectedFiles.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri);
        await handleFileSelection(uris);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      onUploadError?.('Failed to select files');
    }
  };

  const handleFileSelection = async (uris: string[]) => {
    if (selectedFiles.length + uris.length > maxFiles) {
      Alert.alert('Too Many Files', `You can only upload up to ${maxFiles} files.`);
      return;
    }

    // Validate files before upload
    const validationPromises = uris.map(uri => validateFile(uri));
    const validationResults = await Promise.all(validationPromises);
    
    const invalidFiles = validationResults.filter(result => !result.valid);
    if (invalidFiles.length > 0) {
      Alert.alert(
        'Invalid Files',
        invalidFiles.map(result => result.error).join('\n')
      );
      return;
    }

    setShowPicker(false);
    await uploadFiles(uris);
  };

  const uploadFiles = async (uris: string[]) => {
    setUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    try {
      const results = await uploadMultipleFiles(uris, 'repair-media', {
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      const newFiles = [...selectedFiles, ...results.map(result => result.url)];
      setSelectedFiles(newFiles);
      onUploadComplete(results);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const renderFileItem = (uri: string, index: number) => {
    const isImage = uri.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    return (
      <View key={index} style={styles.fileItem}>
        {isImage ? (
          <Image source={{ uri }} style={styles.fileImage} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>📹</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFile(index)}
          disabled={uploading}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUploadButton = () => {
    if (uploading) {
      return (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.uploadingText}>
            Uploading... {uploadProgress}%
          </Text>
        </View>
      );
    }

    if (selectedFiles.length >= maxFiles) {
      return (
        <View style={styles.maxFilesContainer}>
          <Text style={styles.maxFilesText}>
            Maximum {maxFiles} files reached
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
        onPress={() => setShowPicker(true)}
        disabled={disabled}
      >
        <Text style={styles.uploadButtonText}>+ Add Photos/Videos</Text>
        <Text style={styles.uploadButtonSubtext}>
          {selectedFiles.length}/{maxFiles} files
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* File Grid */}
      {selectedFiles.length > 0 && (
        <View style={styles.filesGrid}>
          {selectedFiles.map((uri, index) => renderFileItem(uri, index))}
        </View>
      )}

      {/* Upload Button */}
      {renderUploadButton()}

      {/* Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Photos/Videos</Text>
            
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={pickFromCamera}
            >
              <Text style={styles.pickerOptionText}>📷 Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={pickFromGallery}
            >
              <Text style={styles.pickerOptionText}>🖼️ Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  fileItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  fileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 24,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    color: '#6c757d',
    fontSize: 12,
  },
  uploadingContainer: {
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadingText: {
    color: '#3498db',
    fontSize: 14,
    marginTop: 8,
  },
  maxFilesContainer: {
    borderWidth: 1,
    borderColor: '#6c757d',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  maxFilesText: {
    color: '#6c757d',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  pickerOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


