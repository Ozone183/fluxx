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
  templateId?: string;

  // Access control
  accessType: 'public' | 'private' | 'friends';
  inviteCode?: string;
  allowedUsers?: string[]; // 🆕 userIds who have access
  pendingRequests?: string[]; // 🆕 userIds waiting for approval

  // Layers
  layers: CanvasLayer[];
  totalPages: number;

  // Collaboration
  collaborators?: { [userId: string]: CanvasCollaborator };
  maxCollaborators: number;

  // Lifecycle
  createdAt: number;
  expiresAt: number;
  isExpired: boolean;

  // Export
  exportedImageUrl?: string;
  isArchived: boolean;

  // Stats
  viewCount: number;
  likeCount: number;
  likedBy: string[];

  selectedMusicId?: string;
  showAllCaptions?: boolean;

  commentCount?: number;
  reactions?: {
    heart: string[];
    fire: string[];
    laugh: string[];
    clap: string[];
    heart_eyes: string[];
    sparkles: string[];
  };
  reactionCounts?: {
    heart: number;
    fire: number;
    laugh: number;
    clap: number;
    heart_eyes: number;
    sparkles: number;
  };
}

export interface ActivePresence {
  userId: string;
  username: string;
  profilePicUrl?: string;
  cursorPosition?: { x: number; y: number };
  selectedLayerId?: string;
  lastActive: number;
}

export interface CanvasComment {
  id: string;
  canvasId: string;
  
  // Content
  text: string;
  
  // 🎤 NEW - Voice Comment Fields
  voiceUrl?: string; // Firebase Storage URL for voice recording
  voiceDuration?: number; // Duration in seconds
  
  // Author
  userId: string;
  username: string;
  userProfilePic: string | null;
  
  // Threading
  parentCommentId: string | null;
  replyCount: number;
  
  // Reactions
  reactions: {
    heart: string[];
    fire: string[];
    laugh: string[];
    clap: string[];
    heart_eyes: string[];
    sparkles: string[];
  };
  reactionCounts: {
    heart: number;
    fire: number;
    laugh: number;
    clap: number;
    heart_eyes: number;
    sparkles: number;
  };
  
  // Metadata
  createdAt: number;
  updatedAt: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  
  // Moderation
  isReported: boolean;
  reportCount: number;
}

export type { ReactionType } from '../data/reactions';

