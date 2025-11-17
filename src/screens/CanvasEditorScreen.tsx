// src/screens/CanvasEditorScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput as RNTextInput,
  Clipboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { ref as dbRef, onValue, set, serverTimestamp } from 'firebase/database';
import { firestore, database } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import ViewShot from 'react-native-view-shot';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons as Icon } from '@expo/vector-icons';
import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import MusicLibraryModal from '../components/MusicLibraryModal';
import { MusicTrack } from '../data/musicTracks';
import MusicPlayerBar from '../components/MusicPlayerBar';
import { MUSIC_LIBRARY } from '../data/musicTracks';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, CanvasLayer, ActivePresence } from '../types/canvas';
import CanvasLayerComponent from '../components/CanvasLayerComponent';
import CollaboratorsBar from '../components/CollaboratorsBar';
import LayerListPanel from '../components/LayerListPanel'; // ← ADD THIS LINE
import AnimationSelectorModal from '../components/AnimationSelectorModal';
import VideoExportButton from '../components/VideoExportButton';
import PrivateCanvasMembersModal from '../components/PrivateCanvasMembersModal';
import ShareModal from '../components/ShareModal';

// Base canvas dimensions (reference size - iPhone 14 standard)
const BASE_CANVAS_WIDTH = 350;
const BASE_CANVAS_HEIGHT = 622; // 16:9 ratio

// Actual device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate actual canvas size (with padding)
const ACTUAL_CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 40, 500); // Max 500px for tablets
const ACTUAL_CANVAS_HEIGHT = ACTUAL_CANVAS_WIDTH * (BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH);

// Scale factor for this device
const SCALE_FACTOR = ACTUAL_CANVAS_WIDTH / BASE_CANVAS_WIDTH;

console.log('📐 Canvas System:', {
  baseSize: `${BASE_CANVAS_WIDTH}x${BASE_CANVAS_HEIGHT}`,
  actualSize: `${ACTUAL_CANVAS_WIDTH}x${ACTUAL_CANVAS_HEIGHT}`,
  scaleFactor: SCALE_FACTOR,
  deviceWidth: SCREEN_WIDTH
});


const findEmptySpot = (canvas: Canvas | null, newLayerSize: { width: number; height: number }, currentPage: number) => {
  if (!canvas) return { x: 50, y: 50 };

  // Use BASE canvas dimensions for consistent positioning
  const positions = [
    { x: 20, y: 20 },
    { x: BASE_CANVAS_WIDTH - newLayerSize.width - 20, y: 20 },
    { x: 20, y: BASE_CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: BASE_CANVAS_WIDTH - newLayerSize.width - 20, y: BASE_CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: BASE_CANVAS_WIDTH / 2 - newLayerSize.width / 2, y: 20 },
    { x: BASE_CANVAS_WIDTH / 2 - newLayerSize.width / 2, y: BASE_CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: 20, y: BASE_CANVAS_HEIGHT / 2 - newLayerSize.height / 2 },
    { x: BASE_CANVAS_WIDTH - newLayerSize.width - 20, y: BASE_CANVAS_HEIGHT / 2 - newLayerSize.height / 2 },
    { x: BASE_CANVAS_WIDTH * 0.15, y: BASE_CANVAS_HEIGHT * 0.25 },
    { x: BASE_CANVAS_WIDTH * 0.62, y: BASE_CANVAS_HEIGHT * 0.25 },
    { x: BASE_CANVAS_WIDTH * 0.15, y: BASE_CANVAS_HEIGHT * 0.58 },
    { x: BASE_CANVAS_WIDTH * 0.62, y: BASE_CANVAS_HEIGHT * 0.58 },
  ];

  for (const pos of positions) {
    let hasOverlap = false;

    const currentPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage);

    for (const layer of currentPageLayers) {
      const overlapX = pos.x < (layer.position.x + layer.size.width + 10) &&
        (pos.x + newLayerSize.width) > (layer.position.x - 10);
      const overlapY = pos.y < (layer.position.y + layer.size.height + 10) &&
        (pos.y + newLayerSize.height) > (layer.position.y - 10);

      if (overlapX && overlapY) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) return pos;
  }

  // If all spots taken
  return {
    x: 30 + (canvas.layers.length * 20) % (BASE_CANVAS_WIDTH - newLayerSize.width - 60),
    y: 30 + (canvas.layers.length * 20) % (BASE_CANVAS_HEIGHT - newLayerSize.height - 60),
  };
};

const CanvasEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { canvasId } = route.params as { canvasId: string };
  const { userId, userChannel } = useAuth();
  const viewShotRef = useRef<ViewShot>(null);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activePresences, setActivePresences] = useState<{ [userId: string]: ActivePresence }>({});
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showLayerPanel, setShowLayerPanel] = useState(false); // ← ADD THIS LINE
  const [currentPage, setCurrentPage] = useState(0); // ← ADD THIS LINE
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [shouldPlayMusic, setShouldPlayMusic] = useState(true);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showAnimationSelector, setShowAnimationSelector] = useState(false);
  const [animatingLayerId, setAnimatingLayerId] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - enable music
      setShouldPlayMusic(true);
      console.log('🎵 Canvas focused - music enabled');

      return () => {
        // Screen is unfocused (user left canvas) - disable music
        setShouldPlayMusic(false);
        console.log('🛑 Canvas unfocused - stopping music');
      };
    }, [])
  );

  // Auto-hide analytics after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnalytics(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [canvasId]);

  // ... all your useEffect hooks stay the same ...

  useEffect(() => {
    if (!canvasId) return;

    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);

    // Increment view count when canvas loads (only once per session)
    const incrementViewCount = async () => {
      try {
        await updateDoc(canvasRef, {
          viewCount: increment(1)
        });
        console.log('✅ View count incremented');
      } catch (error) {
        console.log('⚠️ View count update failed:', error);
      }
    };

    // Call once on mount
    incrementViewCount();

    // Listen to canvas updates
    const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
      if (snapshot.exists()) {
        const canvasData = { id: snapshot.id, ...snapshot.data() } as Canvas;
        setCanvas(canvasData);
        setLoading(false);
      } else {
        Alert.alert('Canvas Not Found', 'This canvas may have been deleted.');
        navigation.goBack();
      }
    });

    return () => unsubscribe();
  }, [canvasId]);

  useEffect(() => {
    if (!canvasId || !userId) return;
    const presenceRef = dbRef(database, `canvases/${canvasId}/presence`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presences = snapshot.val() || {};
      setActivePresences(presences);
    });
    const myPresenceRef = dbRef(database, `canvases/${canvasId}/presence/${userId}`);
    set(myPresenceRef, {
      userId,
      username: userChannel || '@unknown',
      lastActive: serverTimestamp(),
    });
    return () => {
      set(myPresenceRef, null);
      unsubscribe();
    };
  }, [canvasId, userId]);

  useEffect(() => {
    if (!canvasId || !userId) return;
    const interval = setInterval(() => {
      const myPresenceRef = dbRef(database, `canvases/${canvasId}/presence/${userId}`);
      set(myPresenceRef, {
        userId,
        username: userChannel || '@unknown',
        selectedLayerId,
        lastActive: serverTimestamp(),
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [canvasId, userId, selectedLayerId]);

  const updateCollaboratorIfNeeded = async () => {
    if (!canvas || !userId || !userChannel) return;

    // Check if user is already in collaborators object
    const userInCollaborators = canvas.collaborators && canvas.collaborators[userId];

    // If NOT in collaborators → add them
    if (!userInCollaborators) {
      try {
        const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);

        await updateDoc(canvasRef, {
          [`collaborators.${userId}`]: {
            userId: userId,
            username: userChannel,
            profilePicUrl: null,
            joinedAt: Date.now(),
            isActive: true,
            lastSeen: Date.now(),
          }
        });

        console.log('✅ Added user to collaborators:', userChannel);
      } catch (error) {
        console.error('❌ Failed to update collaborators:', error);
      }
    }
  };

  const addImageLayer = async () => {
    try {
      // ← ADD THIS CHECK HERE
      const currentPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage);
      if (canvas && currentPageLayers.length >= canvas.maxCollaborators) {
        const message = canvas.totalPages > 1
          ? `This page can only hold ${canvas.maxCollaborators} layers. Switch to another page or delete a layer to add new content.`
          : `This canvas can only hold ${canvas.maxCollaborators} layers. Delete a layer to add new content.`;

        Alert.alert('Page Full', message, [{ text: 'OK' }]);
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShowAddMenu(false);
        const imageUri = result.assets[0].uri;

        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `canvas_${canvasId}_${Date.now()}.jpg`;
        const storageReference = storageRef(storage, `canvases/${canvasId}/${filename}`);
        await uploadBytes(storageReference, blob);
        const downloadURL = await getDownloadURL(storageReference);

        // Use BASE canvas dimensions for consistent sizing across devices
        const newLayerSize = {
          width: BASE_CANVAS_WIDTH * 0.28,
          height: BASE_CANVAS_HEIGHT * 0.16
        };
        const smartPosition = findEmptySpot(canvas, newLayerSize, currentPage);

        const newLayer: CanvasLayer = {
          id: `layer_${Date.now()}`,
          type: 'image',
          position: smartPosition,
          size: newLayerSize,
          rotation: 0,
          zIndex: (canvas?.layers.length || 0) + 1,
          pageIndex: currentPage, // NEW - uses current page
          imageUrl: downloadURL,
          createdBy: userId!,
          createdByUsername: userChannel || '@unknown',
          createdByProfilePic: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
        await updateDoc(canvasRef, {
          layers: arrayUnion(newLayer),
        });

        await updateCollaboratorIfNeeded();

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Add image error:', error);
      Alert.alert('Error', 'Could not add image');
    }
  };

  const addTextLayer = () => {
    setShowAddMenu(false);
    setShowTextModal(true);
  };

  const handleAddText = async () => {
    if (!textInput.trim()) return;

    try {
      // Check layer limit
      const currentPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage);
      if (canvas && currentPageLayers.length >= canvas.maxCollaborators) {
        const message = canvas.totalPages > 1
          ? `This page can only hold ${canvas.maxCollaborators} layers. Switch to another page or delete a layer to add new content.`
          : `This canvas can only hold ${canvas.maxCollaborators} layers. Delete a layer to add new content.`;

        Alert.alert('Page Full', message, [{ text: 'OK' }]);
        return;
      }

      const textLength = textInput.trim().length;
      const estimatedWidth = Math.min(Math.max(textLength * 8, 180), BASE_CANVAS_WIDTH * 0.7);

      // Calculate height based on text length and width (allow wrapping)
      const charsPerLine = Math.floor(estimatedWidth / 12);
      const estimatedLines = Math.ceil(textLength / charsPerLine);
      const estimatedHeight = Math.max(estimatedLines * 30, 60); // 30px per line, min 60px

      const newLayerSize = {
        width: estimatedWidth,
        height: Math.min(estimatedHeight, BASE_CANVAS_HEIGHT * 0.4) // Max 40% of canvas height
      };
      const smartPosition = findEmptySpot(canvas, newLayerSize, currentPage);

      const newLayer: CanvasLayer = {
        id: `layer_${Date.now()}_${Math.random()}`,
        type: 'text',
        position: smartPosition,
        size: newLayerSize,
        rotation: 0,
        zIndex: (canvas?.layers.length || 0) + 1,
        pageIndex: currentPage, // NEW - uses current page
        text: textInput.trim(),
        fontSize: 24,
        fontColor: '#000000',
        fontFamily: 'System',
        createdBy: userId!,
        createdByUsername: userChannel || '@unknown',
        createdByProfilePic: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      const canvasSnap = await getDoc(canvasRef);

      if (canvasSnap.exists()) {
        const currentLayers = canvasSnap.data().layers || [];
        await updateDoc(canvasRef, {
          layers: [...currentLayers, newLayer]
        });
      }

      await updateCollaboratorIfNeeded();

      setTextInput('');
      setShowTextModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Add text error:', error);
      Alert.alert('Error', 'Could not add text');
    }
  };

  const deleteLayer = async (layerId: string) => {
    if (!canvas) return;

    const updatedLayers = canvas.layers.filter(layer => layer.id !== layerId);
    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);

    try {
      await updateDoc(canvasRef, { layers: updatedLayers });
      setSelectedLayerId(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Delete layer error:', error);
    }
  };

  const autoFormatLayers = async () => {
    if (!canvas) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get layers for current page only
      const currentPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage);
      const otherPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) !== currentPage);

      // Grid layout (3 columns)
      const cols = 3;
      const rows = Math.ceil(currentPageLayers.length / cols);
      const cellWidth = (BASE_CANVAS_WIDTH - 40) / cols;
      const cellHeight = (BASE_CANVAS_HEIGHT - 40) / rows;

      // Reposition layers in grid
      const formattedLayers = currentPageLayers.map((layer, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
          ...layer,
          position: {
            x: 20 + (col * cellWidth) + (cellWidth - layer.size.width) / 2,
            y: 20 + (row * cellHeight) + (cellHeight - layer.size.height) / 2,
          },
          updatedAt: Date.now(),
        };
      });

      // Update Firestore with formatted layers
      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      await updateDoc(canvasRef, {
        layers: [...otherPageLayers, ...formattedLayers]
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Auto-format error:', error);
      Alert.alert('Error', 'Could not organize layers');
    }
  };

  const handleSelectMusic = async (track: MusicTrack | null) => {
    try {
      if (!canvasId) return;

      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);

      if (track) {
        // Save only track ID to Firestore
        await updateDoc(canvasRef, {
          selectedMusicId: track.id,
        });

        setSelectedMusic(track);
        Alert.alert('🎵 Music Added', `"${track.title}" added to your canvas`);
      } else {
        // Remove music
        await updateDoc(canvasRef, {
          selectedMusicId: null,
        });
        setSelectedMusic(null);
        Alert.alert('Music Removed', 'Music removed from canvas');
      }
    } catch (error) {
      console.error('Error updating music:', error);
      Alert.alert('Error', 'Could not update music');
    }
  };

  // 🆕 ADD THE toggleStoryMode FUNCTION RIGHT HERE (AFTER handleSelectMusic)

  const toggleStoryMode = async () => {
    if (!canvas || !canvasId) return;

    try {
      const newValue = !canvas.showAllCaptions;

      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      await updateDoc(canvasRef, {
        showAllCaptions: newValue,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('📖 Story Mode:', newValue ? 'ENABLED' : 'DISABLED');

      Alert.alert(
        newValue ? '📖 Story Mode ON' : '📖 Story Mode OFF',
        newValue
          ? 'All captions are now visible for storytelling!'
          : 'Captions will only show when layers are selected.'
      );
    } catch (error) {
      console.error('Story mode toggle error:', error);
      Alert.alert('Error', 'Could not toggle story mode');
    }
  };

  // 👇 ADD THIS NEW ONE:
  useEffect(() => {
    if (canvas?.selectedMusicId) {
      const track = MUSIC_LIBRARY.find(t => t.id === canvas.selectedMusicId);
      if (track) {
        setSelectedMusic(track);
      }
    } else {
      setSelectedMusic(null);
    }
  }, [canvas]);

  const exportCanvas = async () => {
    try {
      setExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!viewShotRef.current) {
        Alert.alert('Error', 'Canvas not ready for export');
        return;
      }

      // Step 1: Request Camera Roll permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to save canvases to your Camera Roll.',
          [{ text: 'OK' }]
        );
        setExporting(false);
        return;
      }

      // Step 2: Capture canvas as image
      const uri = await viewShotRef.current.capture();

      if (!uri) {
        Alert.alert('Error', 'Failed to capture canvas');
        setExporting(false);
        return;
      }

      // Step 3: Upload to Firebase Storage
      let firebaseUrl = '';
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `canvas_export_${canvasId}_${Date.now()}.png`;
        const storageReference = storageRef(storage, `exports/${filename}`);
        await uploadBytes(storageReference, blob);
        firebaseUrl = await getDownloadURL(storageReference);

        // Save export URL to canvas document
        const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
        await updateDoc(canvasRef, { exportedImageUrl: firebaseUrl });

        console.log('✅ Firebase upload successful:', firebaseUrl);
      } catch (firebaseError) {
        console.error('⚠️ Firebase upload failed:', firebaseError);
        // Continue with Camera Roll save even if Firebase fails
      }

      // Step 4: Save to Camera Roll
      const asset = await MediaLibrary.createAssetAsync(uri);

      if (asset) {
        // Optionally create custom album (iOS only)
        try {
          const album = await MediaLibrary.getAlbumAsync('Fluxx');
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync('Fluxx', asset, false);
          }
        } catch (albumError) {
          console.log('Album creation skipped:', albumError);
          // Asset is still saved to Camera Roll even if album fails
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Success!',
          `Canvas exported!\n${firebaseUrl ? '• Saved to Cloud\n' : ''}• Saved to Camera Roll`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save to Camera Roll');
      }

    } catch (error) {
      console.error('Export error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Export Failed',
        `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setExporting(false);
    }
  };

  const shareCanvas = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowShareModal(true);
  };

  const handleExportImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!viewShotRef.current) {
        Alert.alert('Error', 'Canvas not ready for export');
        return;
      }

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable photo library access in settings');
        return;
      }

      // Capture canvas as image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });

      // Add watermark overlay (simple approach)
      const watermarkedUri = await addWatermarkOverlay(uri);

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(watermarkedUri);
      await MediaLibrary.createAlbumAsync('Fluxx', asset, false);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Exported!',
        'Canvas saved to your gallery',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not save canvas');
    }
  };

  const addWatermarkOverlay = async (imageUri: string): Promise<string> => {
    // For now, return original URI
    // We'll add watermark rendering in next step
    return imageUri;
  };

  const toggleLike = async () => {
    if (!canvas || !userId) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      const isLiked = canvas.likedBy?.includes(userId);

      if (isLiked) {
        // Unlike
        const updatedLikedBy = canvas.likedBy.filter(id => id !== userId);
        await updateDoc(canvasRef, {
          likeCount: increment(-1),
          likedBy: updatedLikedBy
        });
        console.log('👎 Unliked canvas');
      } else {
        // Like
        await updateDoc(canvasRef, {
          likeCount: increment(1),
          likedBy: arrayUnion(userId)
        });

        // ✅ ADD THIS: Create like notification
        if (canvas.creatorId !== userId) {
          const { createNotification } = await import('../utils/notifications');
          await createNotification({
            recipientUserId: canvas.creatorId,
            type: 'like',
            fromUserId: userId,
            fromUsername: userChannel || '@unknown',
            fromProfilePic: null,
            relatedCanvasId: canvasId,
            relatedCanvasTitle: canvas.title,
          });
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('❤️ Liked canvas');
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      Alert.alert('Error', 'Could not update like');
    }
  };


  const activeCollaborators = Object.values(activePresences).filter(p =>
    Date.now() - (p.lastActive || 0) < 10000
  );

  // ✅ ADD THIS CHECK HERE
  if (loading || !canvas) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading canvas...</Text>
      </View>
    );
  }

  const handleSelectAnimation = async (animationConfig: { type: string; duration: number; delay: number; loop: boolean }) => {
    if (!animatingLayerId || !canvas) return;

    try {
      const updatedLayers = canvas.layers.map(layer => {
        if (layer.id === animatingLayerId) {
          const updatedLayer: any = {
            ...layer,
            updatedAt: Date.now(),
          };

          // Remove animation or set new one
          if (animationConfig.type === 'none') {
            delete updatedLayer.animation;
          } else {
            updatedLayer.animation = {
              type: animationConfig.type,
              duration: animationConfig.duration,
              delay: animationConfig.delay,
              loop: animationConfig.loop,
            };
          }

          return updatedLayer;
        }
        return layer;
      });

      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      await updateDoc(canvasRef, { layers: updatedLayers });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('🎬 Animation applied:', animationConfig);
    } catch (error) {
      console.error('Animation error:', error);
      Alert.alert('Error', 'Could not apply animation');
    }
  };

  return (
    <View style={[styles.container, focusMode && styles.focusModeContainer]}>
      {/* Header */}
      {!focusMode && (
        <View style={styles.header}>
          {/* Row 1: Back Button + Title + Focus + Collapse */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Text style={styles.canvasTitle} numberOfLines={1} ellipsizeMode="tail">
                {canvas.title}
              </Text>
              {canvas.accessType === 'private' && (
                <View style={styles.privateBadge}>
                  <Icon name="lock-closed" size={12} color={COLORS.white} />
                </View>
              )}
            </View>

            {/* Focus Mode Button */}
            <TouchableOpacity
              onPress={() => setFocusMode(!focusMode)}
              style={styles.focusModeButton}
            >
              <Icon
                name={focusMode ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={focusMode ? COLORS.purple400 : COLORS.cyan400}
              />
            </TouchableOpacity>

            {/* Collapse/Expand Button */}
            <TouchableOpacity
              onPress={() => setHeaderCollapsed(!headerCollapsed)}
              style={styles.collapseButton}
            >
              <Icon
                name={headerCollapsed ? "chevron-down-outline" : "chevron-up-outline"}
                size={20}
                color={COLORS.cyan400}
              />
            </TouchableOpacity>
          </View>

          {/* Row 2: Primary Actions */}
          {!headerCollapsed && (
            <View style={styles.actionsRow}>
              {/* Layers Button */}
              <TouchableOpacity onPress={() => setShowLayerPanel(true)} style={styles.actionButton}>
                <Icon name="layers-outline" size={22} color={COLORS.cyan400} />
              </TouchableOpacity>

              {/* Auto-Format Button */}
              <TouchableOpacity onPress={autoFormatLayers} style={styles.actionButton}>
                <Icon name="grid-outline" size={22} color={COLORS.amber400} />
              </TouchableOpacity>

              {/* Video Export Button */}
              <VideoExportButton
                canvasId={canvasId}
                canvasTitle={canvas.title}
                canvasRef={viewShotRef}
              />

              {/* Export Button (Image) */}
              <TouchableOpacity onPress={exportCanvas} disabled={exporting} style={styles.actionButton}>
                {exporting ? (
                  <ActivityIndicator size="small" color={COLORS.cyan400} />
                ) : (
                  <Icon name="download-outline" size={22} color={COLORS.cyan400} />
                )}
              </TouchableOpacity>

              {/* 🆕 Story Mode Toggle - CREATOR ONLY */}
              {userId === canvas.creatorId && (
                <TouchableOpacity
                  onPress={toggleStoryMode}
                  style={[
                    styles.actionButton,
                    canvas?.showAllCaptions && styles.actionButtonActive
                  ]}
                >
                  <Icon
                    name={canvas?.showAllCaptions ? "book" : "book-outline"}
                    size={22}
                    color={canvas?.showAllCaptions ? COLORS.cyan400 : COLORS.purple400}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Row 3: Secondary Actions */}
          {!headerCollapsed && (
            <View style={styles.secondaryActionsRow}>
              {/* Music Button - CREATOR ONLY */}
              {userId === canvas.creatorId && (
                <TouchableOpacity onPress={() => setShowMusicLibrary(true)} style={styles.actionButton}>
                  <Ionicons
                    name={selectedMusic ? "musical-notes" : "musical-notes-outline"}
                    size={22}
                    color={selectedMusic ? COLORS.cyan400 : COLORS.purple400}
                  />
                  {selectedMusic && <View style={styles.musicIndicator} />}
                </TouchableOpacity>
              )}

              {/* Copy Invite Code Button - CREATOR ONLY for PRIVATE canvases */}
              {userId === canvas.creatorId && canvas.accessType === 'private' && canvas.inviteCode && (
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setString(canvas.inviteCode!);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('📋 Copied!', `Invite code: ${canvas.inviteCode}`);
                  }}
                  style={styles.actionButton}
                >
                  <Icon name="key-outline" size={22} color={COLORS.amber400} />
                </TouchableOpacity>
              )}

              {/* View Members Button - CREATOR ONLY for PRIVATE canvases */}
              {userId === canvas.creatorId && canvas.accessType === 'private' && (
                <TouchableOpacity
                  onPress={() => setShowMembersModal(true)}
                  style={styles.actionButton}
                >
                  <Icon name="people-outline" size={22} color={COLORS.purple400} />
                  {canvas.allowedUsers && canvas.allowedUsers.length > 1 && (
                    <View style={styles.memberCountBadge}>
                      <Text style={styles.memberCountText}>{canvas.allowedUsers.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Share Button */}
              <TouchableOpacity onPress={shareCanvas} style={styles.actionButton}>
                <Icon name="share-outline" size={22} color={COLORS.purple400} />
              </TouchableOpacity>

              {/* Like Button */}
              <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
                <Icon
                  name={canvas?.likedBy?.includes(userId || '') ? "heart" : "heart-outline"}
                  size={22}
                  color={canvas?.likedBy?.includes(userId || '') ? COLORS.red500 : COLORS.red400}
                />
                {canvas?.likeCount ? (
                  <Text style={styles.likeCountBadge}>{canvas.likeCount}</Text>
                ) : null}
              </TouchableOpacity>
            </View>
          )}

          {/* Row 4: Canvas Info */}
          {!headerCollapsed && (
            <View style={styles.headerBottom}>
              <View style={styles.infoItem}>
                <Icon name="time-outline" size={14} color={COLORS.amber400} />
                <Text style={styles.infoText}>Expires in {getTimeRemaining(canvas.expiresAt)}</Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <Icon name="document-outline" size={14} color={COLORS.cyan400} />
                <Text style={styles.infoText}>
                  Page {currentPage + 1} of {canvas.totalPages || 1}
                </Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <Icon name="layers-outline" size={14} color={COLORS.purple400} />
                <Text style={styles.infoText}>
                  {canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage).length}/{canvas.maxCollaborators} layers
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Floating Action Buttons (when header collapsed) */}
      {headerCollapsed && !focusMode && (
        <View style={styles.floatingActions}>
          <TouchableOpacity style={styles.floatingButton} onPress={() => setShowLayerPanel(true)}>
            <Icon name="layers-outline" size={20} color="#fff" />
          </TouchableOpacity>

          {userId === canvas.creatorId && (
            <TouchableOpacity
              style={[styles.floatingButton, selectedMusic && styles.floatingButtonActive]}
              onPress={() => setShowMusicLibrary(true)}
            >
              <Icon name="musical-notes-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.floatingButton} onPress={shareCanvas}>
            <Icon name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.floatingButton} onPress={toggleLike}>
            <Icon
              name={canvas?.likedBy?.includes(userId || '') ? "heart" : "heart-outline"}
              size={20}
              color={canvas?.likedBy?.includes(userId || '') ? COLORS.red400 : "#fff"}
            />
          </TouchableOpacity>
        </View>
      )}

      {!focusMode && (
        <View style={{ paddingHorizontal: 60, alignItems: 'center' }}>
          <CollaboratorsBar collaborators={activeCollaborators} maxShow={5} />
        </View>
      )}

      {/* Music Player Bar */}
      {selectedMusic && shouldPlayMusic && (
        <View style={focusMode && { display: 'none' }}>
          <MusicPlayerBar
            key={`music-${canvasId}`}
            track={selectedMusic}
            onRemove={() => handleSelectMusic(null)}
            isCreator={userId === canvas.creatorId}
          />
        </View>
      )}

      {/* Canvas Analytics */}
      {canvas && showAnalytics && !focusMode && (
        <TouchableOpacity
          style={styles.analyticsBar}
          activeOpacity={1}
          onPress={() => setShowAnalytics(true)}
        >
          <View style={styles.analyticsItem}>
            <Icon name="eye-outline" size={16} color={COLORS.cyan400} />
            <Text style={styles.analyticsText}>{canvas.viewCount || 0} views</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Icon name="heart" size={16} color={COLORS.red400} />
            <Text style={styles.analyticsText}>{canvas.likeCount || 0} likes</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Icon name="people-outline" size={16} color={COLORS.purple400} />
            <Text style={styles.analyticsText}>
              {getTopContributors(canvas).length} contributors
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Floating Analytics Button */}
      {!showAnalytics && !focusMode && (
        <TouchableOpacity
          style={styles.floatingAnalyticsButton}
          onPress={() => setShowAnalytics(true)}
        >
          <Icon name="eye-outline" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Exit Focus Mode Button */}
      {focusMode && (
        <TouchableOpacity
          style={styles.exitFocusButton}
          onPress={() => setFocusMode(false)}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ADD THIS ENTIRE BLOCK */}
      {
        !focusMode && canvas?.totalPages && canvas.totalPages > 1 && (
          <View style={styles.pageIndicator}>
            {Array.from({ length: canvas.totalPages }).map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentPage(index)}
                style={[styles.pageDot, currentPage === index && styles.pageDotActive]}
              >
                <Text style={styles.pageDotText}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      }

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <View style={[styles.canvas, {
            width: ACTUAL_CANVAS_WIDTH,
            height: ACTUAL_CANVAS_HEIGHT,
            backgroundColor: canvas.backgroundColor
          }]}>
            {canvas.layers
              .filter(layer => (layer.pageIndex ?? 0) === currentPage)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((layer) => (
                <CanvasLayerComponent
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={() => setSelectedLayerId(selectedLayerId === layer.id ? null : layer.id)}
                  onDelete={() => deleteLayer(layer.id)}
                  onPressAnimation={() => {
                    setAnimatingLayerId(layer.id);
                    setShowAnimationSelector(true);
                  }}
                  canvasId={canvasId}
                  scaleFactor={SCALE_FACTOR} // 🆕 ADD THIS
                  showAllCaptions={canvas?.showAllCaptions || false} // 🆕 ADD THIS
                />
              ))}

            {/* Fancy Watermark overlay */}
            <View style={styles.watermark} pointerEvents="none">
              <View style={styles.watermarkBadge}>
                <View style={styles.watermarkGradient}>
                  <Ionicons name="color-palette" size={12} color="#fff" />
                  <Text style={styles.watermarkText}>Made with Fluxx</Text>
                </View>
              </View>
            </View>
          </View>
        </ViewShot>
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddMenu(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      <Modal visible={showAddMenu} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMenu(false)}
        >
          <View style={styles.addMenuSheet}>
            <Text style={styles.addMenuTitle}>Add to Canvas</Text>

            <TouchableOpacity style={styles.addMenuItem} onPress={addImageLayer}>
              <Icon name="image" size={24} color={COLORS.cyan400} />
              <Text style={styles.addMenuText}>Add Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addMenuItem} onPress={addTextLayer}>
              <Icon name="text" size={24} color={COLORS.cyan400} />
              <Text style={styles.addMenuText}>Add Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addMenuItem, styles.cancelItem]}
              onPress={() => setShowAddMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.textModalOverlay}>
          <View style={styles.textModalContent}>
            <Text style={styles.textModalTitle}>Add Text</Text>
            <RNTextInput
              style={styles.textModalInput}
              placeholder="Type your text..."
              placeholderTextColor={COLORS.slate500}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              maxLength={200}
              autoFocus
            />
            <View style={styles.textModalActions}>
              <TouchableOpacity
                style={styles.textModalButton}
                onPress={() => {
                  setTextInput('');
                  setShowTextModal(false);
                }}
              >
                <Text style={styles.textModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.textModalButton, styles.textModalAddButton]}
                onPress={handleAddText}
              >
                <Text style={styles.textModalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ← ADD THIS LAYER PANEL MODAL AT THE END BEFORE </View> */}
      <LayerListPanel
        visible={showLayerPanel}
        layers={canvas.layers}
        onClose={() => setShowLayerPanel(false)}
        onSelectLayer={setSelectedLayerId}
        onDeleteLayer={deleteLayer}
        selectedLayerId={selectedLayerId}
      />

      {/* 🎵 ADD MUSIC LIBRARY MODAL HERE */}
      <MusicLibraryModal
        visible={showMusicLibrary}
        onClose={() => setShowMusicLibrary(false)}
        onSelectTrack={handleSelectMusic}
        currentTrack={selectedMusic}
      />

      {/* 🎬 Animation Selector Modal */}
      <AnimationSelectorModal
        visible={showAnimationSelector}
        onClose={() => {
          setShowAnimationSelector(false);
          setAnimatingLayerId(null);
        }}
        onSelectAnimation={handleSelectAnimation}
        currentAnimation={
          animatingLayerId
            ? canvas?.layers.find(l => l.id === animatingLayerId)?.animation
            : undefined
        }
      />

      {/* 🔒 Private Canvas Members Modal */}
      {canvas.accessType === 'private' && canvas.allowedUsers && (
        <PrivateCanvasMembersModal
          visible={showMembersModal}
          canvasId={canvasId}
          allowedUsers={canvas.allowedUsers}
          onClose={() => setShowMembersModal(false)}
        />
      )}

      {/* 📤 Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        canvasTitle={canvas.title}
        canvasId={canvasId}
        inviteCode={canvas.inviteCode}
        isPrivate={canvas.accessType === 'private'}
      />
    </View >
  );
};

const getTimeRemaining = (expiresAt: number): string => {
  const remaining = expiresAt - Date.now();
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getTopContributors = (canvas: Canvas): Array<{ userId: string; username: string; count: number }> => {
  const contributorMap: { [userId: string]: { username: string; count: number } } = {};

  canvas.layers.forEach(layer => {
    if (contributorMap[layer.createdBy]) {
      contributorMap[layer.createdBy].count += 1;
    } else {
      contributorMap[layer.createdBy] = {
        username: layer.createdByUsername,
        count: 1
      };
    }
  });

  return Object.entries(contributorMap)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3); // Top 3 contributors
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.cyan400,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.slate900,
    paddingTop: 50,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  canvasTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  titleSpacer: {
    width: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.slate800,
  },
  actionButtonActive: {
    backgroundColor: COLORS.cyan500,
    borderWidth: 1,
    borderColor: COLORS.cyan400,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate300,
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.slate600,
  },
  exportButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  canvas: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cyan500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addMenuSheet: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  addMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  addMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  cancelItem: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red400,
    textAlign: 'center',
  },
  textModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textModalContent: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  textModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  textModalInput: {
    backgroundColor: COLORS.slate700,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  textModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  textModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
  },
  textModalAddButton: {
    backgroundColor: COLORS.cyan500,
  },
  textModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  textModalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    backgroundColor: COLORS.slate900,
  },
  pageDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pageDotActive: {
    backgroundColor: COLORS.cyan500,
    borderColor: COLORS.cyan400,
  },
  pageDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  likeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.slate800,
    position: 'relative',
  },
  likeCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.red500,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 16,
    textAlign: 'center',
  },
  analyticsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.slate800,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  analyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyticsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  watermark: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 9999,
  },
  watermarkBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.8)', // Fluxx cyan with transparency
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.6)', // Lighter cyan border
    shadowColor: '#06b6d4', // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  watermarkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watermarkText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  musicIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan400,
    borderWidth: 1,
    borderColor: COLORS.slate900,
  },
  collapseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.slate800,
  },
  floatingActions: {
    position: 'absolute',
    top: 110,
    right: 16,
    zIndex: 1000,
    gap: 12,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonActive: {
    backgroundColor: COLORS.cyan500,
    borderColor: COLORS.cyan400,
  },
  floatingAnalyticsButton: {
    position: 'absolute',
    top: 120,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  focusModeButton: {
    padding: 8,
    marginLeft: 8,
  },
  exitFocusButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  focusModeContainer: {
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 80,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  privateBadge: {
    backgroundColor: COLORS.purple600,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  memberCountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.purple600,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default CanvasEditorScreen;