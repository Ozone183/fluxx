// src/utils/notifications.ts

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';

export type NotificationType = 'follow' | 'canvas_invite' | 'like' | 'comment';

interface CreateNotificationParams {
  recipientUserId: string;
  type: NotificationType;
  fromUserId: string;
  fromUsername: string;
  fromProfilePic?: string | null;
  relatedCanvasId?: string;
  relatedCanvasTitle?: string;
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
  } = params;

  // Don't notify yourself
  if (recipientUserId === fromUserId) {
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
      message = `${fromUsername} liked your canvas "${relatedCanvasTitle}"`;
      actionUrl = `fluxx://canvas/${relatedCanvasId}`;
      break;

    case 'comment':
      message = `${fromUsername} commented on your canvas`;
      actionUrl = `fluxx://canvas/${relatedCanvasId}`;
      break;

    default:
      message = `${fromUsername} interacted with you`;
      actionUrl = `fluxx://profile/${fromUserId}`;
  }

  try {
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
      timestamp: Date.now(),
      isRead: false,
      actionUrl,
    });

    console.log('✅ Notification created:', message);
  } catch (error) {
    console.error('❌ Notification creation failed:', error);
  }
};
