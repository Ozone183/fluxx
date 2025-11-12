// src/components/CanvasLayerComponent.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Modal,        // ← Add this
  TextInput,    // ← Add this
  Alert,        // ← Add this
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
  const [showProfile, setShowProfile] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [captionText, setCaptionText] = useState(layer.caption || '');

  useEffect(() => {
    setPosition(layer.position);
  }, [layer.id, layer.position.x, layer.position.y]);

  // Double-tap handler for zoom (Feature 4)
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      setIsZoomed(!isZoomed);
    }
    setLastTap(now);
  };

  // Save caption to Firestore with null safety
const handleSaveCaption = async () => {
  if (!canvasId || !layer?.id) {
    Alert.alert('Error', 'Invalid canvas or layer');
    return;
  }

  try {
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      Alert.alert('Error', 'Canvas not found');
      return;
    }

    const canvasData = canvasSnap.data();
    if (!canvasData?.layers || !Array.isArray(canvasData.layers)) {
      Alert.alert('Error', 'Invalid canvas data');
      return;
    }

    const updatedLayers = canvasData.layers.map((l: CanvasLayer) =>
      l.id === layer.id ? { ...l, caption: captionText.trim(), updatedAt: Date.now() } : l
    );

    await updateDoc(canvasRef, { layers: updatedLayers });
    setShowCaptionModal(false);
  } catch (error) {
    console.error('Save caption error:', error);
    Alert.alert('Error', 'Could not save caption');
  }
};

  // Pan responder for dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      handleDoubleTap();
      onSelect();
      setPosition(layer.position);
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
          transform: [
            { rotate: `${layer.rotation}deg` },
            { scale: isZoomed ? 2.2 : 1 },
          ],
          zIndex: layer.zIndex,
        },
        isSelected && styles.selected,
      ]}
      {...panResponder.panHandlers}
    >
      {/* Layer Content */}
      {layer.type === 'image' && layer.imageUrl && (
  <View style={styles.imageWithCaption}>
    <Image
      source={{ uri: layer.imageUrl }}
      style={styles.image}
      resizeMode="cover"
    />
    {layer.caption && layer.caption.trim().length > 0 && (
      <View style={styles.captionOverlay}>
        <Text style={styles.captionText} numberOfLines={2}>
          {layer.caption}
        </Text>
      </View>
    )}
  </View>
)}

      {layer.type === 'text' && (
        <Text
          style={[
            styles.text,
            {
              fontSize: layer.fontSize || 24,
              color: layer.fontColor || '#000000',
              width: '100%',
            },
          ]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {layer.text}
        </Text>
      )}

      {/* Caption Button - only for images when selected and user can edit */}
      {isSelected && layer.type === 'image' && canEdit && (
        <TouchableOpacity
          style={styles.captionButton}
          onPress={() => {
            setCaptionText(layer.caption || '');
            setShowCaptionModal(true);
          }}
          activeOpacity={0.7}
        >
          <Icon name="text" size={20} color={COLORS.cyan400} />
        </TouchableOpacity>
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
      {/* Caption Modal */}
      <Modal visible={showCaptionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Caption</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter caption..."
              placeholderTextColor={COLORS.slate500}
              value={captionText}
              onChangeText={setCaptionText}
              multiline
              maxLength={100}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setCaptionText(layer.caption || '');
                  setShowCaptionModal(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveCaption}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  imageWithCaption: {
    width: '100%',
    height: '100%',
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
  captionButton: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: COLORS.slate900,
    borderRadius: 12,
    padding: 4,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  captionText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.slate700,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.white,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
  },
  modalSaveButton: {
    backgroundColor: COLORS.cyan500,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CanvasLayerComponent;