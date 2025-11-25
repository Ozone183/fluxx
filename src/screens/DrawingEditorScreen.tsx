import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, G } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { COLORS } from '../theme/colors';
import { DrawingTemplate } from '../data/drawingTemplates';
import { auth } from '../config/firebase';
import { uploadDrawingImage } from '../services/drawingStorage';
import { createDrawingCanvas } from '../services/drawingCanvasService';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH;

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'brush' | 'eraser';
}

type RouteParams = {
    DrawingEditorScreen: {
      template: DrawingTemplate;
    };
    DrawingEditor: {
      mode?: 'canvas' | 'layer';
      canvasId?: string;
      template?: DrawingTemplate;
    };
  };

// Preset colors
const PRESET_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF8C00', // Orange
  '#8B008B', // Purple
  '#FFFFFF', // White
];

// Tool options
const TOOLS = [
  { id: 'pen', icon: 'create-outline', label: 'Pen' },
  { id: 'brush', icon: 'brush-outline', label: 'Brush' },
  { id: 'eraser', icon: 'remove-circle-outline', label: 'Eraser' },
];

// Convert points array to SVG path string
const pointsToPath = (points: Point[]): string => {
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
};

export default function DrawingEditorScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'DrawingEditorScreen' | 'DrawingEditor'>>();
    
    // Support both old route (DrawingEditorScreen) and new route (DrawingEditor)
    const params = route.params as any;
    const mode = params?.mode || 'canvas'; // 'canvas' = new canvas, 'layer' = add to existing
    const canvasId = params?.canvasId;
    const template = params?.template || {
      id: 'blank',
      name: 'Quick Draw',
      category: 'quick',
      instructions: 'Draw anything!',
      background: '#FFFFFF',
      icon: 'brush',
    };

  // Drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'brush' | 'eraser'>('pen');
  const [isSaving, setIsSaving] = useState(false);
  const { userChannel } = useAuth(); // Add after navigation/route hooks

  // Ref for canvas capture
  const canvasViewRef = useRef<View>(null);

  // History for undo/redo
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Use refs to keep latest values for PanResponder
  const strokesRef = useRef(strokes);
  const historyRef = useRef(history);
  const historyStepRef = useRef(historyStep);

  // Update refs when state changes
  React.useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  // Add refs for color, tool, and width
  const selectedColorRef = useRef(selectedColor);
  const selectedToolRef = useRef(selectedTool);
  const strokeWidthRef = useRef(strokeWidth);

  React.useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  React.useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  React.useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  React.useEffect(() => {
    historyRef.current = history;
  }, [history]);

  React.useEffect(() => {
    historyStepRef.current = historyStep;
  }, [historyStep]);

  // PanResponder for touch handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints(prev => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentPoints(currentPts => {
          if (currentPts.length > 1) {
            // Use refs to get current values
            const currentColor = selectedColorRef.current;
            const currentTool = selectedToolRef.current;
            const currentWidth = strokeWidthRef.current;
            
            const newStroke: Stroke = {
              points: [...currentPts],
              color: currentTool === 'eraser' ? template.background : currentColor,
              width: currentTool === 'eraser' ? currentWidth * 3 : currentWidth,
              tool: currentTool,
            };

            // Use refs to get latest values
            const currentStrokes = strokesRef.current;
            const newStrokes = [...currentStrokes, newStroke];
            
            setStrokes(newStrokes);

            // Update history
            const currentHistory = historyRef.current;
            const currentStep = historyStepRef.current;
            const newHistory = [...currentHistory.slice(0, currentStep + 1), newStrokes];
            
            setHistory(newHistory);
            setHistoryStep(newHistory.length - 1);
          }
          return [];
        });
      },
    })
  ).current;

  const handleUndo = () => {
    if (historyStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setStrokes(history[newStep]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setStrokes(history[newStep]);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Canvas?',
      'Are you sure you want to clear the entire canvas?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setStrokes([]);
            setHistory([[]]);
            setHistoryStep(0);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (strokes.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something before saving!');
      return;
    }
  
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to save drawings');
      return;
    }
  
    setIsSaving(true);
  
    try {
      console.log('🎨 Capturing canvas...');
      
      const uri = await captureRef(canvasViewRef, {
        format: 'png',
        quality: 0.9,
      });
  
      console.log('✅ Canvas captured:', uri);
  
      console.log('☁️ Uploading to Firebase Storage...');
      const uploadResult = await uploadDrawingImage(
        uri,
        auth.currentUser.uid
      );
  
      console.log('✅ Upload successful:', uploadResult.imageUrl);
  
      const username = userChannel || auth.currentUser.displayName || 'Anonymous';
      const userAvatar = auth.currentUser.photoURL || '';
  
      if (mode === 'layer' && canvasId) {
        // MODE: Add drawing as layer to existing canvas
        console.log('📦 Adding drawing as layer to canvas:', canvasId);
        
        const { addDrawingLayer } = await import('../services/drawingLayerService');
        await addDrawingLayer(
          canvasId,
          uploadResult.imageUrl,
          auth.currentUser.uid,
          username,
          userAvatar
        );
        
        console.log('✅ Drawing layer added!');
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
        
      } else {
        // MODE: Create new drawing canvas
        console.log('📦 Creating drawing canvas...');
        const newCanvasId = await createDrawingCanvas(
          auth.currentUser.uid,
          username,
          uploadResult.imageUrl,
          uploadResult.storagePath,
          template.name,
          userAvatar
        );
  
        console.log('✅ Drawing canvas created:', newCanvasId);
  
        setStrokes([]);
        setHistory([[]]);
        setHistoryStep(0);
  
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Drawing Saved! 🎉',
          'Your masterpiece has been saved to canvas stories!',
          [
            {
              text: 'Go to Feed',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' as never }],
                });
              },
            },
            {
              text: 'Create Another',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error saving drawing:', error);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Error Saving Drawing',
        error.message || 'Failed to save your drawing. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Also update handleBack to check if drawing was saved
const handleBack = () => {
    if (strokes.length > 0) {
      Alert.alert(
        'Discard Drawing?',
        'Your unsaved drawing will be lost.',
        [
          { text: 'Keep Drawing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleToolSelect = (tool: 'pen' | 'brush' | 'eraser') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTool(tool);

    // Auto-adjust stroke width for tools
    if (tool === 'pen') setStrokeWidth(3);
    if (tool === 'brush') setStrokeWidth(8);
    if (tool === 'eraser') setStrokeWidth(20);
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.headerButton}
          disabled={isSaving}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{template.name}</Text>
          <Text style={styles.headerSubtitle}>{template.instructions}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.cyan400} />
          ) : (
            <Ionicons name="checkmark" size={32} color={COLORS.cyan400} />
          )}
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasViewRef}
          collapsable={false}
          style={[
            styles.canvasWrapper,
            { backgroundColor: template.background },
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_SIZE} height={SCREEN_HEIGHT - 300}>
            <G>
              {/* Render all completed strokes */}
              {strokes.map((stroke, index) => (
                <Path
                  key={`stroke-${index}`}
                  d={pointsToPath(stroke.points)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Render current stroke being drawn */}
              {currentPoints.length > 0 && (
                <Path
                  d={pointsToPath(currentPoints)}
                  stroke={selectedTool === 'eraser' ? template.background : selectedColor}
                  strokeWidth={selectedTool === 'eraser' ? strokeWidth * 3 : strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          </Svg>
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Tools Row */}
        <View style={styles.toolsRow}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolButton,
                selectedTool === tool.id && styles.toolButtonActive,
              ]}
              onPress={() => handleToolSelect(tool.id as any)}
              disabled={isSaving}
            >
              <Ionicons
                name={tool.icon as any}
                size={24}
                color={selectedTool === tool.id ? '#FFFFFF' : COLORS.slate400}
              />
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.toolButton, !canUndo && styles.toolButtonDisabled]}
            onPress={handleUndo}
            disabled={!canUndo || isSaving}
          >
            <Ionicons
              name="arrow-undo"
              size={24}
              color={canUndo ? COLORS.slate300 : COLORS.slate600}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, !canRedo && styles.toolButtonDisabled]}
            onPress={handleRedo}
            disabled={!canRedo || isSaving}
          >
            <Ionicons
              name="arrow-redo"
              size={24}
              color={canRedo ? COLORS.slate300 : COLORS.slate600}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={handleClear}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.red500} />
          </TouchableOpacity>
        </View>

        {/* Colors Row */}
        {selectedTool !== 'eraser' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.colorsScroll}
            contentContainerStyle={styles.colorsRow}
            scrollEnabled={!isSaving}
          >
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  color === '#FFFFFF' && styles.colorButtonWhite,
                  selectedColor === color && styles.colorButtonSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedColor(color);
                }}
                disabled={isSaving}
              >
                {selectedColor === color && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={color === '#FFFFFF' || color === '#FFFF00' ? '#000000' : '#FFFFFF'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stroke Width */}
        {selectedTool !== 'eraser' && (
          <View style={styles.widthRow}>
            <Text style={styles.widthLabel}>Width: {strokeWidth}px</Text>
            <View style={styles.widthButtons}>
              {[1, 3, 5, 8, 12].map((width) => (
                <TouchableOpacity
                  key={width}
                  style={[
                    styles.widthButton,
                    strokeWidth === width && styles.widthButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStrokeWidth(width);
                  }}
                  disabled={isSaving}
                >
                  <View
                    style={[
                      styles.widthPreview,
                      {
                        width: width * 2,
                        height: width * 2,
                        backgroundColor: strokeWidth === width ? COLORS.cyan400 : COLORS.slate400,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Saving Overlay */}
      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={COLORS.cyan400} />
            <Text style={styles.savingText}>Saving your masterpiece...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
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
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasWrapper: {
    width: CANVAS_SIZE,
    height: SCREEN_HEIGHT - 300,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
  },
  toolbar: {
    backgroundColor: COLORS.slate800,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
    paddingBottom: 20,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.slate700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolButtonActive: {
    backgroundColor: COLORS.cyan400,
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.slate600,
    marginHorizontal: 4,
  },
  colorsScroll: {
    marginTop: 12,
  },
  colorsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonWhite: {
    borderColor: COLORS.slate600,
  },
  colorButtonSelected: {
    borderColor: COLORS.cyan400,
    borderWidth: 3,
  },
  widthRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  widthLabel: {
    fontSize: 13,
    color: COLORS.slate300,
    marginBottom: 8,
  },
  widthButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  widthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.slate700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widthButtonActive: {
    backgroundColor: COLORS.slate600,
  },
  widthPreview: {
    borderRadius: 12,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingCard: {
    backgroundColor: COLORS.slate800,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  savingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});