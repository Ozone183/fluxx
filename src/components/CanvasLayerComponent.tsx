// src/components/CanvasLayerComponent.tsx

import React, { useState } from 'react';

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

interface CanvasLayerProps {
  layer: CanvasLayer;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canvasId: string;
}

const CanvasLayerComponent: React.FC<CanvasLayerProps> = ({
  layer,
  isSelected,
  onSelect,
  onDelete,
  canvasId,
}) => {
  const { userId } = useAuth();
  const [position, setPosition] = useState(layer.position);

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      onSelect();
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
              color: layer.fontColor || '#FFFFFF',
            },
          ]}
        >
          {layer.text}
        </Text>
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
});

export default CanvasLayerComponent;
