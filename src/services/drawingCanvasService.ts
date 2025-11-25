// src/services/drawingCanvasService.ts
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';

export interface DrawingCanvas {
  id?: string;
  title: string;
  description?: string;
  imageUrl: string; // The captured drawing image
  storagePath: string; // Firebase Storage path
  templateName: string; // Template used
  creatorId: string;
  creatorUsername: string;
  creatorProfilePic?: string;
  accessType: 'public' | 'private';
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  expiresAt: number; // 24 hours from creation
  viewCount: number;
  likeCount: number;
  likedBy: string[];
  layers: any[]; // Drawing has no layers, empty array
  collaborators: { [userId: string]: any };
  maxCollaborators: number;
  totalPages: number;
  type: 'drawing'; // Mark as drawing canvas
}

/**
 * Create a new drawing canvas in Firestore
 * Saves to canvases collection (same as Photo Canvas)
 */
export const createDrawingCanvas = async (
  userId: string,
  username: string,
  imageUrl: string,
  storagePath: string,
  templateName: string,
  userProfilePic?: string
): Promise<string> => {
  try {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    const canvasData: any = {
      title: templateName, // Use template name as title
      description: `Drawing created with ${templateName}`,
      imageUrl,
      storagePath,
      templateName,
      creatorId: userId,
      creatorUsername: username,
      creatorProfilePic: userProfilePic || null,
      accessType: 'public',
      isExpired: false,  // ← ADD THIS LINE
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt,
      viewCount: 0,
      likeCount: 0,
      likedBy: [],
      layers: [], // No layers for drawings
      collaborators: {
        [userId]: {
          userId,
          username,
          profilePicUrl: userProfilePic || null,
          joinedAt: now,
          isActive: true,
          lastSeen: now,
        }
      },
      maxCollaborators: 1, // Only creator
      totalPages: 1,
      type: 'drawing', // Mark as drawing type
    };

    // Save to canvases collection (same as Photo Canvas)
    const docRef = await addDoc(
      collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases'),
      canvasData
    );

    console.log('✅ Drawing canvas created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating drawing canvas:', error);
    throw error;
  }
};

/**
 * Get user profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
