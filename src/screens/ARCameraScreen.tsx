import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, Text as SvgText, Polygon, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 15 FILTER TYPES - GONNA MAKE SNAPCHAT JEALOUS 🔥
type FilterType = 
  | 'none'
  | 'crown'           // Royal/Luxury
  | 'halo'            // Heavenly
  | 'fire'            // Fire/Energy
  | 'heart_eyes'      // Love/Cute
  | 'stars'           // Mystical
  | 'lightning'       // Energy
  | 'angel_wings'     // Heavenly
  | 'sunglasses'      // Cool/Swag
  | 'money_rain'      // Rich
  | 'neon_glow'       // Cool
  | 'galaxy'          // Mystical
  | 'hearts_everywhere' // Love
  | 'confetti'        // Party
  | 'diamond_rain'    // Luxury
  | 'sparkles';       // Mystical

interface Filter {
  id: FilterType;
  name: string;
  icon: string;
  emoji: string;
}

const FILTERS: Filter[] = [
  { id: 'none', name: 'None', icon: 'close-circle-outline', emoji: '❌' },
  { id: 'crown', name: 'Crown', icon: 'diamond-outline', emoji: '👑' },
  { id: 'halo', name: 'Halo', icon: 'radio-button-on-outline', emoji: '😇' },
  { id: 'fire', name: 'Fire', icon: 'flame-outline', emoji: '🔥' },
  { id: 'heart_eyes', name: 'Hearts', icon: 'heart-outline', emoji: '😍' },
  { id: 'stars', name: 'Stars', icon: 'star-outline', emoji: '⭐' },
  { id: 'lightning', name: 'Lightning', icon: 'flash-outline', emoji: '⚡' },
  { id: 'angel_wings', name: 'Wings', icon: 'chevron-expand-outline', emoji: '👼' },
  { id: 'sunglasses', name: 'Cool', icon: 'glasses-outline', emoji: '😎' },
  { id: 'money_rain', name: 'Money', icon: 'cash-outline', emoji: '💸' },
  { id: 'neon_glow', name: 'Neon', icon: 'bulb-outline', emoji: '🌟' },
  { id: 'galaxy', name: 'Galaxy', icon: 'planet-outline', emoji: '🌌' },
  { id: 'hearts_everywhere', name: 'Love', icon: 'heart-circle-outline', emoji: '💕' },
  { id: 'confetti', name: 'Party', icon: 'happy-outline', emoji: '🎉' },
  { id: 'diamond_rain', name: 'Diamonds', icon: 'diamond-outline', emoji: '💎' },
  { id: 'sparkles', name: 'Sparkle', icon: 'sparkles-outline', emoji: '✨' },
];

