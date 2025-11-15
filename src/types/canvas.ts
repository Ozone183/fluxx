// src/types/canvas.ts

export interface CanvasLayer {
  id: string;
  type: 'image' | 'text' | 'sticker';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  pageIndex: number; // ← ADD THIS LINE

  // 🎬 NEW: Animation Properties
  animation?: {
    type: 'fadeIn' | 'fadeOut' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scaleIn' | 'scaleOut' | 'bounce' | 'rotate' | 'pulse' | 'none';
    duration: number; // in milliseconds (500-5000)
    delay: number; // start delay in milliseconds (0-10000)
    loop: boolean; // repeat forever
  };

  // Image layer
  imageUrl?: string;
  caption?: string; // ← ADD THIS LINE

  // Text layer
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;

  // Sticker layer
  stickerUrl?: string;

  // Metadata
  createdBy: string;
  createdByUsername: string; // ADD
  createdByProfilePic?: string; // ADD
  createdAt: number;
  updatedAt: number;
}

export interface CanvasCollaborator {
  userId: string;
  username: string;
  profilePicUrl?: string;
  joinedAt: number;
  isActive: boolean; // Currently viewing/editing
  lastSeen: number;
}

export interface Canvas {
  id: string;
  title: string;
  creatorId: string;
  creatorUsername: string;

  // Canvas settings
  width: number;
  height: number;
  backgroundColor: string;
  templateId?: string; // ✅ ADD THIS LINE

  // Access control
  accessType: 'public' | 'private' | 'friends'; // friends for v2
  inviteCode?: string; // For private canvases

  // Layers
  layers: CanvasLayer[];
  totalPages: number; // ← ADD THIS LINE

  // Collaboration
  collaborators: { [userId: string]: CanvasCollaborator };
  maxCollaborators: number; // 12 for v1

  // Lifecycle
  createdAt: number;
  expiresAt: number; // 24 hours from creation
  isExpired: boolean;

  // Export
  exportedImageUrl?: string;
  isArchived: boolean;

  // Stats
  viewCount: number;
  likeCount: number;
  likedBy: string[];

  // Remove old musicTrack field if it exists
  // Add this instead:
  selectedMusicId?: string;
}

export interface ActivePresence {
  userId: string;
  username: string;
  profilePicUrl?: string;
  cursorPosition?: { x: number; y: number };
  selectedLayerId?: string;
  lastActive: number;
}


