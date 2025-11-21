// src/components/FluxxAITestButton.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { FluxxAIService } from '../services/fluxxAIService';

const FluxxAITestButton = () => {
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      
      Alert.alert(
        '🤖 FluxxAI Generator',
        'This will generate a full AI canvas with 12 images and music. This may take 2-5 minutes. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Generate',
            onPress: async () => {
              try {
                const result = await FluxxAIService.generateCanvas();
                setLastGenerated(result.title);
                
                Alert.alert(
                  '✅ Success!',
                  `Canvas "${result.title}" has been generated and posted to the feed!`,
                  [{ text: 'Awesome!' }]
                );
              } catch (error: any) {
                console.error('Generation error:', error);
                Alert.alert(
                  '❌ Error',
                  `Failed to generate canvas: ${error.message}`,
                  [{ text: 'OK' }]
                );
              } finally {
                setGenerating(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={24} color={COLORS.yellow500} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>FluxxAI Generator</Text>
          <Text style={styles.subtitle}>Test AI canvas generation</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, generating && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={generating}
        activeOpacity={0.7}
      >
        {generating ? (
          <>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.buttonText}>Generating...</Text>
          </>
        ) : (
          <>
            <Ionicons name="rocket" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Generate AI Canvas</Text>
          </>
        )}
      </TouchableOpacity>

      {lastGenerated && (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.green400} />
          <Text style={styles.statusText}>Last: {lastGenerated}</Text>
        </View>
      )}

      <Text style={styles.warningText}>
        ⚠️ This is a test feature. Generation may take 2-5 minutes.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.yellow500}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate400,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cyan500,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.slate600,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  warningText: {
    fontSize: 11,
    color: COLORS.amber400,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default FluxxAITestButton;
