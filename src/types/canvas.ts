// src/types/canvas.ts

export interface CanvasLayer {
  id: string;
  type: 'image' | 'text' | 'sticker';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  
  // Image layer
  imageUrl?: string;
  
  // Text layer
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  
  // Sticker layer
  stickerUrl?: string;
  
  // Metadata
  createdBy: string;
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
  
  // Access control
  accessType: 'public' | 'private' | 'friends'; // friends for v2
  inviteCode?: string; // For private canvases
  
  // Layers
  layers: CanvasLayer[];
  
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
}

export interface ActivePresence {
  userId: string;
  username: string;
  profilePicUrl?: string;
  cursorPosition?: { x: number; y: number };
  selectedLayerId?: string;
  lastActive: number;
}
