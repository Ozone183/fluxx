// src/services/drawingStorage.ts
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../config/firebase';

export interface UploadResult {
  imageUrl: string;
  storagePath: string;
}

/**
 * Convert local file URI to Blob using XMLHttpRequest
 * This is required for React Native compatibility with Firebase Storage
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.onload = function () {
      resolve(xhr.response);
    };
    
    xhr.onerror = function () {
      reject(new TypeError('Network request failed'));
    };
    
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const uploadDrawingImage = async (
  imageUri: string,
  userId: string
): Promise<UploadResult> => {
  try {
    console.log('🎨 Starting drawing upload...');
    console.log('📁 Image URI:', imageUri);
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const timestamp = Date.now();
    const fileName = `drawing_${userId}_${timestamp}.png`;
    const storagePath = `drawings/${userId}/${fileName}`;
    
    console.log('📁 Upload path:', storagePath);

    // Convert URI to Blob using XMLHttpRequest
    console.log('🔄 Converting URI to Blob...');
    const blob = await uriToBlob(imageUri);
    console.log('✅ Blob created, size:', blob.size, 'bytes');

    // Validate size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (blob.size > maxSize) {
      throw new Error(`Image too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
    }

    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload blob to Firebase Storage
    console.log('⬆️ Uploading to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, blob, {
      contentType: 'image/png',
      customMetadata: {
        uploadedBy: userId,
        timestamp: timestamp.toString(),
      },
    });
    
    console.log('✅ Upload complete:', uploadResult.metadata.size, 'bytes');

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('🔗 Download URL obtained');

    return {
      imageUrl: downloadURL,
      storagePath,
    };
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    throw error;
  }
};

export const deleteDrawingImage = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('✅ Drawing deleted:', storagePath);
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
};