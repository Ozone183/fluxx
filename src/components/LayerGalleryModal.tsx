import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  Image,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { CanvasLayer } from '../types/canvas';

interface User {
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
}

interface LayerGalleryModalProps {
  visible: boolean;
  layers: CanvasLayer[];
  initialIndex: number;
  creatorInfo: User;
  onClose: () => void;
  // NEW: For drawing canvas support
  baseImageUrl?: string; // Base drawing image
  canvasType?: 'photo' | 'drawing';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LayerGalleryModal: React.FC<LayerGalleryModalProps> = ({
    visible,
    layers,
    initialIndex,
    creatorInfo,
    onClose,
    baseImageUrl,
    canvasType = 'photo',
  }) => {
    console.log('🚀 LayerGalleryModal RENDERED:', { 
      visible, 
      layersCount: layers.length, 
      baseImageUrl: !!baseImageUrl,
      canvasType 
    });
  
    // Prepare display layers: include base image as Layer 0 for drawing canvases
    const displayLayers = React.useMemo(() => {
    console.log('🎨 LayerGalleryModal useMemo:', {
      canvasType,
      baseImageUrl,
      layersCount: layers.length,
    });
    
    if (canvasType === 'drawing' && baseImageUrl) {
      // Create a fake layer for the base drawing
      const baseLayer: CanvasLayer = {
        id: 'base-drawing',
        type: 'image',
        imageUrl: baseImageUrl,
        position: { x: 0, y: 0 },
        size: { width: 350, height: 622 },
        rotation: 0,
        zIndex: -1,
        pageIndex: 0,
        createdBy: creatorInfo.username,
        createdByUsername: creatorInfo.username,
        createdByProfilePic: creatorInfo.profilePictureUrl || null,
        createdAt: 0,
        updatedAt: 0,
      };
      
      console.log('✅ Adding base layer, total layers:', [baseLayer, ...layers].length);
      return [baseLayer, ...layers];
    }
    
    console.log('📷 Photo canvas, layers:', layers.length);
    return layers;
  }, [layers, baseImageUrl, canvasType, creatorInfo]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOverlay, setShowOverlay] = useState(true);
  const translateX = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset overlay when index changes
  useEffect(() => {
    setShowOverlay(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-hide overlay after 3 seconds
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    autoHideTimer.current = setTimeout(() => {
      handleHideOverlay();
    }, 3000) as any;

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [currentIndex]);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      translateX.setValue(0);
    }
  }, [visible, initialIndex]);

  const handleHideOverlay = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowOverlay(false);
    });
  };

  const handleShowOverlay = () => {
    setShowOverlay(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 3 seconds
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    autoHideTimer.current = setTimeout(() => {
      handleHideOverlay();
    }, 3000) as any;
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: tx, velocityX } = event.nativeEvent;

      // Determine if we should swipe to next/previous
      const shouldSwipe = Math.abs(tx) > SCREEN_WIDTH * 0.3 || Math.abs(velocityX) > 500;

      if (shouldSwipe) {
        if (tx > 0 && currentIndex > 0) {
          // Swipe right - go to previous
          goToPrevious();
        } else if (tx < 0 && currentIndex < displayLayers.length - 1) {
          // Swipe left - go to next
          goToNext();
        } else {
          // Reset if at boundary
          resetPosition();
        }
      } else {
        // Reset position if swipe wasn't strong enough
        resetPosition();
      }
    }
  };

  const goToNext = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, displayLayers.length - 1));
      translateX.setValue(0);
    });
  };

  const goToPrevious = () => {
    Animated.timing(translateX, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      translateX.setValue(0);
    });
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const currentLayer = displayLayers[currentIndex];
  const isImageLayer = currentLayer?.type === 'image' && currentLayer?.imageUrl;
  const isBaseDrawing = currentLayer?.id === 'base-drawing';

  // Get layer creator info
  const layerCreator = isBaseDrawing
    ? creatorInfo
    : {
        username: currentLayer?.createdByUsername || 'Unknown',
        displayName: currentLayer?.createdByUsername || 'Unknown',
        profilePictureUrl: currentLayer?.createdByProfilePic || undefined,
      };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Main Content */}
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleGestureStateChange}
          activeOffsetX={[-10, 10]}
        >
          <Animated.View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.imageTouchable}
              activeOpacity={1}
              onPress={handleShowOverlay}
            >
              {isImageLayer ? (
                <Animated.Image
                  source={{ uri: currentLayer.imageUrl }}
                  style={[
                    styles.image,
                    {
                      transform: [{ translateX }],
                    },
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={80} color="#666" />
                  <Text style={styles.placeholderText}>
                    {currentLayer?.type === 'text' ? 'Text Layer' : 'No Image'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>

        {/* Overlay */}
        {showOverlay && (
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              },
            ]}
            pointerEvents="box-none"
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.layerInfo}>
                <Text style={styles.layerNumber}>
                  {currentIndex + 1} of {displayLayers.length}
                </Text>
                {isBaseDrawing && (
                  <Text style={styles.layerLabel}>Original Drawing</Text>
                )}
              </View>

              <View style={styles.placeholder} />
            </View>

            {/* Bottom Bar with Creator Info */}
            <View style={styles.bottomBar}>
              <View style={styles.creatorSection}>
                <View style={styles.avatarContainer}>
                  {layerCreator.profilePictureUrl ? (
                    <Image
                      source={{ uri: layerCreator.profilePictureUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {layerCreator.username?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.creatorTextContainer}>
                  <Text style={styles.creatorName}>
                    {layerCreator.displayName || layerCreator.username}
                  </Text>
                  <Text style={styles.creatorUsername}>
                    @{layerCreator.username}
                    {isBaseDrawing && ' · Canvas Creator'}
                  </Text>
                </View>
              </View>

              {/* Progress Dots */}
              <View style={styles.progressDots}>
                {displayLayers.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Navigation Arrows (always visible) */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={goToPrevious}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        {currentIndex < displayLayers.length - 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={goToNext}
          >
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 18,
    marginTop: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 8,
    width: 48,
  },
  layerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  layerNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  layerLabel: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  placeholder: {
    width: 48,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  creatorTextContainer: {
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  creatorUsername: {
    color: '#ccc',
    fontSize: 14,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
});

export default LayerGalleryModal;
