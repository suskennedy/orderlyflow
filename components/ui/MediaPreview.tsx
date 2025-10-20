import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MediaPreviewProps {
  files: string[];
  onRemove?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  maxFiles?: number;
  showRemoveButton?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 items per row with padding

export default function MediaPreview({
  files,
  onRemove,
  onReorder,
  maxFiles = 10,
  showRemoveButton = true,
}: MediaPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const isImage = (uri: string) => {
    return uri.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const isVideo = (uri: string) => {
    return uri.match(/\.(mp4|mov|avi|quicktime)$/i);
  };

  const handlePress = (index: number) => {
    setSelectedIndex(index);
    setShowFullScreen(true);
  };

  const handleRemove = (index: number) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onRemove?.(index)
        },
      ]
    );
  };

  const renderThumbnail = (uri: string, index: number) => {
    const isImageFile = isImage(uri);
    const isVideoFile = isVideo(uri);

    return (
      <View key={index} style={styles.thumbnailContainer}>
        <TouchableOpacity
          style={styles.thumbnail}
          onPress={() => handlePress(index)}
          activeOpacity={0.8}
        >
          {isImageFile ? (
            <Image source={{ uri }} style={styles.thumbnailImage} />
          ) : isVideoFile ? (
            <View style={styles.videoThumbnail}>
              <View style={styles.videoIcon}>
                <Text style={styles.videoIconText}>▶</Text>
              </View>
              <Text style={styles.videoLabel}>Video</Text>
            </View>
          ) : (
            <View style={styles.unknownThumbnail}>
              <Text style={styles.unknownIcon}>📄</Text>
              <Text style={styles.unknownLabel}>File</Text>
            </View>
          )}
        </TouchableOpacity>

        {showRemoveButton && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(index)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        )}

        {/* File number indicator */}
        <View style={styles.fileNumberContainer}>
          <Text style={styles.fileNumber}>{index + 1}</Text>
        </View>
      </View>
    );
  };

  const renderFullScreenModal = () => {
    if (selectedIndex === null) return null;

    const currentFile = files[selectedIndex];
    const isImageFile = isImage(currentFile);

    return (
      <Modal
        visible={showFullScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullScreen(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.fullScreenContainer}
            contentContainerStyle={styles.fullScreenContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            {isImageFile ? (
              <Image
                source={{ uri: currentFile }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.videoContainer}>
                <Text style={styles.videoText}>Video Preview</Text>
                <Text style={styles.videoUrl}>{currentFile}</Text>
                <Text style={styles.videoNote}>
                  Video playback not implemented in preview
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Navigation dots */}
          {files.length > 1 && (
            <View style={styles.dotsContainer}>
              {files.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    index === selectedIndex && styles.activeDot,
                  ]}
                  onPress={() => setSelectedIndex(index)}
                />
              ))}
            </View>
          )}

          {/* File info */}
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileInfoText}>
              File {selectedIndex + 1} of {files.length}
            </Text>
            <Text style={styles.fileInfoSubtext}>
              {isImageFile ? 'Image' : 'Video'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Files</Text>
        <Text style={styles.count}>{files.length} file{files.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {files.map((uri, index) => renderThumbnail(uri, index))}
      </ScrollView>

      {renderFullScreenModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  count: {
    fontSize: 14,
    color: '#6c757d',
  },
  scrollContent: {
    paddingRight: 20,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 8,
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  videoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  unknownThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  unknownIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  unknownLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
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
    zIndex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileNumberContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fileNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
  },
  fullScreenContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: width - 40,
    maxHeight: width - 40,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  videoUrl: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  videoNote: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  fileInfoContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  fileInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fileInfoSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
});


