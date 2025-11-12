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


import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, CanvasLayer, ActivePresence } from '../types/canvas';
import CanvasLayerComponent from '../components/CanvasLayerComponent';
import CollaboratorsBar from '../components/CollaboratorsBar';
import LayerListPanel from '../components/LayerListPanel'; // ← ADD THIS LINE

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_RATIO = 9 / 16;
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH / CANVAS_RATIO;


const findEmptySpot = (canvas: Canvas | null, newLayerSize: { width: number; height: number }, currentPage: number) => {
  if (!canvas) return { x: 50, y: 50 };

  const positions = [
    { x: 20, y: 20 },
    { x: CANVAS_WIDTH - newLayerSize.width - 20, y: 20 },
    { x: 20, y: CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: CANVAS_WIDTH - newLayerSize.width - 20, y: CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: CANVAS_WIDTH / 2 - newLayerSize.width / 2, y: 20 },
    { x: CANVAS_WIDTH / 2 - newLayerSize.width / 2, y: CANVAS_HEIGHT - newLayerSize.height - 20 },
    { x: 20, y: CANVAS_HEIGHT / 2 - newLayerSize.height / 2 },
    { x: CANVAS_WIDTH - newLayerSize.width - 20, y: CANVAS_HEIGHT / 2 - newLayerSize.height / 2 },
    { x: CANVAS_WIDTH * 0.15, y: CANVAS_HEIGHT * 0.25 },
    { x: CANVAS_WIDTH * 0.62, y: CANVAS_HEIGHT * 0.25 },
    { x: CANVAS_WIDTH * 0.15, y: CANVAS_HEIGHT * 0.58 },
    { x: CANVAS_WIDTH * 0.62, y: CANVAS_HEIGHT * 0.58 },
  ];

  for (const pos of positions) {
    let hasOverlap = false;

    // Only check layers on current page
    const currentPageLayers = canvas.layers.filter(l => (l.pageIndex ?? 0) === currentPage);

    for (const layer of currentPageLayers) {
      // Add 10px padding to reduce false positives
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

  // If all 12 spots taken, slight offset
  return {
    x: 30 + (canvas.layers.length * 20) % (CANVAS_WIDTH - newLayerSize.width - 60),
    y: 30 + (canvas.layers.length * 20) % (CANVAS_HEIGHT - newLayerSize.height - 60),
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

  const addImageLayer = async () => {
    try {
      // ← ADD THIS CHECK HERE
      if (canvas && canvas.layers.length >= canvas.maxCollaborators) {
        Alert.alert(
          'Canvas Full',
          `This canvas can only hold ${canvas.maxCollaborators} layers. Delete a layer to add new content.`,
          [{ text: 'OK' }]
        );
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

        // ← REPLACE THE OLD newLayer WITH THIS:
        const newLayerSize = { width: CANVAS_WIDTH * 0.28, height: CANVAS_HEIGHT * 0.16 };
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
      if (canvas && canvas.layers.length >= canvas.maxCollaborators) {
        Alert.alert(
          'Canvas Full',
          `This canvas can only hold ${canvas.maxCollaborators} layers. Delete a layer to add new content.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const textLength = textInput.trim().length;
      const estimatedWidth = Math.min(Math.max(textLength * 12, 200), CANVAS_WIDTH * 0.6);
      const newLayerSize = { width: estimatedWidth, height: 80 };
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
      const cellWidth = (CANVAS_WIDTH - 40) / cols;
      const cellHeight = (CANVAS_HEIGHT - 40) / rows;

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
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!canvas) {
        Alert.alert('Error', 'Canvas not available');
        return;
      }

      // Build share content
      const canvasUrl = `fluxx://canvas/${canvasId}`; // Deep link
      const webUrl = `https://fluxx.app/canvas/${canvasId}`; // Web fallback (if you have web app)

      const shareMessage = canvas.accessType === 'private' && canvas.inviteCode
  ? `🎨 Join my private canvas "${canvas.title}"!\n\n🔒 Invite Code: ${canvas.inviteCode}\n\nOpen Fluxx or visit: ${webUrl}`
  : `🎨 Check out my canvas "${canvas.title}" on Fluxx!\n\nJoin here: ${webUrl}`;


      const shareOptions = {
        title: `Join "${canvas.title}" on Fluxx`,
        message: Platform.OS === 'ios' ? shareMessage : shareMessage,
        url: Platform.OS === 'ios' ? webUrl : undefined, // iOS can share URLs separately
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared via specific activity (iOS only)
          console.log(`Shared via ${result.activityType}`);
        } else {
          // Shared successfully (Android or iOS generic share)
          console.log('Canvas shared successfully');
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share sheet
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Could not share canvas');
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Row 1: Navigation + Title + Action Icons */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.canvasTitle}>{canvas.title}</Text>
          </View>
          
          <View style={styles.headerActions}>
            {/* Layers Button */}
            <TouchableOpacity onPress={() => setShowLayerPanel(true)} style={styles.actionButton}>
              <Icon name="layers-outline" size={22} color={COLORS.cyan400} />
            </TouchableOpacity>
            
            {/* Auto-Format Button */}
            <TouchableOpacity onPress={autoFormatLayers} style={styles.actionButton}>
              <Icon name="grid-outline" size={22} color={COLORS.amber400} />
            </TouchableOpacity>

            {/* Export Button */}
            <TouchableOpacity onPress={exportCanvas} disabled={exporting} style={styles.actionButton}>
              {exporting ? (
                <ActivityIndicator size="small" color={COLORS.cyan400} />
              ) : (
                <Icon name="download-outline" size={22} color={COLORS.cyan400} />
              )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity onPress={shareCanvas} style={styles.actionButton}>
              <Icon name="share-outline" size={22} color={COLORS.purple400} />
            </TouchableOpacity>

            {/* Like Button */}
            <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
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
        </View>

        {/* Row 2: Canvas Info */}
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
      </View>

      <CollaboratorsBar collaborators={activeCollaborators} maxShow={5} />

      {/* Canvas Analytics */}
{canvas && (
  <View style={styles.analyticsBar}>
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
  </View>
)}

      {/* ADD THIS ENTIRE BLOCK */}
      {canvas?.totalPages && canvas.totalPages > 1 && (
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
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: canvas.backgroundColor }]}>
            {canvas.layers
              .filter(layer => (layer.pageIndex ?? 0) === currentPage) // ← ADD THIS LINE
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((layer) => (
                <CanvasLayerComponent
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={() => setSelectedLayerId(layer.id)}
                  onDelete={() => deleteLayer(layer.id)}
                  canvasId={canvasId}
                />
              ))}
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
    </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  canvasTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.slate800,
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
});

export default CanvasEditorScreen;