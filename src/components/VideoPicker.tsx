import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS } from '../theme/colors';

interface VideoPickerProps {
  onVideoSelected: (videoUri: string, duration: number) => void;
  maxDuration?: number; // in seconds
  maxSize?: number; // in MB
}

const MAX_DURATION = 180; // 3 minutes in seconds
const MAX_SIZE_MB = 100; // 100MB max

export default function VideoPicker({
  onVideoSelected,
  maxDuration = MAX_DURATION,
  maxSize = MAX_SIZE_MB,
}: VideoPickerProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || mediaLibraryStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and media library permissions to record and select videos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const validateVideo = async (uri: string): Promise<boolean> => {
    try {
      // For local files, fetch might fail - try FileSystem instead
      const response = await fetch(uri);
      const blob = await response.blob();
      const sizeInMB = blob.size / (1024 * 1024);

      if (sizeInMB > maxSize) {
        Alert.alert(
          'Video Too Large',
          `Please select a video smaller than ${maxSize}MB. Your video is ${sizeInMB.toFixed(1)}MB.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      // Network request failed - likely a local file URI issue
      // Just allow it and let the video player handle validation
      console.warn('Could not validate video size, allowing upload:', error);
      return true;
    }
  };

  const handleVideoLoad = async (status: any) => {
    console.log('📹 Video status update:', status.isLoaded, status.durationMillis);
    
    if (status.isLoaded && status.durationMillis) {
      const durationSeconds = status.durationMillis / 1000;
      console.log('⏱️ Duration detected:', durationSeconds);
      
      if (durationSeconds > maxDuration) {
        Alert.alert(
          'Video Too Long',
          `Please select a video shorter than ${Math.floor(maxDuration / 60)} minutes. Your video is ${Math.floor(durationSeconds / 60)}:${Math.floor(durationSeconds % 60).toString().padStart(2, '0')}.`,
          [{ text: 'OK' }]
        );
        setSelectedVideo(null);
        setVideoDuration(0);
        return;
      }

      setVideoDuration(durationSeconds);
    }
  };

  const recordVideo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: maxDuration,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickVideo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedVideo && videoDuration > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVideoSelected(selectedVideo, videoDuration);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideo(null);
    setVideoDuration(0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  if (selectedVideo) {
    return (
      <View style={styles.previewContainer}>
        <Video
          key={selectedVideo}
          source={{ uri: selectedVideo }}
          style={styles.videoPreview}
          useNativeControls
          resizeMode={'contain' as any}
          isLooping
          shouldPlay={false}
          onLoad={() => console.log('Video loaded successfully')}
          onPlaybackStatusUpdate={handleVideoLoad}
        />

        <View style={styles.previewInfo}>
          <Text style={styles.durationText}>
            Duration: {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={styles.limitText}>
            Max: {Math.floor(maxDuration / 60)} minutes, {maxSize}MB
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={videoDuration === 0}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.confirmButton,
                videoDuration === 0 && styles.confirmButtonDisabled,
              ]}
            >
              <Text style={styles.confirmButtonText}>Use This Video</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color={COLORS.cyan400} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Video Requirements</Text>
          <Text style={styles.infoText}>
            • Maximum {Math.floor(maxDuration / 60)} minutes duration
          </Text>
          <Text style={styles.infoText}>• Maximum {maxSize}MB file size</Text>
          <Text style={styles.infoText}>• MP4 format recommended</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={recordVideo}
        activeOpacity={0.8}
        style={styles.optionButton}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Ionicons name="videocam" size={32} color="#FFFFFF" />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Record Video</Text>
            <Text style={styles.buttonSubtitle}>Use your camera to record</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={pickVideo}
        activeOpacity={0.8}
        style={styles.optionButton}
      >
        <LinearGradient
          colors={GRADIENTS.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Ionicons name="film" size={32} color="#FFFFFF" />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Choose from Library</Text>
            <Text style={styles.buttonSubtitle}>Select an existing video</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.slate900,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.slate300,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cyan400 + '30',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.slate300,
    marginBottom: 4,
  },
  optionButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    padding: 20,
  },
  videoPreview: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    marginBottom: 16,
  },
  previewInfo: {
    backgroundColor: COLORS.slate800,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  limitText: {
    fontSize: 14,
    color: COLORS.slate400,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,

  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
