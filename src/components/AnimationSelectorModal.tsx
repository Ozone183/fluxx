import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface AnimationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAnimation: (animationType: string) => void;
  currentAnimation?: string;
}

const ANIMATIONS = [
  { type: 'none', name: 'None', icon: 'close-circle-outline', color: COLORS.slate400 },
  { type: 'fadeIn', name: 'Fade In', icon: 'eye-outline', color: COLORS.cyan400 },
  { type: 'fadeOut', name: 'Fade Out', icon: 'eye-off-outline', color: COLORS.cyan400 },
  { type: 'slideLeft', name: 'Slide Left', icon: 'arrow-back-outline', color: COLORS.purple400 },
  { type: 'slideRight', name: 'Slide Right', icon: 'arrow-forward-outline', color: COLORS.purple400 },
  { type: 'slideUp', name: 'Slide Up', icon: 'arrow-up-outline', color: COLORS.amber400 },
  { type: 'slideDown', name: 'Slide Down', icon: 'arrow-down-outline', color: COLORS.amber400 },
  { type: 'scaleIn', name: 'Scale In', icon: 'expand-outline', color: COLORS.green400 },
  { type: 'scaleOut', name: 'Scale Out', icon: 'contract-outline', color: COLORS.green400 },
  { type: 'bounce', name: 'Bounce', icon: 'basketball-outline', color: COLORS.orange400 },
  { type: 'rotate', name: 'Rotate', icon: 'refresh-outline', color: COLORS.pink400 },
  { type: 'pulse', name: 'Pulse', icon: 'heart-outline', color: COLORS.red400 },
];

const AnimationSelectorModal: React.FC<AnimationSelectorModalProps> = ({
  visible,
  onClose,
  onSelectAnimation,
  currentAnimation = 'none',
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Animation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {ANIMATIONS.map((anim) => (
                <TouchableOpacity
                  key={anim.type}
                  style={[
                    styles.animCard,
                    currentAnimation === anim.type && styles.animCardActive,
                  ]}
                  onPress={() => {
                    onSelectAnimation(anim.type);
                    onClose();
                  }}
                >
                  <Ionicons name={anim.icon as any} size={32} color={anim.color} />
                  <Text style={styles.animName}>{anim.name}</Text>
                  {currentAnimation === anim.type && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.cyan400} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
  container: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  animCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  animCardActive: {
    borderColor: COLORS.cyan400,
    backgroundColor: COLORS.slate700,
  },
  animName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 8,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default AnimationSelectorModal;
