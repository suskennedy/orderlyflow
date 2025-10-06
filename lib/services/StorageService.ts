import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class StorageService {
  private bucketName = 'profiles';
  private homesFolder = 'homes';

  async uploadHomeImage(file: string, homeId: string, fileName?: string): Promise<UploadResult> {
    try {
      console.log('StorageService: Starting upload for homeId:', homeId);
      console.log('StorageService: File URI:', file);

      // Generate a unique filename if not provided
      const uniqueFileName = fileName || `home_${homeId}_${Date.now()}.jpg`;
      const filePath = `${this.homesFolder}/${uniqueFileName}`;

      let uploadData: any;

      if (typeof file === 'string') {
        // Handle different file types for React Native
        if (file.startsWith('data:')) {
          // Base64 data - convert to ArrayBuffer for React Native
          console.log('StorageService: Processing base64 data');
          const base64Data = file.split(',')[1];
          
          if (Platform.OS === 'web') {
            // For web, use Buffer
            const buffer = Buffer.from(base64Data, 'base64');
            uploadData = buffer;
          } else {
            // For React Native, decode base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            uploadData = bytes;
          }
        } else if (file.startsWith('http')) {
          // URL - fetch the image first
          console.log('StorageService: Fetching image from URL');
          try {
            const response = await fetch(file);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (Platform.OS === 'web') {
              uploadData = await response.blob();
            } else {
              // For React Native, get ArrayBuffer
              uploadData = await response.arrayBuffer();
            }
          } catch (fetchError) {
            console.error('StorageService: Error fetching image:', fetchError);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
            return { success: false, error: `Failed to fetch image: ${errorMessage}` };
          }
        } else {
          // Local file URI (React Native)
          console.log('StorageService: Processing local file URI');
          try {
            if (Platform.OS !== 'web') {
              // Use Expo FileSystem to read the file
              const fileInfo = await FileSystem.getInfoAsync(file);
              if (!fileInfo.exists) {
                throw new Error('File does not exist');
              }
              
              // Read file as base64 and convert to binary
              const base64 = await FileSystem.readAsStringAsync(file, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              uploadData = bytes;
            } else {
              // For web, fetch the file
              const response = await fetch(file);
              uploadData = await response.blob();
            }
          } catch (fileError) {
            console.error('StorageService: Error reading local file:', fileError);
            const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown file error';
            return { success: false, error: `Failed to read file: ${errorMessage}` };
          }
        }
      } else {
        // File object (web only)
        uploadData = file;
      }

      console.log('StorageService: Uploading to path:', filePath);
      console.log('StorageService: Upload data type:', typeof uploadData);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, uploadData, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.error('StorageService: Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      console.log('StorageService: Upload successful, getting public URL');

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('StorageService: Public URL:', urlData.publicUrl);
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('StorageService: Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Upload failed: ${errorMessage}` };
    }
  }

  async deleteHomeImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  getHomeImageUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  async listHomeImages(homeId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(this.homesFolder, {
          search: `home_${homeId}_`
        });

      if (error) {
        console.error('List error:', error);
        return [];
      }

      return data.map(item => item.name);
    } catch (error) {
      console.error('List service error:', error);
      return [];
    }
  }
}

export const storageService = new StorageService(); 