export default function ARCameraScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<Camera>(null);
  
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideoPath, setRecordedVideoPath] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Recording timer
  const recordingTimer = useRef<any>(null);
  
  // Camera device and permissions
  const device = useCameraDevice(cameraPosition);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Request permissions on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  // Handle camera flip
  const handleFlipCamera = () => {
    setCameraPosition(prev => prev === 'front' ? 'back' : 'front');
  };

  // Handle filter selection
  const handleFilterSelect = (filterId: FilterType) => {
    setSelectedFilter(filterId);
  };

  // Handle close
  const handleClose = () => {
    navigation.goBack();
  };

  // Start recording timer
  const startRecordingTimer = () => {
    setRecordingDuration(0);
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop recording timer
  const stopRecordingTimer = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle record start/stop
  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      stopRecordingTimer();
    } else {
      // Start recording
      setIsRecording(true);
      startRecordingTimer();
      
      try {
        console.log('🎥 Starting recording...');
        
        await cameraRef.current.startRecording({
          fileType: 'mp4',
          onRecordingFinished: (video) => {
            console.log('✅ Recording finished:', video.path);
            setIsRecording(false);
            stopRecordingTimer();
            setRecordedVideoPath(video.path);
            setShowVideoPreview(true);
          },
          onRecordingError: (error) => {
            console.error('❌ Recording error:', error);
            setIsRecording(false);
            stopRecordingTimer();
            Alert.alert('Recording Error', error.message);
          },
        });
      } catch (error: any) {
        console.error('❌ Start recording error:', error);
        setIsRecording(false);
        stopRecordingTimer();
        Alert.alert('Error', 'Failed to start recording');
      }
    }
  };

  // Save video to gallery
  const saveToGallery = async () => {
    if (!recordedVideoPath) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save videos');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(recordedVideoPath);
      Alert.alert('Saved! 🎉', 'Video saved to your gallery');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  // Share to feed
  const shareToFeed = () => {
    // TODO: Navigate to create video post with this video
    Alert.alert('Coming Soon! 🚀', 'Share to feed feature coming in next update!');
    setShowVideoPreview(false);
    setRecordedVideoPath(null);
  };

  // Close preview
  const closePreview = () => {
    setShowVideoPreview(false);
    setRecordedVideoPath(null);
  };

  // Render loading state
  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Render no device state
  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />

        {/* AR Overlay - THIS IS WHAT WILL SHOW IN THE VIDEO! */}
        {selectedFilter !== 'none' && (
          <View style={styles.overlayContainer}>
            <AnimatedAROverlay filter={selectedFilter} />
          </View>
        )}
      </View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={handleClose} style={styles.topButton}>
          <Ionicons name="close" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.title}>AR Camera ✨</Text>

        <TouchableOpacity onPress={handleFlipCamera} style={styles.topButton}>
          <Ionicons name="camera-reverse-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Recording Timer */}
      {isRecording && (
        <View style={styles.recordingTimer}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC {formatDuration(recordingDuration)}</Text>
        </View>
      )}

      {/* Filter Picker - SCROLLABLE FOR 15 FILTERS */}
      <View style={styles.filterPicker}>
        <Text style={styles.filterPickerTitle}>Choose Your Vibe ✨</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
              ]}
              onPress={() => handleFilterSelect(filter.id)}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id && styles.filterButtonTextActive,
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.spacer} />

        {/* Record Button */}
        <TouchableOpacity
          onPress={handleRecord}
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          activeOpacity={0.8}
        >
          {isRecording ? (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingSquare} />
            </View>
          ) : (
            <View style={styles.recordCircle} />
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>

      {/* Video Preview Modal */}
      <Modal
        visible={showVideoPreview}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.previewContainer} edges={['top', 'bottom']}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Your AR Video 🎬</Text>
            <TouchableOpacity onPress={closePreview} style={styles.previewCloseButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {recordedVideoPath && (
            <Video
              source={{ uri: recordedVideoPath }}
              style={styles.previewVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.previewButton, styles.saveButton]}
              onPress={saveToGallery}
            >
              <Ionicons name="download-outline" size={24} color={COLORS.white} />
              <Text style={styles.previewButtonText}>Save to Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.shareButton]}
              onPress={shareToFeed}
            >
              <Ionicons name="share-outline" size={24} color={COLORS.white} />
              <Text style={styles.previewButtonText}>Share to Feed</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.discardButton}
            onPress={closePreview}
          >
            <Text style={styles.discardButtonText}>Record Another</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// 🔥 ANIMATED AR OVERLAY COMPONENT - THIS IS THE MAGIC!
