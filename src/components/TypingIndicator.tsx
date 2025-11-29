import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TypingIndicator() {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      createWaveAnimation(dot1Anim, 0),
      createWaveAnimation(dot2Anim, 150),
      createWaveAnimation(dot3Anim, 300),
    ]);

    animations.start();

    return () => animations.stop();
  }, []);

  const Dot = ({ animValue }: { animValue: Animated.Value }) => (
    <Animated.View
      style={[
        styles.dotContainer,
        { transform: [{ translateY: animValue }] },
      ]}
    >
      <LinearGradient
        colors={['#3b82f6', '#06b6d4']}
        style={styles.dot}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={['#3b82f6', '#06b6d4']}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View style={styles.bubbleContainer}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.bubble}
        >
          <View style={styles.dotsContainer}>
            <Dot animValue={dot1Anim} />
            <Dot animValue={dot2Anim} />
            <Dot animValue={dot3Anim} />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubbleContainer: {
    maxWidth: '70%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  dotContainer: {
    marginHorizontal: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
