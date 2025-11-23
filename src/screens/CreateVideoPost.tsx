import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { uploadVideo, generateThumbnail } from '../services/videoStorage';
import { createVideoPost } from '../services/postsApi-video';
import { awardTokens } from '../utils/tokens';
import TokenToast from '../components/TokenToast';
import VideoPicker from '../components/VideoPicker';

export default function CreateVideoPostScreen() {
  const navigation = useNavigation();
  const { userId, userChannel, userProfilePic } = useAuth();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTokenToast, setShowTokenToast] = useState(false);

  const videoRef = useRef<Video>(null);

  const handleVideoSelected = (uri: string, duration: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVideoUri(uri);
    setVideoDuration(duration);
  };

  const handleRemoveVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVideoUri(null);
    setVideoDuration(0);
  };

  const handlePost = async () => {
    if (!videoUri || !userId) {
      Alert.alert('Error', 'Please select a video and make sure you are logged in.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate thumbnail
      const thumbnailUri = await generateThumbnail(videoUri);

      // Upload video and thumbnail
      const { videoUrl, thumbnailUrl } = await uploadVideo(
        videoUri,
        thumbnailUri,
        userId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Create post in Firestore
      await createVideoPost({
        userId: userId,
        username: userChannel || 'Anonymous',
        userAvatar: userProfilePic || '',
        caption: caption.trim(),
        videoUrl,
        thumbnailUrl,
        duration: videoDuration,
        isProcessing: true,  // ← ADD THIS LINE
      });

      // Award tokens for creating post
      if (userId) {
        await awardTokens({
          userId,
          amount: 8,
          type: 'post',
          description: 'Video post created'
        });
      }
      
      // Show token toast
      setShowTokenToast(true);
      setTimeout(() => setShowTokenToast(false), 3000);

      // Navigate back to feed
      setTimeout(() => {
        (navigation as any).navigate('MainTabs', { screen: 'Feed' });
      }, 1000);
    } catch (error) {
      console.error('Error posting video:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to post your video. Please check your internet connection and try again.'
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (videoUri) {
      Alert.alert(
        'Discard Video?',
        'Are you sure you want to discard this video?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => (navigation as any).navigate('MainTabs', { screen: 'Feed' }),
          },
        ]
      );
    } else {
      (navigation as any).navigate('MainTabs', { screen: 'Feed' });
    }
  };

  // Intercept hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleCancel();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [videoUri])
  );

  // Intercept hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleCancel();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [videoUri])
  );

 {/* // Stop video preview when leaving screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup: stop video when leaving screen
        if (videoRef.current) {
          videoRef.current.stopAsync();
        }
      };
    }, [])
  ); */}

  if (isUploading) {
    return (
      <SafeAreaView style={styles.uploadingContainer}>
        <View style={styles.uploadingContent}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.uploadingTitle}>Uploading Your Video...</Text>
          <Text style={styles.uploadingSubtitle}>
            This may take a few moments
          </Text>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
          </View>

          <Text style={styles.uploadingNote}>
            Please don't close the app while uploading
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!videoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Video Post</Text>
          <View style={styles.headerButton} />
        </View>

        <VideoPicker onVideoSelected={handleVideoSelected} />

        {showTokenToast && (
          <TokenToast
            visible={showTokenToast}
            amount={8}
            message="Video posted!"
            onHide={() => setShowTokenToast(false)}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Video Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={styles.headerButton}
          >
            <Text style={styles.postButton}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
            
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={handleRemoveVideo}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.danger}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.removeVideoGradient}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.removeVideoText}>Remove Video</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.videoDurationBadge}>
              <Ionicons name="time-outline" size={16} color="#FFFFFF" />
              <Text style={styles.videoDurationText}>
                {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          <View style={styles.captionSection}>
            <Text style={styles.sectionLabel}>Caption</Text>
            <View style={styles.captionInputContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="What's happening in your video?"
                placeholderTextColor={COLORS.slate400}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                autoFocus={false}
              />
              <Text style={styles.characterCount}>{caption.length}/500</Text>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.cyan400} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for Great Video Posts</Text>
              <Text style={styles.tipsText}>
                • Keep it engaging and authentic{'\n'}
                • Add a descriptive caption{'\n'}
                • Good lighting makes a difference{'\n'}
                • Vertical videos work best
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handlePost}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postButtonGradient}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
              <Text style={styles.postButtonText}>Post Video</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showTokenToast && (
          <TokenToast
            visible={showTokenToast}
            amount={8}
            message="Video posted!"
            onHide={() => setShowTokenToast(false)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,  // ✅ Add top padding to push below status bar
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  postButtonDisabled: {
    color: COLORS.slate600,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    position: 'relative',
    marginTop: 16,
    marginHorizontal: 16,
  },
  videoPreview: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  removeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeVideoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  removeVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  videoDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  captionSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  captionInputContainer: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'right',
    marginTop: 8,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.cyan400 + '30',
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.slate300,
    lineHeight: 20,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 60,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
    backgroundColor: COLORS.slate900,
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  uploadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  uploadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  uploadingSubtitle: {
    fontSize: 16,
    color: COLORS.slate400,
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.slate800,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  uploadingNote: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 24,
  },
});