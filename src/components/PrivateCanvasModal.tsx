import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';

interface PrivateCanvasModalProps {
  visible: boolean;
  canvasTitle: string;
  creatorUsername: string;
  onRequestAccess: () => void;
  onEnterCode: (code: string) => void;
  onClose: () => void;
}

const PrivateCanvasModal: React.FC<PrivateCanvasModalProps> = ({
  visible,
  canvasTitle,
  creatorUsername,
  onRequestAccess,
  onEnterCode,
  onClose,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleRequestAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRequestAccess();
  };

  const handleSubmitCode = () => {
    if (!inviteCode.trim()) {
      Alert.alert('Enter Code', 'Please enter an invite code');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnterCode(inviteCode.trim().toUpperCase());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient
            colors={[COLORS.purple600, COLORS.pink600]}
            style={styles.iconContainer}
          >
            <Icon name="lock-closed" size={40} color={COLORS.white} />
          </LinearGradient>

          <Text style={styles.title}>Private Canvas</Text>
          <Text style={styles.subtitle}>
            "{canvasTitle}" by {creatorUsername}
          </Text>
          <Text style={styles.description}>
            This canvas is private. Request access from the creator or enter an invite code.
          </Text>

          {!showCodeInput ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRequestAccess}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.cyan500, COLORS.indigo600]}
                  style={styles.buttonGradient}
                >
                  <Icon name="hand-right" size={20} color={COLORS.white} />
                  <Text style={styles.buttonText}>Request Access</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowCodeInput(true)}
                activeOpacity={0.7}
              >
                <Icon name="key-outline" size={18} color={COLORS.cyan400} />
                <Text style={styles.secondaryButtonText}>I Have a Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                placeholderTextColor={COLORS.slate500}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={8}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmitCode}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.cyan500, COLORS.indigo600]}
                  style={styles.buttonGradient}
                >
                  <Icon name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.buttonText}>Submit Code</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowCodeInput(false);
                  setInviteCode('');
                }}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back-outline" size={18} color={COLORS.cyan400} />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close-circle" size={24} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modal: {
    width: '85%',
    backgroundColor: COLORS.slate800,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.cyan400,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.slate700,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.slate600,
    letterSpacing: 2,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

export default PrivateCanvasModal;
