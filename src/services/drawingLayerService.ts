// src/services/drawingLayerService.ts
import { 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';
import { CanvasLayer } from '../types/canvas';

// Base canvas dimensions (same as CanvasEditorScreen)
const BASE_CANVAS_WIDTH = 350;
const BASE_CANVAS_HEIGHT = 622;

/**
 * Find an empty spot for the new drawing layer
 * Similar to findEmptySpot in CanvasEditorScreen but simplified
 */
const findEmptySpot = (existingLayers: CanvasLayer[], currentPage: number) => {
  // Default size for drawing layers (about 30% of canvas)
  const layerWidth = BASE_CANVAS_WIDTH * 0.30;
  const layerHeight = BASE_CANVAS_HEIGHT * 0.20;

  // Try common positions
  const positions = [
    { x: 20, y: 20 }, // Top left
    { x: BASE_CANVAS_WIDTH - layerWidth - 20, y: 20 }, // Top right
    { x: 20, y: BASE_CANVAS_HEIGHT - layerHeight - 20 }, // Bottom left
    { x: BASE_CANVAS_WIDTH - layerWidth - 20, y: BASE_CANVAS_HEIGHT - layerHeight - 20 }, // Bottom right
    { x: BASE_CANVAS_WIDTH / 2 - layerWidth / 2, y: 20 }, // Top center
    { x: BASE_CANVAS_WIDTH / 2 - layerWidth / 2, y: BASE_CANVAS_HEIGHT - layerHeight - 20 }, // Bottom center
  ];

  const currentPageLayers = existingLayers.filter(l => (l.pageIndex ?? 0) === currentPage);

  // Check each position for overlap
  for (const pos of positions) {
    let hasOverlap = false;

    for (const layer of currentPageLayers) {
      const overlapX = pos.x < (layer.position.x + layer.size.width + 10) &&
        (pos.x + layerWidth) > (layer.position.x - 10);
      const overlapY = pos.y < (layer.position.y + layer.size.height + 10) &&
        (pos.y + layerHeight) > (layer.position.y - 10);

      if (overlapX && overlapY) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) return pos;
  }

  // If all spots taken, offset from center
  return {
    x: BASE_CANVAS_WIDTH / 2 - layerWidth / 2 + (existingLayers.length * 15) % 50,
    y: BASE_CANVAS_HEIGHT / 2 - layerHeight / 2 + (existingLayers.length * 15) % 50,
  };
};

/**
 * Add a drawing as a new layer to an existing canvas
 */
export const addDrawingLayer = async (
  canvasId: string,
  imageUrl: string,
  userId: string,
  username: string,
  userAvatar?: string
): Promise<void> => {
  try {
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
    
    // Get current canvas to find empty spot
    const canvasSnap = await getDoc(canvasRef);
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const canvasData = canvasSnap.data();
    const existingLayers = canvasData.layers || [];
    const currentPage = 0; // Default to first page for now

    // Check layer limit
    const currentPageLayers = existingLayers.filter((l: any) => (l.pageIndex ?? 0) === currentPage);
    if (currentPageLayers.length >= (canvasData.maxCollaborators || 12)) {
      throw new Error('Canvas page is full. Maximum layers reached.');
    }

    // Find empty position
    const position = findEmptySpot(existingLayers, currentPage);

    // Default size for drawing layers
    const layerWidth = BASE_CANVAS_WIDTH * 0.30;
    const layerHeight = BASE_CANVAS_HEIGHT * 0.20;

    // Create new layer
    const newLayer: CanvasLayer = {
      id: `layer_${Date.now()}_${Math.random()}`,
      type: 'image',
      position,
      size: { width: layerWidth, height: layerHeight },
      rotation: 0,
      zIndex: existingLayers.length + 1,
      pageIndex: currentPage,
      imageUrl,
      caption: '✏️ Drawing', // Optional caption
      createdBy: userId,
      createdByUsername: username,
      createdByProfilePic: userAvatar || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add layer to canvas
    await updateDoc(canvasRef, {
      layers: arrayUnion(newLayer),
    });

    // Update collaborators if needed
    const userInCollaborators = canvasData.collaborators && canvasData.collaborators[userId];
    
    if (!userInCollaborators) {
      await updateDoc(canvasRef, {
        [`collaborators.${userId}`]: {
          userId,
          username,
          profilePicUrl: userAvatar || null,
          joinedAt: Date.now(),
          isActive: true,
          lastSeen: Date.now(),
        }
      });
    }

    console.log('✅ Drawing layer added successfully:', newLayer.id);
  } catch (error) {
    console.error('❌ Error adding drawing layer:', error);
    throw error;
  }
};
