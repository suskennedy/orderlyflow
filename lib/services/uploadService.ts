import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: 'image' | 'video';
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];

/**
 * Validates file type and size
 */
export const validateFile = async (uri: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      return { valid: false, error: 'File does not exist' };
    }

    if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` };
    }

    // Get MIME type from file extension
    const extension = uri.split('.').pop()?.toLowerCase();
    const mimeType = getMimeTypeFromExtension(extension || '');
    
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType) && !ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return { valid: false, error: 'File type not supported. Use images (JPG, PNG, GIF, WebP) or videos (MP4, MOV, AVI)' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate file' };
  }
};

/**
 * Gets MIME type from file extension
 */
const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/avi',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Determines if file is an image or video
 */
export const getFileType = (uri: string): 'image' | 'video' => {
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return imageExtensions.includes(extension) ? 'image' : 'video';
};

/**
 * Generates unique filename with timestamp and random string
 */
export const generateUniqueFileName = (originalUri: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalUri.split('.').pop()?.toLowerCase() || '';
  return `${userId}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Compresses image file
 */
export const compressImage = async (
  uri: string, 
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> => {
  try {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;
    
    // For now, return original URI as compression would require additional libraries
    // In production, you might want to use expo-image-manipulator for compression
    return uri;
  } catch (error) {
    console.error('Image compression failed:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Uploads file to Supabase Storage
 */
export const uploadFileToSupabase = async (
  uri: string,
  bucketName: string = 'repair-media',
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Validate file first
    const validation = await validateFile(uri);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(uri, 'user'); // You might want to pass actual userId
    const fileType = getFileType(uri);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: data.path,
      size: fileInfo.size || 0,
      type: fileType,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Uploads multiple files with progress tracking
 */
export const uploadMultipleFiles = async (
  uris: string[],
  bucketName: string = 'repair-media',
  options: UploadOptions = {}
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  const errors: string[] = [];

  // Validate total size
  let totalSize = 0;
  for (const uri of uris) {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    totalSize += fileInfo.size || 0;
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error(`Total file size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024)}MB limit`);
  }

  // Upload files sequentially to avoid overwhelming the server
  for (let i = 0; i < uris.length; i++) {
    try {
      const result = await uploadFileToSupabase(uris[i], bucketName, options);
      results.push(result);
      
      // Report progress
      if (options.onProgress) {
        options.onProgress({
          loaded: i + 1,
          total: uris.length,
          percentage: Math.round(((i + 1) / uris.length) * 100),
        });
      }
    } catch (error) {
      const errorMessage = `Failed to upload file ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(errorMessage);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed: ${errors.join(', ')}`);
  }

  return results;
};

/**
 * Deletes file from Supabase Storage
 */
export const deleteFileFromSupabase = async (
  path: string,
  bucketName: string = 'repair-media'
): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

/**
 * Deletes multiple files from Supabase Storage
 */
export const deleteMultipleFiles = async (
  paths: string[],
  bucketName: string = 'repair-media'
): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove(paths);

    if (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    throw error;
  }
};

/**
 * Gets file info from Supabase Storage
 */
export const getFileInfo = async (
  path: string,
  bucketName: string = 'repair-media'
): Promise<{ size: number; lastModified: string } | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data[0];
    return {
      size: file.metadata?.size || 0,
      lastModified: file.updated_at || file.created_at || '',
    };
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
};


