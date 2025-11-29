// src/components/CreateModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreatePost: () => void;
  onCreateCanvas: () => void;
  onCreateVideo?: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onCreatePost,
  onCreateCanvas,
  onCreateVideo,
}) => {
  const navigation = useNavigation();

  const handleCreatePost = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onCreatePost();
  };

  const handleCreateCanvas = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onCreateCanvas();
  };

  const handleCreateVideo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onCreateVideo) {
      onCreateVideo();
    } else {
      (navigation as any).navigate('CreateVideoPost');
    }
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    (navigation as any).navigate('MainTabs', { screen: 'Feed' });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <Text style={styles.title}>Create Something Amazing</Text>
                <Text style={styles.subtitle}>
                  Share your creativity with the world
                </Text>
              </View>

              {/* Create Options */}
              <View style={styles.optionsContainer}>
                {/* Create Post */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleCreatePost}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.purple500 }]}>
                    <Ionicons name="image-outline" size={28} color={COLORS.white} />
                  </View>

                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Create Post</Text>
                    <Text style={styles.optionDescription}>
                      Share photos, thoughts, or moments with your followers
                    </Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.slate400} />
                  </View>
                </TouchableOpacity>

                {/* Create Canvas */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleCreateCanvas}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.cyan500 }]}>
                    <Ionicons name="color-palette-outline" size={28} color={COLORS.white} />
                  </View>

                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Create Canvas</Text>
                    <Text style={styles.optionDescription}>
                      Start a collaborative art project that others can join
                    </Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.slate400} />
                  </View>
                </TouchableOpacity>

                {/* Create Video Post */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleCreateVideo}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.amber400 }]}>
                    <Ionicons name="videocam-outline" size={28} color={COLORS.white} />
                  </View>

                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Create Video Post</Text>
                    <Text style={styles.optionDescription}>
                      Record or upload a video to share with your followers
                    </Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.slate400} />
                  </View>
                </TouchableOpacity>

                {/* AR Camera */}
                <TouchableOpacity
                  style={styles.option}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onClose();
                    (navigation as any).navigate('ARCamera');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: COLORS.pink500 }]}>
                    <Ionicons name="sparkles-outline" size={28} color={COLORS.white} />
                  </View>

                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>AR Camera</Text>
                    <Text style={styles.optionDescription}>
                      Create videos with fun AR filters and effects
                    </Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.slate400} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Feature Highlights */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Why create on Fluxx?</Text>

                <View style={styles.feature}>
                  <Ionicons name="people-outline" size={16} color={COLORS.cyan400} />
                  <Text style={styles.featureText}>
                    Collaborate with creators worldwide
                  </Text>
                </View>

                <View style={styles.feature}>
                  <Ionicons name="sparkles-outline" size={16} color={COLORS.amber400} />
                  <Text style={styles.featureText}>
                    Express creativity through ephemeral art
                  </Text>
                </View>

                <View style={styles.feature}>
                  <Ionicons name="share-outline" size={16} color={COLORS.green600} />
                  <Text style={styles.featureText}>
                    Share your creations across all platforms
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',  // Change from 'flex-end' to 'center'
  },
  modalContainer: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.slate600,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.slate400,
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.slate300,
    flex: 1,
  },
  closeButton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate400,
  },
});

export default CreateModal;
