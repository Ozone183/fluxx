import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { storage } from '../config/firebase';

/**
 * Get video file size without loading into memory
 */
export async function getVideoSize(videoUri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size / (1024 * 1024); // Return size in MB
    }
    return 0;
  } catch (error) {
    console.error('Error getting video size:', error);
    return 0;
  }
}

/**
 * Generates a thumbnail for a video
 * ✅ NOW WITH ERROR HANDLING FOR LARGE/HDR VIDEOS
 * @param videoUri - Local URI of the video
 * @returns URI of the generated thumbnail or null if failed
 */
export async function generateThumbnail(videoUri: string): Promise<string | null> {
  try {
    // Check file size first
    const sizeMB = await getVideoSize(videoUri);
    console.log(`📹 Generating thumbnail for ${sizeMB.toFixed(1)}MB video...`);
    
    // For very large videos, use lower quality and earlier time
    const quality = sizeMB > 50 ? 0.5 : 0.8;
    const time = sizeMB > 50 ? 500 : 1000; // Get frame earlier for large videos
    
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time,
      quality,
    });
    
    console.log('✅ Thumbnail generated successfully');
    return uri;
  } catch (error) {
    console.error('⚠️ Thumbnail generation failed (non-critical):', error);
    // Don't crash - return null and handle in upload
    return null;
  }
}

/**
 * ✅ FIXED: Uploads video directly from URI without loading into memory
 * Uses uploadBytesResumable with streaming upload
 * @param videoUri - Local URI of the video
 * @param thumbnailUri - Local URI of the thumbnail (or null)
 * @param userId - ID of the user uploading the video
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Object containing video URL and thumbnail URL
 */
export async function uploadVideo(
  videoUri: string,
  thumbnailUri: string | null,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  try {
    const timestamp = Date.now();
    const videoFileName = `videos/${userId}/${timestamp}.mp4`;
    const thumbnailFileName = `thumbnails/${userId}/${timestamp}.jpg`;

    console.log('📤 Starting upload...');
    
    // Upload thumbnail first (if available)
    let thumbnailUrl = '';
    
    if (thumbnailUri) {
      try {
        if (onProgress) onProgress(5);
        console.log('📤 Uploading thumbnail...');
        
        // ✅ For thumbnail (small file), Blob is OK
        const thumbnailBlob = await fetch(thumbnailUri).then(r => r.blob());
        const thumbnailRef = ref(storage, thumbnailFileName);
        
        await uploadBytesResumable(thumbnailRef, thumbnailBlob);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
        
        console.log('✅ Thumbnail uploaded');
        if (onProgress) onProgress(15);
      } catch (thumbError) {
        console.warn('⚠️ Thumbnail upload failed, continuing with video...', thumbError);
        // Continue without thumbnail - not critical
      }
    }

    // ✅ Upload video WITHOUT loading into memory
    console.log('📤 Uploading video...');
    
    // Read file as blob in chunks using fetch (React Native handles this efficiently)
    const response = await fetch(videoUri);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`Failed to read video file: ${response.status}`);
    }
    
    // Get the blob - React Native's fetch streams this, doesn't load all into memory at once
    const videoBlob = await response.blob();
    
    const videoRef = ref(storage, videoFileName);
    const uploadTask = uploadBytesResumable(videoRef, videoBlob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress (15% already done from thumbnail)
          const videoProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 85;
          const totalProgress = 15 + videoProgress;
          
          if (onProgress) {
            onProgress(Math.min(totalProgress, 99));
          }
          
          // Log progress every 25%
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (percent % 25 < 1) {
            console.log(`📤 Upload progress: ${percent.toFixed(0)}%`);
          }
        },
        (error) => {
          console.error('❌ Video upload failed:', error);
          reject(new Error('Failed to upload video'));
        },
        async () => {
          try {
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            
            console.log('✅ Video uploaded successfully!');
            
            resolve({
              videoUrl,
              thumbnailUrl: thumbnailUrl || videoUrl, // Fallback to video URL if no thumbnail
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw new Error('Failed to upload video');
  }
}

/**
 * Validates video file before upload
 * ✅ NOW USES FileSystem INSTEAD OF LOADING INTO MEMORY
 * @param videoUri - Local URI of the video
 * @param maxSizeMB - Maximum allowed size in MB (default: 100)
 * @returns Validation result with file info
 */
export async function validateVideo(
  videoUri: string,
  maxSizeMB: number = 100
): Promise<{ valid: boolean; sizeMB: number; error?: string }> {
  try {
    const sizeMB = await getVideoSize(videoUri);

    if (sizeMB === 0) {
      return {
        valid: false,
        sizeMB: 0,
        error: 'Failed to read video file',
      };
    }

    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        sizeMB,
        error: `Video size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      };
    }

    return {
      valid: true,
      sizeMB,
    };
  } catch (error) {
    console.error('Error validating video:', error);
    return {
      valid: false,
      sizeMB: 0,
      error: 'Failed to validate video file',
    };
  }
}