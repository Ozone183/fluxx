import { Alert } from 'react-native';

interface VideoAsset {
  uri: string;
  duration?: number;
  width?: number;
  height?: number;
}

interface VideoValidationResult {
  isValid: boolean;
  durationSeconds?: number;
}

/**
 * Validates video file size and duration
 * Gets duration from ImagePicker asset (works for HEVC!)
 */
export const validateVideoWithAsset = async (
  uri: string,
  assetInfo: VideoAsset | undefined,
  maxSize: number,
  maxDuration: number
): Promise<VideoValidationResult> => {
  try {
    // Get file size
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeInMB = blob.size / (1024 * 1024);

    console.log('📹 Video validation:', {
      size: sizeInMB.toFixed(2) + 'MB',
      duration: assetInfo?.duration ? (assetInfo.duration / 1000).toFixed(2) + 's' : 'unknown',
    });

    // Check file size
    if (sizeInMB > maxSize) {
      Alert.alert(
        'Video Too Large',
        `Please select a video smaller than ${maxSize}MB. Your video is ${sizeInMB.toFixed(1)}MB.`,
        [{ text: 'OK' }]
      );
      return { isValid: false };
    }

    // Check duration from ImagePicker (more reliable than Video component)
    if (assetInfo?.duration) {
      const durationSeconds = assetInfo.duration / 1000; // Convert ms to seconds
      
      if (durationSeconds > maxDuration) {
        Alert.alert(
          'Video Too Long',
          `Please select a video shorter than ${Math.floor(maxDuration / 60)} minutes. Your video is ${Math.floor(durationSeconds / 60)}:${Math.floor(durationSeconds % 60).toString().padStart(2, '0')}.`,
          [{ text: 'OK' }]
        );
        return { isValid: false };
      }
      
      console.log('✅ Duration from ImagePicker:', durationSeconds.toFixed(2) + 's');
      return { isValid: true, durationSeconds };
    }

    // If no duration from ImagePicker, still allow (Video component will try)
    return { isValid: true };
  } catch (error) {
    console.error('❌ Error validating video:', error);
    // Allow if validation fails (don't block user)
    return { isValid: true };
  }
};

/**
 * Enhanced playback status handler
 * Handles HEVC videos gracefully (logs error but doesn't fail)
 */
export const handleVideoPlaybackStatus = (
  status: any,
  currentDuration: number,
  onDurationUpdate: (duration: number) => void
) => {
  console.log('📹 Video playback status:', {
    isLoaded: status.isLoaded,
    durationMillis: status.durationMillis,
    hasError: !!status.error,
  });
  
  if (status.isLoaded && status.durationMillis) {
    const durationSeconds = status.durationMillis / 1000;
    
    // Only update if we don't already have duration from ImagePicker
    if (currentDuration === 0) {
      console.log('✅ Duration from Video component:', durationSeconds.toFixed(2) + 's');
      onDurationUpdate(durationSeconds);
    }
  } else if (status.error) {
    console.warn('⚠️ Video playback error (possibly HEVC codec issue):', status.error);
    // Don't fail - we might already have duration from ImagePicker
  }
};
