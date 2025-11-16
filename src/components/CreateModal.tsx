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
}

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onCreatePost,
  onCreateCanvas,
}) => {
  const navigation = useNavigation();

  const handleCreatePost = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Close modal first, then navigate
    onClose();
    // Small delay to let modal animation finish
    setTimeout(() => {
      onCreatePost();
    }, 100);
  };

  const handleCreateCanvas = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Close modal first, then navigate
    onClose();
    // Small delay to let modal animation finish
    setTimeout(() => {
      onCreateCanvas();
    }, 100);
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Force navigation back to ensure we're on a valid screen
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Handle */}
              <View style={styles.handle} />
              
              {/* Header - REDUCED PADDING */}
              <View style={styles.header}>
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
              </View>

              {/* Feature Highlights - REDUCED PADDING */}
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 150,
    maxHeight: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.slate600,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,        // ← Change from 12 to 8
    marginBottom: 20,    // ← Change from 16 to 12
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,       // ← Add this line
    paddingBottom: 16,   // ← Change from 20 to 16
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
    paddingTop: 20, // Reduced from 32
    paddingBottom: 20, // Reduced from 24
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12, // Reduced from 16
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 12
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