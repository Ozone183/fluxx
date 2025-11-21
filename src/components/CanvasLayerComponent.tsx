// src/components/CanvasLayerComponent.tsx

import React, { useState, useEffect, useRef } from 'react';
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
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Canvas } from '../types/canvas';
import LayerCaption from './LayerCaption';

interface CanvasLayerProps {
  layer: CanvasLayer;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPressAnimation: () => void;
  onOpenGallery?: () => void;
  canvasId: string;
  scaleFactor: number;
  showAllCaptions?: boolean;
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
  onPressAnimation,
  onOpenGallery,
  canvasId,
  scaleFactor,
  showAllCaptions,
}) => {
  // 🎬 Animation Values
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const animatedTranslateX = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;
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
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      console.log('👆 Tap detected!', {
        timeSinceLastTap: now - lastTap,
        isImage: layer.type === 'image',
        currentZoom: isZoomed
      });

      if (now - lastTap < DOUBLE_TAP_DELAY && layer.type === 'image') {
        // Double tap detected on image - OPEN GALLERY
        console.log('🎬 Opening gallery!');
        if (onOpenGallery) {
          onOpenGallery();
        }
      } else {
        // Single tap - SELECT/DESELECT
        console.log('✅ Selecting layer');
        onSelect();
      }

      setLastTap(now);
      setPosition(layer.position);
    },
    onPanResponderMove: (_, gestureState) => {
      setPosition({
        x: layer.position.x + (gestureState.dx / scaleFactor),
        y: layer.position.y + (gestureState.dy / scaleFactor),
      });
    },
    onPanResponderRelease: async (_, gestureState) => {
      const newPosition = {
        x: layer.position.x + (gestureState.dx / scaleFactor),
        y: layer.position.y + (gestureState.dy / scaleFactor),
      };

      // Only update if layer actually moved
      if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
        try {
          const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
          const canvasSnap = await getDoc(canvasRef);

          if (canvasSnap.exists()) {
            const currentCanvas = canvasSnap.data() as Canvas;
            const updatedLayers = currentCanvas.layers.map((l) =>
              l.id === layer.id
                ? { ...l, position: newPosition, updatedAt: Date.now() }
                : l
            );

            await updateDoc(canvasRef, { layers: updatedLayers });
          }
        } catch (error) {
          console.error('Update position error:', error);
        }
      }

      // Reset position to actual layer position
      setPosition(layer.position);
    },
  });

  const canEdit = layer.createdBy === userId;

  // 🎬 Play Animation on Mount
  useEffect(() => {
    if (!layer.animation || layer.animation.type === 'none') return;

    const { type, duration, delay, loop } = layer.animation;

    // Reset all animated values
    animatedOpacity.setValue(type.includes('fadeOut') ? 1 : type.includes('fadeIn') ? 0 : 1);
    animatedTranslateX.setValue(0);
    animatedTranslateY.setValue(0);
    animatedScale.setValue(type.includes('scaleOut') ? 1 : type.includes('scaleIn') ? 0 : 1);
    animatedRotation.setValue(0);

    // Create animation based on type
    let animation: Animated.CompositeAnimation;

    switch (type) {
      case 'fadeIn':
        animation = Animated.timing(animatedOpacity, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.ease,
        });
        break;

      case 'fadeOut':
        animation = Animated.timing(animatedOpacity, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.ease,
        });
        break;

      case 'slideLeft':
        animatedTranslateX.setValue(100);
        animation = Animated.timing(animatedTranslateX, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case 'slideRight':
        animatedTranslateX.setValue(-100);
        animation = Animated.timing(animatedTranslateX, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case 'slideUp':
        animatedTranslateY.setValue(100);
        animation = Animated.timing(animatedTranslateY, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case 'slideDown':
        animatedTranslateY.setValue(-100);
        animation = Animated.timing(animatedTranslateY, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        });
        break;

      case 'scaleIn':
        animation = Animated.timing(animatedScale, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        });
        break;

      case 'scaleOut':
        animation = Animated.timing(animatedScale, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.in(Easing.back(1.5)),
        });
        break;

      case 'bounce':
        animation = Animated.sequence([
          Animated.timing(animatedTranslateY, {
            toValue: -20,
            duration: duration / 4,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(animatedTranslateY, {
            toValue: 0,
            duration: duration / 4,
            useNativeDriver: true,
            easing: Easing.bounce,
          }),
        ]);
        break;

      case 'rotate':
        animation = Animated.timing(animatedRotation, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
          easing: Easing.linear,
        });
        break;

      case 'pulse':
        animation = Animated.sequence([
          Animated.timing(animatedScale, {
            toValue: 1.2,
            duration: duration / 2,
            delay,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
          Animated.timing(animatedScale, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
        ]);
        break;

      default:
        return;
    }

    // Start animation (loop if needed)
    if (loop) {
      Animated.loop(animation).start();
    } else {
      animation.start();
    }

    // Cleanup
    return () => {
      animation.stop();
    };
  }, [layer.animation]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.layerContainer,
        {
          position: 'absolute',
          left: layer.position.x * scaleFactor,
          top: layer.position.y * scaleFactor,
          width: layer.size.width * scaleFactor,
          height: layer.size.height * scaleFactor,
          zIndex: layer.zIndex,
          opacity: animatedOpacity,
          transform: [
            { rotate: `${layer.rotation}deg` },
            { translateX: animatedTranslateX },
            { translateY: animatedTranslateY },
            { scale: animatedScale },
            {
              rotate: animatedRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      {/* Layer Content */}
      {layer.type === 'image' && layer.imageUrl && (
        <Image
          source={{ uri: layer.imageUrl }}
          style={[
            styles.image,
            isZoomed && {
              transform: [{ scale: 2 }],
              zIndex: 9999
            }
          ]}
          resizeMode="cover"
        />
      )}

      {layer.type === 'text' && (
        <Text
          style={[
            styles.text,
            {
              fontSize: (layer.fontSize || 24) * scaleFactor,
              color: layer.fontColor || '#000000',
              width: '100%',
              flexWrap: 'wrap', // Force text to wrap
              textAlign: 'left', // Align properly
            },
          ]}
          numberOfLines={undefined} // Remove line limit to allow full wrapping
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
          {`${layer.createdByUsername || 'Unknown'} • ${getTimeAgo(layer.createdAt)}`}
        </Text>
      </TouchableOpacity>
      )}

      {/* Delete Button (only if selected and user created it) */}
      {isSelected && canEdit && (
        <>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Icon name="close-circle" size={24} color={COLORS.red400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.animationButton}
            onPress={onPressAnimation}
            activeOpacity={0.7}
          >
            <Icon name="film" size={20} color="#fff" />
            {layer.animation && layer.animation.type !== 'none' && (
              <View style={styles.animationIndicator} />
            )}
          </TouchableOpacity>
        </>
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
      {/* 🆕 EXTERNAL CAPTION - ADD THIS */}
      {layer.type === 'image' && (
        <LayerCaption
          caption={layer.caption || ''}
          isVisible={showAllCaptions || isSelected}
          scaleFactor={scaleFactor}
          layerWidth={layer.size.width * scaleFactor}
        />
      )}

    </Animated.View>
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
    textAlign: 'left', // Change from center to left
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flexWrap: 'wrap', // Ensure wrapping
    lineHeight: undefined, // Let it calculate naturally
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
    right: 7,
    backgroundColor: COLORS.slate900,
    borderRadius: 12,
    padding: 4,
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
  animationButton: {
    position: 'absolute',
    top: -12,
    right: 42, // Position left of delete button
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.purple500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  animationIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan400,
    borderWidth: 1,
    borderColor: COLORS.purple500,
  },
  layerContainer: {
    position: 'absolute',
  },
});

export default CanvasLayerComponent;