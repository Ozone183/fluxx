import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

interface LayerCaptionProps {
  caption: string;
  isVisible: boolean;
  scaleFactor: number;
  layerWidth: number;
}

const LayerCaption: React.FC<LayerCaptionProps> = ({
  caption,
  isVisible,
  scaleFactor,
  layerWidth,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  React.useEffect(() => {
    // Collapse when caption becomes invisible
    if (!isVisible) {
      setIsExpanded(false);
    }
  }, [isVisible]);

  if (!caption || caption.trim().length === 0) return null;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Animated.View
      style={[
        styles.captionContainer,
        {
          width: layerWidth,
          opacity,
        },
      ]}
    >
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
        <View style={styles.captionBackground}>
          <Text
            style={[
              styles.captionText,
              { fontSize: 12 * scaleFactor },
            ]}
            numberOfLines={isExpanded ? undefined : 2} // Expand on tap
            ellipsizeMode="tail"
          >
            {caption}
          </Text>
          {/* Show expand indicator for long text */}
          {caption.length > 50 && !isExpanded && (
            <Text style={[styles.expandHint, { fontSize: 10 * scaleFactor }]}>
              Tap to read more...
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  captionContainer: {
    position: 'absolute',
    bottom: -53, // Your perfect positioning
    left: 0,
    zIndex: 10,
  },
  captionBackground: {
    backgroundColor: 'transparent', // No black box
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  captionText: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Add shadow for readability
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  expandHint: {
    color: COLORS.slate300,
    fontStyle: 'italic',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default LayerCaption;