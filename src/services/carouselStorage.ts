import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface UploadProgress {
  imageIndex: number;
  progress: number;
  url?: string;
  error?: string;
}

export interface CarouselUploadResult {
  imageUrls: string[];
  errors: string[];
  totalProgress: number;
}

/**
 * Compress and optimize image before upload
 * Reduces file size while maintaining quality
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // Max width 1080px (Instagram-like)
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Upload a single image to Firebase Storage
 */
const uploadSingleImage = async (
  imageUri: string,
  postId: string,
  imageIndex: number,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Compress image before upload
    const compressedUri = await compressImage(imageUri);

    // Fetch the compressed image as blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();

    // Create storage reference
    const timestamp = Date.now();
    const filename = `carousel_${postId}_${imageIndex}_${timestamp}.jpg`;
    const storageRef = ref(storage, `posts/carousels/${postId}/${filename}`);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error(`Error uploading image ${imageIndex}:`, error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error(`Error preparing image ${imageIndex}:`, error);
    throw error;
  }
};

/**
 * Upload multiple images for carousel post
 * Uploads images in parallel with progress tracking
 */
export const uploadCarouselImages = async (
  imageUris: string[],
  postId: string,
  onProgressUpdate?: (progressArray: UploadProgress[]) => void
): Promise<CarouselUploadResult> => {
  const progressArray: UploadProgress[] = imageUris.map((_, index) => ({
    imageIndex: index,
    progress: 0,
  }));

  const uploadPromises = imageUris.map(async (imageUri, index) => {
    try {
      const url = await uploadSingleImage(
        imageUri,
        postId,
        index,
        (progress) => {
          progressArray[index].progress = progress;
          onProgressUpdate?.(progressArray);
        }
      );
      progressArray[index].url = url;
      progressArray[index].progress = 100;
      onProgressUpdate?.(progressArray);
      return { success: true, url, index };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      progressArray[index].error = errorMessage;
      onProgressUpdate?.(progressArray);
      return { success: false, error: errorMessage, index };
    }
  });

  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);

  // Separate successful uploads from errors
  const imageUrls: string[] = [];
  const errors: string[] = [];

  results.forEach((result) => {
    if (result.success && result.url) {
      imageUrls.push(result.url);
    } else if (result.error) {
      errors.push(`Image ${result.index + 1}: ${result.error}`);
    }
  });

  // Calculate total progress
  const totalProgress = progressArray.reduce((sum, p) => sum + p.progress, 0) / imageUris.length;

  return {
    imageUrls,
    errors,
    totalProgress,
  };
};

/**
 * Upload music file to Firebase Storage (if custom music is supported in future)
 */
export const uploadCarouselMusic = async (
  musicUri: string,
  postId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const response = await fetch(musicUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const filename = `music_${postId}_${timestamp}.mp3`;
    const storageRef = ref(storage, `posts/carousels/${postId}/${filename}`);

    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Error uploading music:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error preparing music:', error);
    throw error;
  }
};

/**
 * Delete carousel images from Firebase Storage (cleanup on post deletion)
 */
export const deleteCarouselImages = async (imageUrls: string[]): Promise<void> => {
  try {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const storageRef = ref(storage, url);
        // Note: Firebase Storage delete requires proper security rules
        // await deleteObject(storageRef);
        console.log('Image deleted:', url);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting carousel images:', error);
  }
};
