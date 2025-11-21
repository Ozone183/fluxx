// src/components/ReactionPicker.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Modal,
  Dimensions 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ReactionType } from '../types/canvas';
import { 
  ALL_REACTIONS, 
  QUICK_REACTIONS, 
  REACTION_CATEGORIES,
  ReactionCategory,
  getReactionsByCategory,
  getReactionById 
} from '../data/reactions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReactionPickerProps {
  currentReactions: Record<string, string[]>;
  userId: string;
  onReact: (reactionType: ReactionType) => void;
  showAllReactions?: boolean; // Quick bar or full picker
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  currentReactions,
  userId,
  onReact,
  showAllReactions = false,
}) => {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReactionCategory>('love');

  const handleReact = (type: ReactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(type);
    if (showFullPicker) {
      setShowFullPicker(false);
    }
  };

  const renderQuickReactions = () => {
    const quickReactionsList = QUICK_REACTIONS.map(id => getReactionById(id)).filter(Boolean);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickContainer}
      >
        {quickReactionsList.map((reaction) => {
          if (!reaction) return null;
          const count = currentReactions[reaction.id]?.length || 0;
          const hasReacted = currentReactions[reaction.id]?.includes(userId);

          return (
            <TouchableOpacity
              key={reaction.id}
              style={[styles.reactionButton, hasReacted && styles.reactionButtonActive]}
              onPress={() => handleReact(reaction.id)}
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

        {/* More Button */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowFullPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.cyan400} />
          <Text style={styles.moreText}>More</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderFullPicker = () => {
    const categoryReactions = getReactionsByCategory(selectedCategory);

    return (
      <Modal
        visible={showFullPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFullPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFullPicker(false)}
        >
          <View style={styles.pickerContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Reaction</Text>
              <TouchableOpacity onPress={() => setShowFullPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabsContainer}
              contentContainerStyle={styles.categoryTabs}
            >
              {(Object.keys(REACTION_CATEGORIES) as ReactionCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.categoryTabActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === category && styles.categoryTabTextActive,
                    ]}
                  >
                    {REACTION_CATEGORIES[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reactions Grid */}
            <ScrollView
              style={styles.reactionsGrid}
              contentContainerStyle={styles.reactionsGridContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.gridRow}>
                {categoryReactions.map((reaction) => {
                  const count = currentReactions[reaction.id]?.length || 0;
                  const hasReacted = currentReactions[reaction.id]?.includes(userId);

                  return (
                    <TouchableOpacity
                      key={reaction.id}
                      style={[
                        styles.gridReactionButton,
                        hasReacted && styles.gridReactionButtonActive,
                      ]}
                      onPress={() => handleReact(reaction.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.gridEmoji}>{reaction.emoji}</Text>
                      <Text style={styles.gridLabel}>{reaction.label}</Text>
                      {count > 0 && (
                        <View style={styles.gridBadge}>
                          <Text style={styles.gridBadgeText}>{count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      {renderQuickReactions()}
      {renderFullPicker()}
    </>
  );
};

const styles = StyleSheet.create({
  quickContainer: {
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
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate700,
    borderWidth: 1,
    borderColor: COLORS.cyan400,
    borderStyle: 'dashed',
    gap: 6,
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cyan400,
  },

  // Full Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  categoryTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
  },
  categoryTabActive: {
    backgroundColor: COLORS.cyan400,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  categoryTabTextActive: {
    color: COLORS.slate900,
  },
  reactionsGrid: {
    flex: 1,
  },
  reactionsGridContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridReactionButton: {
    width: (SCREEN_WIDTH - 64) / 4, // 4 columns with padding
    aspectRatio: 1,
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gridReactionButtonActive: {
    borderColor: COLORS.cyan400,
    backgroundColor: COLORS.slate700,
  },
  gridEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.slate400,
    textAlign: 'center',
  },
  gridBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.cyan400,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  gridBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
});

export default ReactionPicker;