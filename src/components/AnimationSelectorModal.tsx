import React, { useState } from 'react';
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

interface AnimationConfig {
  type: string;
  duration: number;
  delay: number;
  loop: boolean;
}

interface AnimationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAnimation: (config: AnimationConfig) => void;
  currentAnimation?: AnimationConfig;
  isDrawingLayer?: boolean; // 👈 NEW PROP
}

const ANIMATIONS = [
  { type: 'none', name: 'None', icon: 'close-circle-outline', color: COLORS.slate400, category: 'general' },
  { type: 'fadeIn', name: 'Fade In', icon: 'eye-outline', color: COLORS.cyan400, category: 'general' },
  { type: 'fadeOut', name: 'Fade Out', icon: 'eye-off-outline', color: COLORS.cyan400, category: 'general' },
  { type: 'slideLeft', name: 'Slide Left', icon: 'arrow-back-outline', color: COLORS.purple400, category: 'general' },
  { type: 'slideRight', name: 'Slide Right', icon: 'arrow-forward-outline', color: COLORS.purple400, category: 'general' },
  { type: 'slideUp', name: 'Slide Up', icon: 'arrow-up-outline', color: COLORS.amber400, category: 'general' },
  { type: 'slideDown', name: 'Slide Down', icon: 'arrow-down-outline', color: COLORS.amber400, category: 'general' },
  { type: 'scaleIn', name: 'Scale In', icon: 'expand-outline', color: COLORS.green600, category: 'general' },
  { type: 'scaleOut', name: 'Scale Out', icon: 'contract-outline', color: COLORS.green600, category: 'general' },
  { type: 'bounce', name: 'Bounce', icon: 'basketball-outline', color: COLORS.amber400, category: 'general' },
  { type: 'rotate', name: 'Rotate', icon: 'refresh-outline', color: COLORS.pink600, category: 'general' },
  { type: 'pulse', name: 'Pulse', icon: 'heart-outline', color: COLORS.red400, category: 'general' },
  // Drawing-specific animations
  { type: 'drawReveal', name: 'Draw Reveal', icon: 'brush-outline', color: COLORS.amber400, category: 'drawing' },
  { type: 'sketchFade', name: 'Sketch Fade', icon: 'create-outline', color: COLORS.cyan400, category: 'drawing' },
  { type: 'watercolorBloom', name: 'Watercolor', icon: 'water-outline', color: COLORS.purple400, category: 'drawing' },
  { type: 'pencilTexture', name: 'Pencil', icon: 'pencil-outline', color: COLORS.slate400, category: 'drawing' },
];

const SPEED_PRESETS = [
  { label: '⚡ Fast', value: 500, icon: 'flash' },
  { label: '→ Normal', value: 1000, icon: 'remove' },
  { label: '🐌 Slow', value: 2000, icon: 'hourglass' },
];

const DELAY_PRESETS = [
  { label: 'None', value: 0, icon: 'play' },
  { label: 'Short', value: 300, icon: 'time' },
  { label: 'Long', value: 1000, icon: 'timer' },
];

const AnimationSelectorModal: React.FC<AnimationSelectorModalProps> = ({
  visible,
  onClose,
  onSelectAnimation,
  currentAnimation,
  isDrawingLayer = false, // 👈 NEW PROP
}) => {
  const [selectedType, setSelectedType] = useState(currentAnimation?.type || 'none');
  const [duration, setDuration] = useState(currentAnimation?.duration || 1000);
  const [delay, setDelay] = useState(currentAnimation?.delay || 0);
  const [loop, setLoop] = useState(currentAnimation?.loop || false);

  const handleApply = () => {
    if (selectedType === 'none') {
      // No timing controls for "none"
      onSelectAnimation({
        type: 'none',
        duration: 0,
        delay: 0,
        loop: false,
      });
    } else {
      onSelectAnimation({
        type: selectedType,
        duration,
        delay,
        loop,
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Animation Controls</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Step 1: Select Animation Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Choose Animation</Text>
              <View style={styles.grid}>
                {ANIMATIONS
                  .filter(anim => 
                    anim.category === 'general' || 
                    (anim.category === 'drawing' && isDrawingLayer)
                  )
                  .map((anim) => (
                  <TouchableOpacity
                    key={anim.type}
                    style={[
                      styles.animCard,
                      selectedType === anim.type && styles.animCardActive,
                    ]}
                    onPress={() => setSelectedType(anim.type)}
                  >
                    <Ionicons name={anim.icon as any} size={28} color={anim.color} />
                    <Text style={styles.animName}>{anim.name}</Text>
                    {selectedType === anim.type && (
                      <View style={styles.activeIndicator}>
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.cyan400} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Show timing controls only if animation is NOT "none" */}
            {selectedType !== 'none' && (
              <>
                {/* Step 2: Speed */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>2. Speed</Text>
                  <View style={styles.presetRow}>
                    {SPEED_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.presetButton,
                          duration === preset.value && styles.presetButtonActive,
                        ]}
                        onPress={() => setDuration(preset.value)}
                      >
                        <Text style={[
                          styles.presetLabel,
                          duration === preset.value && styles.presetLabelActive
                        ]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Step 3: Delay */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>3. Delay</Text>
                  <View style={styles.presetRow}>
                    {DELAY_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.value}
                        style={[
                          styles.presetButton,
                          delay === preset.value && styles.presetButtonActive,
                        ]}
                        onPress={() => setDelay(preset.value)}
                      >
                        <Ionicons 
                          name={preset.icon as any} 
                          size={16} 
                          color={delay === preset.value ? COLORS.cyan400 : COLORS.slate400} 
                        />
                        <Text style={[
                          styles.presetLabel,
                          delay === preset.value && styles.presetLabelActive
                        ]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Step 4: Loop */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>4. Repeat</Text>
                  <View style={styles.presetRow}>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        !loop && styles.presetButtonActive,
                      ]}
                      onPress={() => setLoop(false)}
                    >
                      <Ionicons 
                        name="play-circle" 
                        size={18} 
                        color={!loop ? COLORS.cyan400 : COLORS.slate400} 
                      />
                      <Text style={[
                        styles.presetLabel,
                        !loop && styles.presetLabelActive
                      ]}>
                        Play Once
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        loop && styles.presetButtonActive,
                      ]}
                      onPress={() => setLoop(true)}
                    >
                      <Ionicons 
                        name="repeat" 
                        size={18} 
                        color={loop ? COLORS.cyan400 : COLORS.slate400} 
                      />
                      <Text style={[
                        styles.presetLabel,
                        loop && styles.presetLabelActive
                      ]}>
                        Loop Forever
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Preview Info */}
                <View style={styles.previewInfo}>
                  <Ionicons name="information-circle" size={16} color={COLORS.cyan400} />
                  <Text style={styles.previewText}>
                    {selectedType} • {duration}ms • {delay}ms delay • {loop ? 'Looping' : 'Once'}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.applyButtonText}>Apply Animation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 0,
  },
  animCard: {
    width: '31%',
    minHeight: 80,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    paddingVertical: 12,
  },
  animCardActive: {
    borderColor: COLORS.cyan400,
    backgroundColor: COLORS.slate700,
  },
  animName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 6,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.slate800,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    borderColor: COLORS.cyan400,
    backgroundColor: COLORS.slate700,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  presetLabelActive: {
    color: COLORS.white,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.slate800,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.slate300,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.cyan500,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AnimationSelectorModal;