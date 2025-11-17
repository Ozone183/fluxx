// src/utils/commentsApi.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  Query,
  DocumentData
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';
import { CanvasComment, ReactionType } from '../types/canvas';

// Add Comment
export const addComment = async (
  canvasId: string,
  userId: string,
  username: string,
  userProfilePic: string | null,
  text: string,
  parentCommentId: string | null = null
): Promise<void> => {
  try {
    const commentsRef = collection(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'canvases',
      canvasId,
      'comments'
    );

    const newComment: Omit<CanvasComment, 'id'> = {
      canvasId,
      text: text.trim(),
      userId,
      username,
      userProfilePic,
      parentCommentId,
      replyCount: 0,
      reactions: {
        heart: [],
        fire: [],
        laugh: [],
        clap: [],
        heart_eyes: [],
        sparkles: [],
      },
      reactionCounts: {
        heart: 0,
        fire: 0,
        laugh: 0,
        clap: 0,
        heart_eyes: 0,
        sparkles: 0,
      },
      createdAt: Date.now(),
      updatedAt: null,
      isEdited: false,
      isDeleted: false,
      isReported: false,
      reportCount: 0,
    };

    await addDoc(commentsRef, newComment);

    // Increment canvas comment count
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
    await updateDoc(canvasRef, {
      commentCount: increment(1),
    });

    // If reply, increment parent comment reply count
    if (parentCommentId) {
      const parentCommentRef = doc(
        firestore,
        'artifacts',
        APP_ID,
        'public',
        'data',
        'canvases',
        canvasId,
        'comments',
        parentCommentId
      );
      await updateDoc(parentCommentRef, {
        replyCount: increment(1),
      });
    }

    // Create notification (import from notifications.ts)
    const canvasDoc = await getDoc(canvasRef);
    if (canvasDoc.exists()) {
      const canvasData = canvasDoc.data();
      if (canvasData.creatorId !== userId) {
        const { createNotification } = await import('./notifications');
        await createNotification({
          recipientUserId: canvasData.creatorId,
          type: parentCommentId ? 'reply' : 'comment',
          fromUserId: userId,
          fromUsername: username,
          fromProfilePic: userProfilePic,
          relatedCanvasId: canvasId,
          relatedCanvasTitle: canvasData.title,
          commentText: text.substring(0, 50),
        });
      }
    }

    console.log('✅ Comment added');
  } catch (error) {
    console.error('❌ Add comment error:', error);
    throw error;
  }
};

// Delete Comment (Soft Delete)
export const deleteComment = async (
  canvasId: string,
  commentId: string
): Promise<void> => {
  try {
    const commentRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'canvases',
      canvasId,
      'comments',
      commentId
    );

    await updateDoc(commentRef, {
      isDeleted: true,
      text: '[Deleted]',
    });

    // Decrement canvas comment count
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
    await updateDoc(canvasRef, {
      commentCount: increment(-1),
    });

    console.log('✅ Comment deleted');
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    throw error;
  }
};

// Toggle Canvas Reaction
export const toggleCanvasReaction = async (
  canvasId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> => {
  try {
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
    const canvasDoc = await getDoc(canvasRef);

    if (!canvasDoc.exists()) return;

    const canvasData = canvasDoc.data();
    const reactionField = `reactions.${reactionType}`;
    const currentReactions = canvasData.reactions?.[reactionType] || [];
    const hasReacted = currentReactions.includes(userId);

    if (hasReacted) {
      // Remove reaction
      await updateDoc(canvasRef, {
        [reactionField]: arrayRemove(userId),
        [`reactionCounts.${reactionType}`]: increment(-1),
      });
    } else {
      // Add reaction
      await updateDoc(canvasRef, {
        [reactionField]: arrayUnion(userId),
        [`reactionCounts.${reactionType}`]: increment(1),
      });
    }

    console.log(`✅ Reaction ${hasReacted ? 'removed' : 'added'}:`, reactionType);
  } catch (error) {
    console.error('❌ Toggle reaction error:', error);
    throw error;
  }
};

// Toggle Comment Reaction
export const toggleCommentReaction = async (
  canvasId: string,
  commentId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> => {
  try {
    const commentRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'canvases',
      canvasId,
      'comments',
      commentId
    );

    const commentDoc = await getDoc(commentRef);
    if (!commentDoc.exists()) return;

    const commentData = commentDoc.data();
    const currentReactions = commentData.reactions?.[reactionType] || [];
    const hasReacted = currentReactions.includes(userId);

    const reactionField = `reactions.${reactionType}`;

    if (hasReacted) {
      // Remove reaction
      await updateDoc(commentRef, {
        [reactionField]: arrayRemove(userId),
        [`reactionCounts.${reactionType}`]: increment(-1),
      });
    } else {
      // Add reaction
      await updateDoc(commentRef, {
        [reactionField]: arrayUnion(userId),
        [`reactionCounts.${reactionType}`]: increment(1),
      });
    }

    console.log(`✅ Comment reaction ${hasReacted ? 'removed' : 'added'}:`, reactionType);
  } catch (error) {
    console.error('❌ Toggle comment reaction error:', error);
    throw error;
  }
};

// Fetch Comments (Paginated)
export const fetchCommentsQuery = (
  canvasId: string,
  sortBy: 'newest' | 'oldest' | 'popular' = 'newest',
  limitCount: number = 20
): Query<DocumentData> => {
  const commentsRef = collection(
    firestore,
    'artifacts',
    APP_ID,
    'public',
    'data',
    'canvases',
    canvasId,
    'comments'
  );

  let q = query(
    commentsRef,
    where('parentCommentId', '==', null), // Only top-level comments
    where('isDeleted', '==', false)
  );

  if (sortBy === 'newest') {
    q = query(q, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
  } else if (sortBy === 'oldest') {
    q = query(q, orderBy('createdAt', 'asc'), firestoreLimit(limitCount));
  } else if (sortBy === 'popular') {
    // Sort by total reactions (we'll calculate this client-side)
    q = query(q, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
  }

  return q;
};

// Fetch Replies for a Comment
export const fetchRepliesQuery = (
  canvasId: string,
  parentCommentId: string
): Query<DocumentData> => {
  const commentsRef = collection(
    firestore,
    'artifacts',
    APP_ID,
    'public',
    'data',
    'canvases',
    canvasId,
    'comments'
  );

  return query(
    commentsRef,
    where('parentCommentId', '==', parentCommentId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc')
  );
};
