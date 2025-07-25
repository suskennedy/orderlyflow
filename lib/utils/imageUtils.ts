import { storageService } from '../services/StorageService';

export const getHomeImageUrl = (homeId: string, imageUrl?: string | null, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  // If we have a stored image URL, use it
  if (imageUrl) {
    return imageUrl;
  }

  // Otherwise, use a fallback Unsplash image
  const sizes = {
    small: '150x150',
    medium: '400x300',
    large: '800x600'
  };

  return `https://source.unsplash.com/random/${sizes[size]}/?house&sig=${homeId}`;
};

export const uploadHomeImage = async (imageUri: string, homeId: string): Promise<string | null> => {
  try {
    const result = await storageService.uploadHomeImage(imageUri, homeId);
    return result.success ? result.url || null : null;
  } catch (error) {
    console.error('Error uploading home image:', error);
    return null;
  }
};

export const deleteHomeImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `homes/${fileName}`;
    
    return await storageService.deleteHomeImage(filePath);
  } catch (error) {
    console.error('Error deleting home image:', error);
    return false;
  }
}; 