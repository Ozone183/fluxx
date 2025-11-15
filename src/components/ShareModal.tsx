import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { Share } from 'react-native';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  canvasTitle: string;
  canvasId: string;
  inviteCode?: string;
  isPrivate: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  canvasTitle,
  canvasId,
  inviteCode,
  isPrivate,
}) => {
  const deepLink = `fluxx://canvas/${canvasId}`;

  const handleCopyLink = () => {
    Clipboard.setString(deepLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('📋 Copied!', 'Link copied! Share it anywhere and users can tap to open in Fluxx app.');
    onClose();
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('📋 Code Copied!', `Invite code: ${inviteCode}`);
  };

  const handleShareText = async () => {
    const message = isPrivate && inviteCode
      ? `🎨 Join my private canvas "${canvasTitle}" on Fluxx!\n\n🔒 Invite Code: ${inviteCode}\n\n📱 Install Fluxx and use this code to access!`
      : `🎨 Check out my canvas "${canvasTitle}" on Fluxx!\n\n📱 Download Fluxx app to view!`;

    await Share.share({
      message,
      title: `Join "${canvasTitle}" on Fluxx`,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Canvas</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>"{canvasTitle}"</Text>

          {/* Copy Link Button */}
          <TouchableOpacity style={styles.optionButton} onPress={handleCopyLink} activeOpacity={0.8}>
            <LinearGradient colors={[COLORS.cyan500, COLORS.indigo600]} style={styles.buttonGradient}>
              <Icon name="link-outline" size={24} color={COLORS.white} />
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitle}>Copy Link</Text>
                <Text style={styles.buttonSubtitle}>Share clickable link anywhere</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Copy Invite Code (Private Only) */}
          {isPrivate && inviteCode && (
            <TouchableOpacity style={styles.optionButton} onPress={handleCopyCode} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.purple500, COLORS.pink600]} style={styles.buttonGradient}>
                <Icon name="key-outline" size={24} color={COLORS.white} />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonTitle}>Copy Invite Code</Text>
                  <Text style={styles.buttonSubtitle}>{inviteCode}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Share Text */}
          <TouchableOpacity style={styles.optionButton} onPress={handleShareText} activeOpacity={0.8}>
            <View style={styles.buttonSecondary}>
              <Icon name="paper-plane-outline" size={24} color={COLORS.cyan400} />
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitleSecondary}>Share Message</Text>
                <Text style={styles.buttonSubtitleSecondary}>Send via messaging apps</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.cyan400,
    marginBottom: 24,
  },
  optionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    backgroundColor: COLORS.slate700,
    borderRadius: 16,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  buttonTitleSecondary: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  buttonSubtitleSecondary: {
    fontSize: 14,
    color: COLORS.slate400,
  },
});

export default ShareModal;
