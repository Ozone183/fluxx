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
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { ref as dbRef, onValue, set, serverTimestamp } from 'firebase/database';
import { firestore, database } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import ViewShot from 'react-native-view-shot';
import * as Haptics from 'expo-haptics';
import { Ionicons as Icon } from '@expo/vector-icons';

import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, CanvasLayer, ActivePresence } from '../types/canvas';
import CanvasLayerComponent from '../components/CanvasLayerComponent';
import CollaboratorsBar from '../components/CollaboratorsBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_RATIO = 9 / 16; // Instagram story ratio
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = CANVAS_WIDTH / CANVAS_RATIO;

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

  // Listen to canvas updates
  useEffect(() => {
    if (!canvasId) return;

    const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);

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

  // Listen to active presences (real-time)
  useEffect(() => {
    if (!canvasId || !userId) return;

    const presenceRef = dbRef(database, `canvases/${canvasId}/presence`);

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presences = snapshot.val() || {};
      setActivePresences(presences);
    });

    // Set my presence
    const myPresenceRef = dbRef(database, `canvases/${canvasId}/presence/${userId}`);
    set(myPresenceRef, {
      userId,
      username: userChannel || '@unknown',
      lastActive: serverTimestamp(),
    });

    // Cleanup presence on unmount
    return () => {
      set(myPresenceRef, null);
      unsubscribe();
    };
  }, [canvasId, userId]);

  // Update my presence every 5 seconds
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

        // Upload to Firebase Storage
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `canvas_${canvasId}_${Date.now()}.jpg`;
        const storageReference = storageRef(storage, `canvases/${canvasId}/${filename}`);
        await uploadBytes(storageReference, blob);
        const downloadURL = await getDownloadURL(storageReference);

        // Create layer
        const newLayer: CanvasLayer = {
          id: `layer_${Date.now()}`,
          type: 'image',
          position: { x: CANVAS_WIDTH / 4, y: CANVAS_HEIGHT / 4 },
          size: { width: CANVAS_WIDTH / 2, height: CANVAS_HEIGHT / 3 },
          rotation: 0,
          zIndex: (canvas?.layers.length || 0) + 1,
          imageUrl: downloadURL,
          createdBy: userId!,

          createdByUsername: userChannel || '@unknown', // ADD
          createdByProfilePic: null, // ADD
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Update Firestore
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
      // Calculate text width based on content length
      const textLength = textInput.trim().length;
      const estimatedWidth = Math.min(Math.max(textLength * 12, 200), CANVAS_WIDTH * 0.9);

      const newLayer: CanvasLayer = {
        id: `layer_${Date.now()}_${Math.random()}`,
        type: 'text',
        position: {
          x: Math.random() * (CANVAS_WIDTH / 4),
          y: Math.random() * (CANVAS_HEIGHT / 4)
        },
        size: {
          width: estimatedWidth, // Dynamic width based on text length
          height: 80 // Taller for wrapping
        },
        rotation: 0,
        zIndex: (canvas?.layers.length || 0) + 1,
        text: textInput.trim(),
        fontSize: 24,
        fontColor: '#000000',
        fontFamily: 'System',
        createdBy: userId!,
        createdByUsername: userChannel || '@unknown', // ADD
        createdByProfilePic: null, // ADD
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

  const exportCanvas = async () => {
    try {
      setExporting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!viewShotRef.current) {
        Alert.alert('Error', 'Canvas not ready for export');
        return;
      }

      // Capture canvas as image
      const uri = await viewShotRef.current.capture();

      // Upload to Firebase Storage
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `canvas_export_${canvasId}_${Date.now()}.png`;
      const storageReference = storageRef(storage, `exports/${filename}`);
      await uploadBytes(storageReference, blob);
      const downloadURL = await getDownloadURL(storageReference);

      // Save export URL to canvas
      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', canvasId);
      await updateDoc(canvasRef, { exportedImageUrl: downloadURL });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Canvas exported successfully!', [
        { text: 'View', onPress: () => console.log('Show export') },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Export error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Export Failed', 'Could not export canvas');
    } finally {
      setExporting(false);
    }
  };

  if (loading || !canvas) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading Canvas...</Text>
      </View>
    );
  }

  const activeCollaborators = Object.values(activePresences).filter(p =>
    Date.now() - (p.lastActive || 0) < 10000 // Active in last 10 seconds
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.canvasTitle}>{canvas.title}</Text>
          <Text style={styles.expiryText}>Expires in {getTimeRemaining(canvas.expiresAt)}</Text>
        </View>
        <TouchableOpacity onPress={exportCanvas} disabled={exporting} style={styles.exportButton}>
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.cyan400} />
          ) : (
            <Icon name="download-outline" size={24} color={COLORS.cyan400} />
          )}
        </TouchableOpacity>
      </View>

      {/* Collaborators Bar */}
      <CollaboratorsBar collaborators={activeCollaborators} maxShow={5} />

      {/* Canvas */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
            {canvas.layers
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

      {/* Add Menu */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddMenu(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      {/* Add Menu Modal */}
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

      {/* Text Input Modal */}
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
    </View>
  );
};

const getTimeRemaining = (expiresAt: number): string => {
  const remaining = expiresAt - Date.now();
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.amber400,
    marginTop: 2,
  },
  exportButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  canvas: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  addButton: {
    position: 'absolute',
    bottom: 100, // ← Change from 30 to 100 (accounts for 120px tab bar)
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
});

export default CanvasEditorScreen;
