import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import * as Haptics from 'expo-haptics';

interface DailyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  tokensEarned: number;
  streak: number;
}

const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  visible,
  onClose,
  tokensEarned,
  streak,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.gradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* Coin Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={64} color={COLORS.yellow400} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Daily Check-In!</Text>

            {/* Tokens Earned */}
            <View style={styles.tokensContainer}>
              <Text style={styles.tokensAmount}>+{tokensEarned}</Text>
              <Ionicons name="diamond" size={32} color={COLORS.yellow400} />
            </View>

            {/* Streak Info */}
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={20} color={COLORS.orange500} />
              <Text style={styles.streakText}>
                {streak} Day Streak!
              </Text>
            </View>

            {/* Streak Bonus Message */}
            {streak % 7 === 0 && streak > 0 && (
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusText}>
                  🎉 Streak Bonus! +25 tokens
                </Text>
              </View>
            )}

            {/* Next Milestone */}
            {streak % 7 !== 0 && (
              <Text style={styles.nextMilestone}>
                {7 - (streak % 7)} days until streak bonus!
              </Text>
            )}

            {/* Claim Button */}
            <TouchableOpacity
              style={styles.claimButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.claimButtonText}>Claim Tokens! 🎉</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  tokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tokensAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.yellow400,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  bonusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.yellow400,
    textAlign: 'center',
  },
  nextMilestone: {
    fontSize: 13,
    color: COLORS.slate300,
    marginBottom: 24,
    textAlign: 'center',
  },
  claimButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.indigo600,
  },
});

export default DailyCheckInModal;
