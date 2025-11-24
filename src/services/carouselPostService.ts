import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CarouselPost {
  id?: string;
  type: 'carousel';
  images: string[]; // Array of image URLs
  musicUrl?: string; // Optional background music URL
  musicTitle?: string; // Optional music title for display
  content?: string; // Optional caption
  userId: string;
  username: string;
  userAvatar?: string;
  timestamp: Timestamp | any;
  likes: number;
  comments: number;
  shares: number;
  coverImageIndex: number; // Index of the cover image (usually 0)
}

/**
 * Create a new carousel post in Firestore
 * Returns the post ID
 */
export const createCarouselPost = async (
  userId: string,
  username: string,
  images: string[],
  musicUrl?: string,
  musicTitle?: string,
  caption?: string,
  userAvatar?: string
): Promise<string> => {
  try {
    const postData: any = {
        type: 'carousel',
        images,
        userId,
        username,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        coverImageIndex: 0, // First image is always cover
      };
  
      // Only add optional fields if they have values
      if (musicUrl) postData.musicUrl = musicUrl;
      if (musicTitle) postData.musicTitle = musicTitle;
      if (caption?.trim()) postData.content = caption.trim();
      if (userAvatar) postData.userAvatar = userAvatar;

    const docRef = await addDoc(
      collection(db, 'artifacts/fluxx-app-2025/public/data/posts'),
      postData
    );

    console.log('Carousel post created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating carousel post:', error);
    throw error;
  }
};

/**
 * Update carousel post with image URLs after upload
 * Used when creating post placeholder before upload completes
 */
export const updateCarouselPostImages = async (
  postId: string,
  imageUrls: string[]
): Promise<void> => {
  try {
    const postRef = doc(db, 'artifacts/fluxx-app-2025/public/data/posts', postId);
    await updateDoc(postRef, {
      images: imageUrls,
    });
    console.log('Carousel post images updated:', postId);
  } catch (error) {
    console.error('Error updating carousel post images:', error);
    throw error;
  }
};

/**
 * Update carousel post music URL
 */
export const updateCarouselPostMusic = async (
  postId: string,
  musicUrl: string,
  musicTitle?: string
): Promise<void> => {
  try {
    const postRef = doc(db, 'artifacts/fluxx-app-2025/public/data/posts', postId);
    await updateDoc(postRef, {
      musicUrl,
      musicTitle: musicTitle || undefined,
    });
    console.log('Carousel post music updated:', postId);
  } catch (error) {
    console.error('Error updating carousel post music:', error);
    throw error;
  }
};

/**
 * Get all carousel posts (for testing/debugging)
 */
export const getCarouselPosts = async (): Promise<CarouselPost[]> => {
  try {
    const { query, where, getDocs } = await import('firebase/firestore');
    
    const postsRef = collection(db, 'artifacts/fluxx-app-2025/public/data/posts');
    const q = query(postsRef, where('type', '==', 'carousel'));
    const querySnapshot = await getDocs(q);

    const posts: CarouselPost[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() } as CarouselPost);
    });

    return posts;
  } catch (error) {
    console.error('Error getting carousel posts:', error);
    throw error;
  }
};

/**
 * Validate carousel post data before creation
 */
export const validateCarouselPost = (
  images: string[],
  caption?: string
): { valid: boolean; error?: string } => {
  // Must have at least 1 image
  if (!images || images.length === 0) {
    return { valid: false, error: 'At least one image is required' };
  }

  // Maximum 10 images (Instagram-like limit)
  if (images.length > 10) {
    return { valid: false, error: 'Maximum 10 images allowed' };
  }

  // Caption length limit (500 characters)
  if (caption && caption.length > 500) {
    return { valid: false, error: 'Caption must be 500 characters or less' };
  }

  return { valid: true };
};

/**
 * Calculate estimated upload time based on image count
 */
export const estimateUploadTime = (imageCount: number): string => {
  // Rough estimate: 3 seconds per image (compression + upload)
  const seconds = imageCount * 3;
  
  if (seconds < 60) {
    return `~${seconds} seconds`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
};
