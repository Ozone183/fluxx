import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS } from '../theme/colors';

const CreatePostTypeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Post Type</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Regular Post Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => (navigation as any).navigate('CreatePost')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="create" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.optionTitle}>Regular Post</Text>
            <Text style={styles.optionDescription}>
              Create a post with text and image{'\n'}
              ✨ AI Caption & AI Critique available
            </Text>
            <View style={styles.featureBadges}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={12} color={COLORS.cyan400} />
                <Text style={styles.badgeText}>AI Caption</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="bulb" size={12} color={COLORS.cyan400} />
                <Text style={styles.badgeText}>AI Critique</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Carousel Post Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => (navigation as any).navigate('CreateImageCarouselPost')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="images" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.optionTitle}>Carousel Post</Text>
            <Text style={styles.optionDescription}>
              Share multiple images with music{'\n'}
              🎵 Up to 10 images with background music
            </Text>
            <View style={styles.featureBadges}>
              <View style={styles.badge}>
                <Ionicons name="musical-notes" size={12} color="#4A90E2" />
                <Text style={styles.badgeText}>Music</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="images" size={12} color="#4A90E2" />
                <Text style={styles.badgeText}>Multi-Image</Text>
              </View>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  optionsContainer: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  optionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  optionGradient: {
    padding: 24,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  newBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default CreatePostTypeScreen;