function AnimatedAROverlay({ filter }: { filter: FilterType }) {
  // Animation values
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const twinkleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation (for crown, sunglasses)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Twinkle animation (for stars, sparkles)
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation (for halo, neon glow)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation (for hearts, fire)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation (for money rain, confetti)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Position calculations
  const centerX = SCREEN_WIDTH / 2;
  const faceY = SCREEN_HEIGHT * 0.35;
  const topY = SCREEN_HEIGHT * 0.25;
  const bottomY = SCREEN_HEIGHT * 0.75;

  // Rotation interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  switch (filter) {
    case 'crown':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: bounceAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <Stop offset="100%" stopColor="#FFA500" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={`M ${centerX - 50} ${topY} L ${centerX - 40} ${topY + 20} L ${centerX - 20} ${topY + 10} L ${centerX} ${topY + 20} L ${centerX + 20} ${topY + 10} L ${centerX + 40} ${topY + 20} L ${centerX + 50} ${topY} L ${centerX + 40} ${topY - 10} L ${centerX + 30} ${topY} L ${centerX + 20} ${topY - 10} L ${centerX + 10} ${topY} L ${centerX} ${topY - 10} L ${centerX - 10} ${topY} L ${centerX - 20} ${topY - 10} L ${centerX - 30} ${topY} L ${centerX - 40} ${topY - 10} Z`}
              fill="url(#crownGrad)"
              stroke="#FFA500"
              strokeWidth="3"
            />
            <Circle cx={centerX - 20} cy={topY + 5} r="5" fill="#FF0000" />
            <Circle cx={centerX} cy={topY + 5} r="5" fill="#0000FF" />
            <Circle cx={centerX + 20} cy={topY + 5} r="5" fill="#00FF00" />
          </Svg>
        </Animated.View>
      );

    case 'halo':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ rotate }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="haloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
                <Stop offset="50%" stopColor="#FFF" stopOpacity="0.7" />
                <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.9" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={centerX} cy={topY - 20} r="65" fill="none" stroke="url(#haloGrad)" strokeWidth="10" />
            <Circle cx={centerX} cy={topY - 20} r="55" fill="none" stroke="#FFF" strokeWidth="5" opacity={0.6} />
          </Svg>
        </Animated.View>
      );

    case 'fire':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 60} y={bottomY} fontSize="100" textAnchor="middle">🔥</SvgText>
            <SvgText x={centerX + 60} y={bottomY} fontSize="100" textAnchor="middle">🔥</SvgText>
            <SvgText x={centerX} y={bottomY + 40} fontSize="120" textAnchor="middle">🔥</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'heart_eyes':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 40} y={faceY - 10} fontSize="60">💕</SvgText>
            <SvgText x={centerX + 40} y={faceY - 10} fontSize="60">💕</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'stars':
      return (
        <Animated.View style={[styles.overlayContainer, { opacity: twinkleAnim }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 90} y={faceY - 60} fontSize="50">⭐</SvgText>
            <SvgText x={centerX + 90} y={faceY - 70} fontSize="55">⭐</SvgText>
            <SvgText x={centerX} y={topY - 50} fontSize="50">⭐</SvgText>
            <SvgText x={centerX - 100} y={faceY + 90} fontSize="45">✨</SvgText>
            <SvgText x={centerX + 100} y={faceY + 80} fontSize="50">✨</SvgText>
            <SvgText x={centerX - 50} y={faceY - 100} fontSize="40">✨</SvgText>
            <SvgText x={centerX + 50} y={faceY - 90} fontSize="40">✨</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'lightning':
      return (
        <Animated.View style={[styles.overlayContainer, { opacity: twinkleAnim }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 70} y={faceY - 80} fontSize="80">⚡</SvgText>
            <SvgText x={centerX + 70} y={faceY - 60} fontSize="80">⚡</SvgText>
            <SvgText x={centerX - 50} y={bottomY} fontSize="70">⚡</SvgText>
            <SvgText x={centerX + 50} y={bottomY + 20} fontSize="70">⚡</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'angel_wings':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: [0, 10] }) }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            {/* Left wing */}
            <Path
              d={`M ${centerX - 150} ${faceY + 50} Q ${centerX - 120} ${faceY + 20} ${centerX - 90} ${faceY + 60} Q ${centerX - 110} ${faceY + 40} ${centerX - 80} ${faceY + 80} Q ${centerX - 100} ${faceY + 60} ${centerX - 70} ${faceY + 100}`}
              fill="#FFF"
              stroke="#E0E0E0"
              strokeWidth="2"
              opacity={0.9}
            />
            {/* Right wing */}
            <Path
              d={`M ${centerX + 150} ${faceY + 50} Q ${centerX + 120} ${faceY + 20} ${centerX + 90} ${faceY + 60} Q ${centerX + 110} ${faceY + 40} ${centerX + 80} ${faceY + 80} Q ${centerX + 100} ${faceY + 60} ${centerX + 70} ${faceY + 100}`}
              fill="#FFF"
              stroke="#E0E0E0"
              strokeWidth="2"
              opacity={0.9}
            />
          </Svg>
        </Animated.View>
      );

    case 'sunglasses':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: bounceAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            {/* Left lens */}
            <Rect x={centerX - 75} y={faceY - 20} width="50" height="35" rx="10" fill="#000" stroke="#333" strokeWidth="3" />
            {/* Right lens */}
            <Rect x={centerX + 25} y={faceY - 20} width="50" height="35" rx="10" fill="#000" stroke="#333" strokeWidth="3" />
            {/* Bridge */}
            <Rect x={centerX - 15} y={faceY - 15} width="30" height="5" fill="#333" />
            {/* Shine effect */}
            <Rect x={centerX - 65} y={faceY - 15} width="15" height="8" rx="4" fill="#FFF" opacity={0.3} />
            <Rect x={centerX + 35} y={faceY - 15} width="15" height="8" rx="4" fill="#FFF" opacity={0.3} />
          </Svg>
        </Animated.View>
      );

    case 'money_rain':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: floatAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 100} y={-50} fontSize="50">💵</SvgText>
            <SvgText x={centerX - 30} y={-20} fontSize="50">💸</SvgText>
            <SvgText x={centerX + 50} y={-80} fontSize="50">💰</SvgText>
            <SvgText x={centerX + 120} y={-40} fontSize="50">💵</SvgText>
            <SvgText x={centerX - 70} y={-100} fontSize="50">💸</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'neon_glow':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ rotate }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF00FF" stopOpacity="0.8" />
                <Stop offset="33%" stopColor="#00FFFF" stopOpacity="0.8" />
                <Stop offset="66%" stopColor="#FFFF00" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#FF00FF" stopOpacity="0.8" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={centerX} cy={faceY} r="140" fill="none" stroke="url(#neonGrad)" strokeWidth="8" />
            <Circle cx={centerX} cy={faceY} r="150" fill="none" stroke="url(#neonGrad)" strokeWidth="4" opacity={0.5} />
          </Svg>
        </Animated.View>
      );

    case 'galaxy':
      return (
        <Animated.View style={[styles.overlayContainer, { opacity: twinkleAnim }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 100} y={faceY - 80} fontSize="40">🌟</SvgText>
            <SvgText x={centerX + 90} y={faceY - 60} fontSize="45">✨</SvgText>
            <SvgText x={centerX - 110} y={faceY + 100} fontSize="40">🌙</SvgText>
            <SvgText x={centerX + 100} y={faceY + 80} fontSize="50">⭐</SvgText>
            <SvgText x={centerX} y={topY - 40} fontSize="60">🌌</SvgText>
            <SvgText x={centerX - 60} y={faceY - 50} fontSize="35">💫</SvgText>
            <SvgText x={centerX + 60} y={faceY + 40} fontSize="35">💫</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'hearts_everywhere':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 100} y={faceY - 80} fontSize="45">💖</SvgText>
            <SvgText x={centerX + 90} y={faceY - 70} fontSize="50">💗</SvgText>
            <SvgText x={centerX - 110} y={faceY + 100} fontSize="45">💕</SvgText>
            <SvgText x={centerX + 100} y={faceY + 90} fontSize="50">💓</SvgText>
            <SvgText x={centerX} y={topY - 40} fontSize="55">💝</SvgText>
            <SvgText x={centerX - 60} y={faceY + 20} fontSize="40">💞</SvgText>
            <SvgText x={centerX + 60} y={faceY + 30} fontSize="40">💘</SvgText>
            <SvgText x={centerX - 30} y={bottomY} fontSize="45">💕</SvgText>
            <SvgText x={centerX + 40} y={bottomY + 20} fontSize="45">💖</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'confetti':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: floatAnim }] }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 110} y={-40} fontSize="45">🎊</SvgText>
            <SvgText x={centerX - 40} y={-10} fontSize="50">🎉</SvgText>
            <SvgText x={centerX + 40} y={-70} fontSize="45">🎊</SvgText>
            <SvgText x={centerX + 100} y={-30} fontSize="50">🎉</SvgText>
            <SvgText x={centerX - 80} y={-90} fontSize="45">🎊</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'diamond_rain':
      return (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: floatAnim }], opacity: twinkleAnim }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 100} y={-50} fontSize="50">💎</SvgText>
            <SvgText x={centerX - 30} y={-20} fontSize="45">💎</SvgText>
            <SvgText x={centerX + 50} y={-80} fontSize="50">💎</SvgText>
            <SvgText x={centerX + 120} y={-40} fontSize="45">💎</SvgText>
            <SvgText x={centerX - 70} y={-100} fontSize="50">💎</SvgText>
          </Svg>
        </Animated.View>
      );

    case 'sparkles':
      return (
        <Animated.View style={[styles.overlayContainer, { opacity: twinkleAnim }]}>
          <Svg width="100%" height="100%" style={styles.svg}>
            <SvgText x={centerX - 110} y={faceY - 90} fontSize="55">✨</SvgText>
            <SvgText x={centerX + 100} y={faceY - 80} fontSize="60">✨</SvgText>
            <SvgText x={centerX - 120} y={faceY + 110} fontSize="50">✨</SvgText>
            <SvgText x={centerX + 110} y={faceY + 100} fontSize="55">✨</SvgText>
            <SvgText x={centerX} y={topY - 50} fontSize="65">✨</SvgText>
            <SvgText x={centerX - 70} y={faceY - 30} fontSize="45">✨</SvgText>
            <SvgText x={centerX + 70} y={faceY + 50} fontSize="45">✨</SvgText>
            <SvgText x={centerX - 40} y={bottomY + 30} fontSize="50">✨</SvgText>
            <SvgText x={centerX + 50} y={bottomY + 40} fontSize="50">✨</SvgText>
          </Svg>
        </Animated.View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  recordingTimer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterPicker: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(6,182,212,0.3)',
    borderColor: COLORS.cyan400,
  },
  filterEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  filterButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.cyan400,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  spacer: {
    flex: 1,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255,0,0,0.3)',
    borderColor: '#FF0000',
  },
  recordCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF0000',
  },
  recordingIndicator: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingSquare: {
    width: 30,
    height: 30,
    backgroundColor: '#FF0000',
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.slate300,
    marginTop: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideo: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: COLORS.green600,
  },
  shareButton: {
    backgroundColor: COLORS.cyan500,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  discardButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate300,
  },
});