// src/components/CanvasStoryRing.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import { Canvas } from '../types/canvas';

interface CanvasStoryRingProps {
  canvas?: Canvas;
  isCreateNew?: boolean;
  onPress: () => void;
  activeCollaboratorsCount?: number;
}

const CanvasStoryRing: React.FC<CanvasStoryRingProps> = ({
  canvas,
  isCreateNew,
  onPress,
  activeCollaboratorsCount = 0,
}) => {
  if (isCreateNew) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.createRing}>
          <View style={styles.createInner}>
            <Icon name="add" size={32} color={COLORS.white} />
          </View>
        </LinearGradient>
        <Text style={styles.username}>Create</Text>
      </TouchableOpacity>
    );
  }

  if (!canvas) return null;

  const isExpired = canvas.isExpired || Date.now() > canvas.expiresAt;
  const creatorName = canvas.creatorUsername.replace('@', '');
  const hasActiveUsers = activeCollaboratorsCount > 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={isExpired ? [COLORS.slate700, COLORS.slate600] : GRADIENTS.primary}
        style={styles.ring}
      >
        <View style={styles.innerRing}>
          <View style={styles.canvas}>
            <Icon 
              name="color-palette" 
              size={28} 
              color={isExpired ? COLORS.slate500 : COLORS.cyan400} 
            />
          </View>
        </View>
      </LinearGradient>
      
      {/* Active Collaborators Badge */}
      {hasActiveUsers && !isExpired && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCollaboratorsCount}</Text>
        </View>
      )}

      {/* Expired Badge */}
      {isExpired && (
        <View style={[styles.badge, styles.expiredBadge]}>
          <Icon name="time" size={12} color={COLORS.white} />
        </View>
      )}

      <Text style={styles.username} numberOfLines={1}>
        {creatorName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.slate900,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 6,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 24,
    right: 0,
    backgroundColor: COLORS.cyan500,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.slate900,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  expiredBadge: {
    backgroundColor: COLORS.slate600,
  },
});

export default CanvasStoryRing;
