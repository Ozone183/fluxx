// src/components/CanvasLayerComponent.tsx

import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { CanvasLayer } from '../types/canvas';
import UserProfileSheet from './UserProfileSheet';


interface CanvasLayerProps {
  layer: CanvasLayer;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canvasId: string;
}

const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const CanvasLayerComponent: React.FC<CanvasLayerProps> = ({
  layer,
  isSelected,
  onSelect,
  onDelete,
  canvasId,
}) => {
  const { userId } = useAuth();
  const [position, setPosition] = useState(layer.position);
  // ADD THIS useEffect:
  useEffect(() => {
    setPosition(layer.position);
  }, [layer.id, layer.position.x, layer.position.y]); // More specific dependencies
  const [showProfile, setShowProfile] = useState(false); // ADD THIS

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      onSelect();
      setPosition(layer.position); // ADD THIS LINE
    },
    onPanResponderMove: (_, gestureState) => {
      setPosition({
        x: layer.position.x + gestureState.dx,
        y: layer.position.y + gestureState.dy,
      });
    },
    onPanResponderRelease: async (_, gestureState) => {
      const newPosition = {
        x: layer.position.x + gestureState.dx,
        y: layer.position.y + gestureState.dy,
      };

      // Update in Firestore
      try {
        const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
        const canvasSnap = await getDoc(canvasRef);
        if (canvasSnap.exists()) {
          const canvasData = canvasSnap.data();
          const updatedLayers = canvasData.layers.map((l: CanvasLayer) =>
            l.id === layer.id ? { ...l, position: newPosition, updatedAt: Date.now() } : l
          );
          await updateDoc(canvasRef, { layers: updatedLayers });
        }
      } catch (error) {
        console.error('Update position error:', error);
      }
    },
  });

  const canEdit = layer.createdBy === userId;

  return (
    <View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
          width: layer.size.width,
          height: layer.size.height,
          transform: [{ rotate: `${layer.rotation}deg` }],
          zIndex: layer.zIndex,
        },
        isSelected && styles.selected,
      ]}
      {...panResponder.panHandlers}
    >
      {/* Layer Content */}
      {layer.type === 'image' && layer.imageUrl && (
        <Image
          source={{ uri: layer.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {layer.type === 'text' && (
        <Text
          style={[
            styles.text,
            {
              fontSize: layer.fontSize || 24,
              color: layer.fontColor || '#000000',
              width: '100%', // ADD THIS
            },
          ]}
          numberOfLines={3} // ADD THIS
          ellipsizeMode="tail" // ADD THIS
        >
          {layer.text}
        </Text>
      )}

      {/* Attribution Badge - only show when selected */}
      {isSelected && (
        <TouchableOpacity style={styles.attributionBadge} onPress={() => setShowProfile(true)}>
          <Text style={styles.attributionText}>
            {layer.createdByUsername} • {getTimeAgo(layer.createdAt)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Delete Button (only if selected and user created it) */}
      {isSelected && canEdit && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Icon name="close-circle" size={24} color={COLORS.red400} />
        </TouchableOpacity>
      )}

      {/* Selection Border */}
      {isSelected && <View style={styles.selectionBorder} />}

      {/* Profile Sheet */}
      <UserProfileSheet
        userId={layer.createdBy}
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  text: {
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selected: {
    // Selection styling handled by border
  },
  selectionBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  deleteButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: COLORS.slate900,
    borderRadius: 12,
  },
  attributionBadge: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attributionText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default CanvasLayerComponent;
