// src/utils/notifications.ts

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';

export type NotificationType = 'follow' | 'canvas_invite' | 'like' | 'comment' | 'reply' | 'comment_react' | 'mention' | 'access_request' | 'access_approved' | 'access_denied';

interface CreateNotificationParams {
    recipientUserId: string;
    type: NotificationType;
    fromUserId: string;
    fromUsername: string;
    fromProfilePic?: string | null;
    relatedCanvasId?: string;
    relatedCanvasTitle?: string;
    relatedCommentId?: string;  // 🆕 ADD THIS
    commentText?: string;        // 🆕 ADD THIS
}

export const createNotification = async (params: CreateNotificationParams) => {
    const {
        recipientUserId,
        type,
        fromUserId,
        fromUsername,
        fromProfilePic,
        relatedCanvasId,
        relatedCanvasTitle,
        relatedCommentId,     // 🆕 ADD THIS
        commentText,          // 🆕 ADD THIS
    } = params;

    // Don't notify yourself
    if (recipientUserId === fromUserId) {
        console.log('⚠️ Skipping self-notification');
        return;
    }

    // Generate message based on type
    let message = '';
    let actionUrl = '';

    switch (type) {
        case 'follow':
            message = `${fromUsername} started following you`;
            actionUrl = `fluxx://profile/${fromUserId}`;
            break;

        case 'canvas_invite':
            message = `${fromUsername} invited you to "${relatedCanvasTitle}"`;
            actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            break;

        case 'like':
            // Distinguish between canvas and post likes
            // If relatedCanvasTitle exists, it's a canvas, otherwise it's a post
            if (relatedCanvasTitle) {
                message = `${fromUsername} liked your canvas "${relatedCanvasTitle}"`;
                actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            } else {
                message = `${fromUsername} liked your post`;
                actionUrl = `fluxx://feed/${relatedCanvasId}`;
            }
            break;

        case 'comment':
            if (relatedCanvasTitle) {
                message = `${fromUsername} commented on your canvas "${relatedCanvasTitle}"`;
                actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            } else {
                message = `${fromUsername} commented on your post`;
                actionUrl = `fluxx://feed/${relatedCanvasId}`;
            }
            break;

        case 'reply':
            if (relatedCanvasTitle) {
                message = `${fromUsername} replied to your comment: "${commentText}"`;
                actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            } else {
                message = `${fromUsername} replied to your comment`;
                actionUrl = `fluxx://feed/${relatedCanvasId}`;
            }
            break;

        case 'comment_react':  // 🆕 ADD THIS CASE
            message = `${fromUsername} reacted to your comment`;
            actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            break;

        case 'mention':
            if (relatedCanvasTitle) {
                message = `${fromUsername} mentioned you in "${relatedCanvasTitle}"`;
                actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            } else {
                message = `${fromUsername} mentioned you in a comment`;
                actionUrl = `fluxx://feed/${relatedCanvasId}`;
            }
            break;

        case 'access_request':
            message = `${fromUsername} wants access to "${relatedCanvasTitle}"`;
            actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            break;

        case 'access_approved':
            message = `Your request to access "${relatedCanvasTitle}" was approved`;
            actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            break;

        case 'access_denied':
            message = `Your request to access "${relatedCanvasTitle}" was declined`;
            actionUrl = `fluxx://canvas/${relatedCanvasId}`;
            break;

        default:
            message = `${fromUsername} interacted with you`;
            actionUrl = `fluxx://profile/${fromUserId}`;
    }

    try {
        console.log('🔔 Creating notification:', {
            recipientUserId,
            type,
            fromUsername,
            message,
        });

        const notificationsRef = collection(
            firestore,
            'artifacts',
            APP_ID,
            'public',
            'data',
            'notifications',
            recipientUserId,
            'items'
        );

        await addDoc(notificationsRef, {
            type,
            fromUserId,
            fromUsername,
            fromProfilePic: fromProfilePic || null,
            message,
            relatedCanvasId: relatedCanvasId || null,
            relatedCommentId: relatedCommentId || null,  // 🆕 ADD THIS
            commentText: commentText || null,             // 🆕 ADD THIS
            timestamp: serverTimestamp(),
            isRead: false,
            actionUrl,
        });

        console.log('✅ Notification created successfully:', message);
    } catch (error) {
        console.error('❌ Notification creation failed:', error);
    }
};