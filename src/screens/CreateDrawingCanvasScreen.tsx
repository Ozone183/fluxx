import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS } from '../theme/colors';
import { DRAWING_TEMPLATES, DrawingTemplate, getTemplatesByCategory } from '../data/drawingTemplates';

export default function CreateDrawingCanvasScreen() {
  const navigation = useNavigation();
  const [selectedTemplate, setSelectedTemplate] = useState<DrawingTemplate | null>(null);

  const handleSelectTemplate = (template: DrawingTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (!selectedTemplate) {
      Alert.alert('Select Template', 'Please select a template to continue');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to drawing editor with selected template
    (navigation as any).navigate('DrawingEditorScreen', {
      template: selectedTemplate,
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const renderTemplateCard = (template: DrawingTemplate) => {
    const isSelected = selectedTemplate?.id === template.id;

    return (
      <TouchableOpacity
        key={template.id}
        style={styles.templateCard}
        onPress={() => handleSelectTemplate(template)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.templateCardInner,
            isSelected && styles.templateCardSelected,
          ]}
        >
          <View style={styles.templateIcon}>
            <Ionicons
              name={template.icon as any}
              size={32}
              color={isSelected ? COLORS.purple400 : COLORS.slate400}
            />
          </View>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateDescription} numberOfLines={2}>
            {template.description}
          </Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.purple400} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const quickTemplates = getTemplatesByCategory('quick');
  const gameTemplates = getTemplatesByCategory('games');
  const creativeTemplates = getTemplatesByCategory('creative');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Template</Text>
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
          disabled={!selectedTemplate}
        >
          <Text
            style={[
              styles.continueText,
              !selectedTemplate && styles.continueTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Sketches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color={COLORS.cyan400} />
            <Text style={styles.sectionTitle}>Quick Sketches</Text>
          </View>
          <View style={styles.templatesGrid}>
            {quickTemplates.map(renderTemplateCard)}
          </View>
        </View>

        {/* Collaborative Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={20} color={COLORS.purple400} />
            <Text style={styles.sectionTitle}>Collaborative Games</Text>
          </View>
          <View style={styles.templatesGrid}>
            {gameTemplates.map(renderTemplateCard)}
          </View>
        </View>

        {/* Creative */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={20} color={COLORS.pink600} />
            <Text style={styles.sectionTitle}>Creative</Text>
          </View>
          <View style={styles.templatesGrid}>
            {creativeTemplates.map(renderTemplateCard)}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="brush" size={24} color={COLORS.purple400} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Drawing Canvas Features</Text>
            <Text style={styles.infoText}>
              • Draw with pen, brush, and eraser{'\n'}
              • Collaborate in real-time{'\n'}
              • Undo/redo support{'\n'}
              • Export as image
            </Text>
          </View>
        </View>
      </ScrollView>
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
  continueButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.purple400,
  },
  continueTextDisabled: {
    color: COLORS.slate600,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '47%',
  },
  templateCardInner: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 140,
  },
  templateCardSelected: {
    borderColor: COLORS.purple400,
    backgroundColor: `${COLORS.purple400}15`,
  },
  templateIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.slate700,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    color: COLORS.slate400,
    lineHeight: 18,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.purple400 + '30',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.slate300,
    lineHeight: 20,
  },
});
