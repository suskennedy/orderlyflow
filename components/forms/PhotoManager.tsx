import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { storageService } from '../../lib/services/StorageService';

interface PhotoManagerProps {
  label: string;
  homeId?: string;
  currentImageUrl?: string;
  onImageUpload?: (imageUrl: string) => void;
  onImageRemove?: () => void;
  latitude?: number;
  longitude?: number;
}

export default function PhotoManager({
  label,
  homeId,
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  latitude,
  longitude,
}: PhotoManagerProps) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!homeId) {
      Alert.alert('Error', 'Home ID is required to upload image');
      return;
    }

    setUploading(true);
    try {
      const result = await storageService.uploadHomeImage(imageUri, homeId);
      
      if (result.success && result.url) {
        onImageUpload?.(result.url);
        setShowModal(false);
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'An error occurred while uploading the image');
    } finally {
      setUploading(false);
    }
  };

  const handleStreetViewSelect = async () => {
    if (!homeId || !latitude || !longitude) {
      Alert.alert('Error', 'Home ID and location are required for Street View');
      return;
    }

    setUploading(true);
    try {
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;
      
      const result = await storageService.uploadHomeImage(streetViewUrl, homeId, `streetview_${homeId}_${Date.now()}.jpg`);
      
      if (result.success && result.url) {
        onImageUpload?.(result.url);
        setShowModal(false);
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload Street View image');
      }
    } catch (error) {
      console.error('Street View upload error:', error);
      Alert.alert('Upload Failed', 'An error occurred while uploading the Street View image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onImageRemove }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      {currentImageUrl ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: currentImageUrl }} style={styles.photo} />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.error }]}
            onPress={handleRemoveImage}
          >
            <Ionicons name="close" size={16} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
            disabled={uploading}
          >
            {uploading ? (
              <Ionicons name="cloud-upload" size={16} color={colors.textInverse} />
            ) : (
              <Ionicons name="camera" size={16} color={colors.textInverse} />
            )}
            <Text style={[styles.changeButtonText, { color: colors.textInverse }]}>
              {uploading ? 'Uploading...' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowModal(true)}
          disabled={uploading}
        >
          {uploading ? (
            <Ionicons name="cloud-upload" size={48} color={colors.primary} />
          ) : (
            <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
          )}
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            {uploading ? 'Uploading Image...' : 'Add Home Photo'}
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Photo Source</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {latitude && longitude && (
                <TouchableOpacity
                  style={[styles.optionButton, { backgroundColor: colors.primaryLight }]}
                  onPress={handleStreetViewSelect}
                  disabled={uploading}
                >
                  <Ionicons name="map" size={24} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>Use Google Street View</Text>
                  <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                    Automatically get a photo from Google Maps
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  handleImagePicker();
                }}
                disabled={uploading}
              >
                <Ionicons name="images" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Choose from Gallery</Text>
                <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                  Select a photo from your device
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  handleCamera();
                }}
                disabled={uploading}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Take a Photo</Text>
                <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                  Use your camera to take a new photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  optionSubtext: {
    fontSize: 12,
    marginLeft: 12,
    marginTop: 2,
  },
}); 