import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS } from '../theme/colors';

export default function CanvasTypeScreen() {
  const navigation = useNavigation();

  const handlePhotoCanvas = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to existing photo canvas flow
    (navigation as any).navigate('Canvas');
  };

  const handleDrawingCanvas = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to new drawing canvas flow
    (navigation as any).navigate('CreateDrawingCanvasScreen');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Canvas Type</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>What kind of canvas do you want to create?</Text>

        {/* Photo Canvas Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handlePhotoCanvas}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.iconGradient}
              >
                <Ionicons name="images" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>📷 Photo Canvas</Text>
              <Text style={styles.cardDescription}>
                Add photos, text, stickers and arrange them on a canvas
              </Text>
              <View style={styles.cardFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.cyan400} />
                  <Text style={styles.featureText}>Multiple photos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.cyan400} />
                  <Text style={styles.featureText}>Text & stickers</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.cyan400} />
                  <Text style={styles.featureText}>Drag & arrange</Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color={COLORS.slate400} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Drawing Canvas Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleDrawingCanvas}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={GRADIENTS.accent}
                style={styles.iconGradient}
              >
                <Ionicons name="brush" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>✏️ Drawing Canvas</Text>
              <Text style={styles.cardDescription}>
                Sketch, draw and doodle collaboratively in real-time
              </Text>
              <View style={styles.cardFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.purple400} />
                  <Text style={styles.featureText}>Hand drawing</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.purple400} />
                  <Text style={styles.featureText}>Real-time collab</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.purple400} />
                  <Text style={styles.featureText}>Drawing tools</Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color={COLORS.slate400} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.cyan400} />
          <Text style={styles.infoText}>
            Both canvas types support collaboration, music, and 24-hour expiration
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.slate300,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    borderRadius: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.slate400,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFeatures: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.slate300,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.slate300,
    lineHeight: 18,
  },
});
