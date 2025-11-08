// src/components/CanvasStoryRing.tsx - COMPLETE UPDATED VERSION

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isCreateNew && canvas && !canvas.isExpired) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  if (isCreateNew) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.ringContainer}>
          <LinearGradient
            colors={['#06b6d4', '#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createRing}
          >
            <View style={styles.createInner}>
              <Icon name="add" size={32} color={COLORS.cyan400} />
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.username}>Create</Text>
      </TouchableOpacity>
    );
  }

  if (!canvas) return null;

  const isExpired = canvas.isExpired || Date.now() > canvas.expiresAt;
  const creatorName = canvas.creatorUsername.replace('@', '');
  const hasActiveUsers = activeCollaboratorsCount > 0;

  // Get first image layer for thumbnail
  const firstImageLayer = canvas.layers.find(layer => layer.type === 'image' && layer.imageUrl);
  const thumbnailUrl = firstImageLayer?.imageUrl;

  const ringGradient = isExpired
    ? ['#475569', '#334155'] as const
    : ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'] as const;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.ringContainer,
          !isExpired && { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <LinearGradient
          colors={ringGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ring,
            !isExpired && styles.activeRingShadow
          ]}
        >
          <View style={styles.innerRing}>
            <View style={[styles.canvas, { backgroundColor: canvas.backgroundColor }]}>
              {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
              ) : (
                <Icon
                  name="color-palette"
                  size={30}
                  color={isExpired ? COLORS.slate500 : COLORS.cyan400}
                />
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {hasActiveUsers && !isExpired && (
        <LinearGradient
          colors={['#06b6d4', '#3b82f6']}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>{activeCollaboratorsCount}</Text>
        </LinearGradient>
      )}

      {isExpired && (
        <View style={[styles.badge, styles.expiredBadge]}>
          <Icon name="time-outline" size={12} color={COLORS.white} />
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
    width: 76,
  },
  ringContainer: {
    width: 76,
    height: 76,
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeRingShadow: {
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  innerRing: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
    backgroundColor: COLORS.slate900,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  createRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  createInner: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 8,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 28,
    right: 2,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 3,
    borderColor: COLORS.slate900,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  expiredBadge: {
    backgroundColor: COLORS.slate600,
  },
});

export default CanvasStoryRing;