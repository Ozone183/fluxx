import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { DrawingTemplate } from '../data/drawingTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 32;

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
  const route = useRoute<RouteProp<RouteParams, 'DrawingEditorScreen'>>();
  const { template } = route.params;

  // Drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'brush' | 'eraser'>('pen');

  // History for undo/redo
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

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
        if (currentPoints.length > 0) {
          const newStroke: Stroke = {
            points: currentPoints,
            color: selectedTool === 'eraser' ? template.background : selectedColor,
            width: selectedTool === 'eraser' ? strokeWidth * 3 : strokeWidth,
            tool: selectedTool,
          };

          const newStrokes = [...strokes, newStroke];
          setStrokes(newStrokes);

          // Update history
          const newHistory = history.slice(0, historyStep + 1);
          newHistory.push(newStrokes);
          setHistory(newHistory);
          setHistoryStep(newHistory.length - 1);

          setCurrentPoints([]);
        }
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

  const handleSave = () => {
    if (strokes.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something before saving!');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // TODO: Convert canvas to image and save
    Alert.alert(
      'Coming Soon!',
      'Drawing save functionality will be implemented next. For now, your drawing works perfectly!'
    );

    // navigation.goBack();
  };

  const handleBack = () => {
    if (strokes.length > 0) {
      Alert.alert(
        'Discard Drawing?',
        'Your drawing will be lost.',
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
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{template.name}</Text>
          <Text style={styles.headerSubtitle}>{template.instructions}</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Ionicons name="checkmark" size={32} color={COLORS.cyan400} />
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          style={[
            styles.canvasWrapper,
            { backgroundColor: template.background },
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
            <G>
              {/* Render all completed strokes */}
              {strokes.map((stroke, index) => (
                <Path
                  key={index}
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
            disabled={!canUndo}
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
            disabled={!canRedo}
          >
            <Ionicons
              name="arrow-redo"
              size={24}
              color={canRedo ? COLORS.slate300 : COLORS.slate600}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={handleClear}>
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
    padding: 16,
  },
  canvasWrapper: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.slate700,
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
});
