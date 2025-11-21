// src/components/TappableLayer.tsx

import React, { useRef } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface TappableLayerProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  showHint?: boolean;
}

const TappableLayer: React.FC<TappableLayerProps> = ({
  onPress,
  children,
  style,
  showHint = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.9}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
        
        {/* Tap Hint - shows on hover/long press */}
        {showHint && (
          <View style={styles.tapHint}>
            <Ionicons name="expand-outline" size={16} color={COLORS.white} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tapHint: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
});

export default TappableLayer;
