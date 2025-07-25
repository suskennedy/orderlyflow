import { supabase } from '../supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class StorageService {
  private bucketName = 'profiles';
  private homesFolder = 'homes';

  async uploadHomeImage(file: File | string, homeId: string, fileName?: string): Promise<UploadResult> {
    try {
      // Generate a unique filename if not provided
      const uniqueFileName = fileName || `home_${homeId}_${Date.now()}.jpg`;
      const filePath = `${this.homesFolder}/${uniqueFileName}`;

      let uploadData: any;

      if (typeof file === 'string') {
        // Handle base64 or URL
        if (file.startsWith('data:')) {
          // Base64 data
          const base64Data = file.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          uploadData = buffer;
        } else {
          // URL - fetch the image first
          const response = await fetch(file);
          const blob = await response.blob();
          uploadData = blob;
        }
      } else {
        // File object
        uploadData = file;
      }

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, uploadData, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Storage service error:', error);
      return { success: false, error: 'Failed to upload image' };
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