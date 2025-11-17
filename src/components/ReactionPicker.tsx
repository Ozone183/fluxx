// src/components/ReactionPicker.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { ReactionType } from '../types/canvas';

interface ReactionPickerProps {
  currentReactions: {
    heart: string[];
    fire: string[];
    laugh: string[];
    clap: string[];
    heart_eyes: string[];
    sparkles: string[];
  };
  userId: string;
  onReact: (reactionType: ReactionType) => void;
}

const REACTIONS = [
  { type: 'heart' as ReactionType, emoji: '❤️', label: 'Love' },
  { type: 'fire' as ReactionType, emoji: '🔥', label: 'Fire' },
  { type: 'laugh' as ReactionType, emoji: '😂', label: 'Funny' },
  { type: 'clap' as ReactionType, emoji: '👏', label: 'Applaud' },
  { type: 'heart_eyes' as ReactionType, emoji: '😍', label: 'Amazing' },
  { type: 'sparkles' as ReactionType, emoji: '✨', label: 'Sparkle' },
];

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  currentReactions,
  userId,
  onReact,
}) => {
  const handleReact = (type: ReactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(type);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {REACTIONS.map((reaction) => {
        const count = currentReactions[reaction.type]?.length || 0;
        const hasReacted = currentReactions[reaction.type]?.includes(userId);

        return (
          <TouchableOpacity
            key={reaction.type}
            style={[styles.reactionButton, hasReacted && styles.reactionButtonActive]}
            onPress={() => handleReact(reaction.type)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            {count > 0 && (
              <Text style={[styles.count, hasReacted && styles.countActive]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  reactionButtonActive: {
    backgroundColor: COLORS.slate700,
    borderColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 20,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  countActive: {
    color: COLORS.cyan400,
  },
});

export default ReactionPicker;
