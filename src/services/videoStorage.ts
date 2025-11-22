import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { storage } from '../config/firebase';

/**
 * Generates a thumbnail for a video
 * @param videoUri - Local URI of the video
 * @returns URI of the generated thumbnail
 */
export async function generateThumbnail(videoUri: string): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // Get thumbnail at 1 second
      quality: 0.8,
    });
    return uri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate video thumbnail');
  }
}

/**
 * Uploads a video and its thumbnail to Firebase Storage
 * @param videoUri - Local URI of the video
 * @param thumbnailUri - Local URI of the thumbnail
 * @param userId - ID of the user uploading the video
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Object containing video URL and thumbnail URL
 */
export async function uploadVideo(
  videoUri: string,
  thumbnailUri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  try {
    const timestamp = Date.now();
    const videoFileName = `videos/${userId}/${timestamp}.mp4`;
    const thumbnailFileName = `thumbnails/${userId}/${timestamp}.jpg`;

    // Upload thumbnail first (smaller file)
    if (onProgress) onProgress(10);
    
    const thumbnailBlob = await fetch(thumbnailUri).then(r => r.blob());
    const thumbnailRef = ref(storage, thumbnailFileName);
    await uploadBytes(thumbnailRef, thumbnailBlob);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    if (onProgress) onProgress(30);

    // Upload video
    const videoBlob = await fetch(videoUri).then(r => r.blob());
    const videoRef = ref(storage, videoFileName);
    
    // Note: Firebase Storage uploadBytes doesn't provide progress events
    // For a production app, you'd want to use uploadBytesResumable
    // and listen to state_changed events
    
    if (onProgress) onProgress(50);
    await uploadBytes(videoRef, videoBlob);
    
    if (onProgress) onProgress(90);
    const videoUrl = await getDownloadURL(videoRef);
    
    if (onProgress) onProgress(100);

    return {
      videoUrl,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}

/**
 * Enhanced video upload with real-time progress tracking
 * Uses uploadBytesResumable for better progress reporting
 */
export async function uploadVideoWithProgress(
  videoUri: string,
  thumbnailUri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  try {
    const { uploadBytesResumable } = await import('firebase/storage');
    
    const timestamp = Date.now();
    const videoFileName = `videos/${userId}/${timestamp}.mp4`;
    const thumbnailFileName = `thumbnails/${userId}/${timestamp}.jpg`;

    // Upload thumbnail first
    if (onProgress) onProgress(5);
    
    const thumbnailBlob = await fetch(thumbnailUri).then(r => r.blob());
    const thumbnailRef = ref(storage, thumbnailFileName);
    await uploadBytes(thumbnailRef, thumbnailBlob);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    if (onProgress) onProgress(15);

    // Upload video with progress tracking
    const videoBlob = await fetch(videoUri).then(r => r.blob());
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
        },
        (error) => {
          console.error('Error uploading video:', error);
          reject(new Error('Failed to upload video'));
        },
        async () => {
          try {
            const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            
            resolve({
              videoUrl,
              thumbnailUrl,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}

/**
 * Validates video file before upload
 * @param videoUri - Local URI of the video
 * @param maxSizeMB - Maximum allowed size in MB (default: 100)
 * @returns Validation result with file info
 */
export async function validateVideo(
  videoUri: string,
  maxSizeMB: number = 100
): Promise<{ valid: boolean; sizeMB: number; error?: string }> {
  try {
    const response = await fetch(videoUri);
    const blob = await response.blob();
    const sizeMB = blob.size / (1024 * 1024);

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
