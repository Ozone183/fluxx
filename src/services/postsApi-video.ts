import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { firestore, storage } from '../config/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { APP_ID } from '../context/AuthContext';

export interface VideoPostData {
  userId: string;
  username: string;
  userAvatar: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
}

/**
 * Creates a new video post in Firestore
 * @param postData - Video post data
 * @returns Created post ID
 */
export async function createVideoPost(postData: VideoPostData): Promise<string> {
  try {
    // Use the correct Firestore path matching Fluxx structure
    const postsCollection = collection(firestore, `artifacts/${APP_ID}/public/data/posts`);

    const post = {
      ...postData,
      content: postData.caption,  // ✅ ADD THIS - PostCard displays "content" field, not "caption"
      type: 'video',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      likedBy: [],
      commentsCount: 0,  // ✅ ADD THIS - PostCard expects "commentsCount", not "comments"
      tags: [],
    };

    const docRef = await addDoc(postsCollection, post);
    return docRef.id;
  } catch (error) {
    console.error('Error creating video post:', error);
    throw new Error('Failed to create video post');
  }
}

/**
 * Increments view count for a video post
 * @param postId - ID of the post
 */
export async function incrementVideoViews(postId: string): Promise<void> {
  try {
    const postRef = doc(firestore, `artifacts/${APP_ID}/public/data/posts`, postId);
    await updateDoc(postRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing video views:', error);
  }
}

/**
 * Updates video post engagement metrics
 * @param postId - ID of the post
 * @param metrics - Metrics to update (likes, comments, shares)
 */
export async function updateVideoPostMetrics(
  postId: string,
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
  }
): Promise<void> {
  try {
    const postRef = doc(firestore, `artifacts/${APP_ID}/public/data/posts`, postId);
    const updates: any = {};

    if (metrics.likes !== undefined) {
      updates.likes = increment(metrics.likes);
    }
    if (metrics.comments !== undefined) {
      updates.comments = increment(metrics.comments);
    }
    if (metrics.shares !== undefined) {
      updates.shares = increment(metrics.shares);
    }

    await updateDoc(postRef, updates);
  } catch (error) {
    console.error('Error updating video post metrics:', error);
  }
}

/**
 * Adds a user to the likedBy array for a video post
 * @param postId - ID of the post
 * @param userId - ID of the user
 */
export async function toggleVideoPostLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  try {
    const postRef = doc(firestore, `artifacts/${APP_ID}/public/data/posts`, postId);
    
    if (currentlyLiked) {
      // Unlike: remove user from likedBy array and decrement likes
      const { arrayRemove } = await import('firebase/firestore');
      await updateDoc(postRef, {
        likedBy: arrayRemove(userId),
        likes: increment(-1),
      });
    } else {
      // Like: add user to likedBy array and increment likes
      const { arrayUnion } = await import('firebase/firestore');
      await updateDoc(postRef, {
        likedBy: arrayUnion(userId),
        likes: increment(1),
      });
    }
  } catch (error) {
    console.error('Error toggling video post like:', error);
    throw error;
  }
}

/**
 * Batch operation: Create multiple video posts
 * Useful for importing or bulk uploading
 */
export async function createMultipleVideoPosts(
  posts: VideoPostData[]
): Promise<string[]> {
  try {
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    const postIds: string[] = [];
    
    const postsCollection = collection(firestore, `artifacts/${APP_ID}/public/data/posts`);

    for (const postData of posts) {
      const postRef = doc(postsCollection);
      const post = {
        ...postData,
        type: 'video',
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        likedBy: [],
        tags: [],
      };
      
      batch.set(postRef, post);
      postIds.push(postRef.id);
    }

    await batch.commit();
    return postIds;
  } catch (error) {
    console.error('Error creating multiple video posts:', error);
    throw new Error('Failed to create multiple video posts');
  }
}

export const deletePost = async (postId: string, videoUrl?: string, thumbnailUrl?: string, imageUrl?: string) => {
  try {
    // Delete from Firestore
    const postRef = doc(firestore, `artifacts/${APP_ID}/public/data/posts/${postId}`);
    await deleteDoc(postRef);
    console.log('✅ Post deleted from Firestore:', postId);

    // Delete video from Storage if exists
    if (videoUrl) {
      try {
        const videoRef = ref(storage, videoUrl);
        await deleteObject(videoRef);
        console.log('✅ Video deleted from Storage');
      } catch (error) {
        console.warn('⚠️ Video file not found or already deleted:', error);
      }
    }

    // Delete thumbnail from Storage if exists
    if (thumbnailUrl) {
      try {
        const thumbnailRef = ref(storage, thumbnailUrl);
        await deleteObject(thumbnailRef);
        console.log('✅ Thumbnail deleted from Storage');
      } catch (error) {
        console.warn('⚠️ Thumbnail file not found or already deleted:', error);
      }
    }

    // Delete image from Storage if exists
    if (imageUrl) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        console.log('✅ Image deleted from Storage');
      } catch (error) {
        console.warn('⚠️ Image file not found or already deleted:', error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    throw error;
  }
};