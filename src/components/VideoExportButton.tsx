import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { COLORS } from '../theme/colors';
import * as Haptics from 'expo-haptics';

interface VideoExportButtonProps {
  canvasId: string;
  canvasTitle: string;
  canvasRef: any;
}

const VideoExportButton: React.FC<VideoExportButtonProps> = ({
  canvasId,
  canvasTitle,
  canvasRef,
}) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const FRAME_RATE = 30;
  const DURATION = 5;
  const TOTAL_FRAMES = FRAME_RATE * DURATION; // 150 frames

  const handleExport = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExporting(true);
      setProgress(0);
      setStatusMessage('Preparing...');

      // Step 1: Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to save videos.'
        );
        setExporting(false);
        return;
      }

      setStatusMessage('Capturing canvas...');
      setProgress(5);

      // Step 2: Capture canvas
      if (!canvasRef.current) {
        Alert.alert('Error', 'Canvas not ready for export');
        setExporting(false);
        return;
      }

      const canvasUri = await captureRef(canvasRef, {
        format: 'jpg',
        quality: 1,
      });

      setProgress(15);
      setStatusMessage('Uploading canvas...');

      console.log('🚨🚨🚨 NEW CODE IS RUNNING - SINGLE CANVAS UPLOAD 🚨🚨🚨');

      // Step 3: Upload just ONE canvas image
      console.log('📤 Fetching canvas blob...');
      const response = await fetch(canvasUri);
      const canvasBlob = await response.blob();
      console.log(`✅ Canvas blob size: ${(canvasBlob.size / 1024 / 1024).toFixed(2)} MB`);

      setProgress(30);
      const singleFramePath = `video-exports/${canvasId}/canvas.jpg`;
      const singleFrameRef = storageRef(storage, singleFramePath);

      console.log('📤 Uploading to Firebase Storage...');
      await uploadBytes(singleFrameRef, canvasBlob);

      console.log('✅ Canvas uploaded!');
      setProgress(50);

      setStatusMessage('Processing video...');
      setProgress(55);

      // Step 4: Call Cloud Function (this can take 2-3 minutes)
      console.log('☁️ Calling Cloud Function to process video...');
      const processVideo = httpsCallable(functions, 'processVideo');

      // Increase timeout to 10 minutes
      const result = await processVideo({
        canvasId,
        frameCount: TOTAL_FRAMES,
        musicUrl: null,
      });

      setProgress(85);

      const { videoUrl } = result.data as { videoUrl: string };

      if (!videoUrl) {
        throw new Error('Video processing failed');
      }

      setProgress(90);
      setStatusMessage('Downloading video...');

      // Step 5: Download video using NEW Expo SDK 54 API
      const sanitizedTitle = canvasTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const videoFile = await File.downloadFileAsync(
        videoUrl,
        new File(Paths.cache, `${sanitizedTitle}_${Date.now()}.mp4`)
      );

      // Step 6: Save to Camera Roll
      const asset = await MediaLibrary.createAssetAsync(videoFile.uri);

      // Try to create Fluxx album
      try {
        const album = await MediaLibrary.getAlbumAsync('Fluxx');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Fluxx', asset, false);
        }
      } catch (albumError) {
        console.log('Album creation skipped:', albumError);
      }

      setProgress(100);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '🎬 Video Exported!',
        `"${canvasTitle}" has been saved to your Camera Roll as a 5-second video.`,
        [{ text: 'Awesome!' }]
      );

      setExporting(false);
    } catch (error) {
      console.error('Video export error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Export Failed',
        `Could not export video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setExporting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={COLORS.cyan400} />
        ) : (
          <Ionicons name="videocam-outline" size={22} color={COLORS.purple400} />
        )}
      </TouchableOpacity>

      <Modal visible={exporting} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="film-outline" size={48} color={COLORS.cyan400} />
            <Text style={styles.modalTitle}>Exporting Video</Text>
            <Text style={styles.statusText}>{statusMessage}</Text>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.progressText}>{Math.round(progress)}%</Text>

            <Text style={styles.warningText}>
              Creating a 5-second video preview...
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.slate900,
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.cyan400,
    marginBottom: 20,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.slate800,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.cyan500,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
  },
});

export default VideoExportButton;