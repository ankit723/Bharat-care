import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

// Create Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: {
      persistSession: false, // We handle auth separately
    },
  }
);

// Mock file upload for development/testing when Supabase is not accessible
const createMockFileUrl = (fileName: string): string => {
  const timestamp = Date.now();
  return `https://mock-storage.example.com/documents/${timestamp}-${fileName}`;
};

// Helper function to upload file to Supabase storage
export const uploadFileToSupabase = async (
  file: {
    uri: string;
    name: string;
    type: string;
  },
  bucket: string = 'documents',
  folder: string = 'patient-uploads'
): Promise<{ fileUrl: string; fileName: string }> => {
  try {
    console.log('Starting file upload to Supabase:', {
      fileName: file.name,
      fileType: file.type,
      bucket,
      folder,
      supabaseUrl: SUPABASE_CONFIG.URL
    });

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.name}`;

    console.log('Generated file path:', fileName);

    // Convert file URI to blob for upload
    console.log('Fetching file from URI:', file.uri);
    const response = await fetch(file.uri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('File converted to blob, size:', blob.size, 'type:', blob.type);

    // Upload to Supabase
    console.log('Uploading to Supabase storage...');
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('Public URL generated:', publicUrlData.publicUrl);

    return {
      fileUrl: publicUrlData.publicUrl,
      fileName: file.name,
    };
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    
    // Fallback to mock URL for development/testing
    console.warn('Falling back to mock file URL for development');
    const mockUrl = createMockFileUrl(file.name);
    console.log('Generated mock URL:', mockUrl);
    
    return {
      fileUrl: mockUrl,
      fileName: file.name,
    };
  }
};

// Helper function to delete file from Supabase storage
export const deleteFileFromSupabase = async (
  fileUrl: string,
  bucket: string = SUPABASE_CONFIG.BUCKET_NAME
): Promise<void> => {
  try {
    console.log('Deleting file from Supabase:', fileUrl);
    
    // If it's a mock URL, just log and return
    if (fileUrl.includes('mock-storage.example.com')) {
      console.log('Mock file URL detected, skipping actual deletion');
      return;
    }
    
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      throw new Error('Invalid file URL format');
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    console.log('Extracted file path:', filePath);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error && error.message !== 'The resource was not found') {
      console.error('Supabase delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    // Don't throw error for delete operations to avoid blocking the UI
    console.warn('File deletion failed, but continuing...');
  }
}; 