// src/services/cursorService.ts
import { ref as dbRef, set, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface UserCursor {
  userId: string;
  username: string;
  position: CursorPosition;
  color: string;
  lastActive: number;
}

// Generate consistent color for user based on their ID
export const getUserCursorColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B195', // Peach
    '#6C5CE7', // Indigo
  ];
  
  // Use userId to generate consistent color index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Update current user's cursor position in real-time
 */
export const updateCursorPosition = (
  canvasId: string,
  userId: string,
  username: string,
  x: number,
  y: number
) => {
  const cursorRef = dbRef(database, `canvasCursors/${canvasId}/${userId}`);
  
  set(cursorRef, {
    userId,
    username,
    position: {
      x,
      y,
      timestamp: Date.now(),
    },
    color: getUserCursorColor(userId),
    lastActive: Date.now(),
  }).catch((error) => {
    console.error('❌ Error updating cursor:', error);
  });
};

/**
 * Subscribe to other users' cursor positions
 */
export const subscribeToCursors = (
  canvasId: string,
  currentUserId: string,
  onCursorsUpdate: (cursors: UserCursor[]) => void
) => {
  const cursorsRef = dbRef(database, `canvasCursors/${canvasId}`);
  
  const handleCursorsUpdate = (snapshot: any) => {
    const cursorsData = snapshot.val();
    if (!cursorsData) {
      onCursorsUpdate([]);
      return;
    }

    const now = Date.now();
    const activeCursors: UserCursor[] = [];

    Object.keys(cursorsData).forEach((userId) => {
      // Don't show current user's own cursor
      if (userId === currentUserId) return;

      const cursor = cursorsData[userId];
      
      // Only show cursors active in last 5 seconds
      if (now - cursor.lastActive < 5000) {
        activeCursors.push(cursor);
      }
    });

    onCursorsUpdate(activeCursors);
  };

  onValue(cursorsRef, handleCursorsUpdate);

  // Return cleanup function
  return () => {
    off(cursorsRef, 'value', handleCursorsUpdate);
  };
};

/**
 * Remove user's cursor when they leave
 */
export const removeCursor = (canvasId: string, userId: string) => {
  const cursorRef = dbRef(database, `canvasCursors/${canvasId}/${userId}`);
  set(cursorRef, null).catch((error) => {
    console.error('❌ Error removing cursor:', error);
  });
};

/**
 * Throttle cursor updates to avoid too many writes
 */
export const createThrottledCursorUpdate = (
    canvasId: string,
    userId: string,
    username: string,
    intervalMs: number = 100
  ) => {
    let lastUpdate = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (x: number, y: number) => {
    const now = Date.now();
    
    if (now - lastUpdate >= intervalMs) {
      // Update immediately
      updateCursorPosition(canvasId, userId, username, x, y);
      lastUpdate = now;
    } else {
      // Schedule update
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        updateCursorPosition(canvasId, userId, username, x, y);
        lastUpdate = Date.now();
        timeoutId = null;
      }, intervalMs - (now - lastUpdate));
    }
  };
};
