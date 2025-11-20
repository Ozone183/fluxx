import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../theme/colors';
import * as Haptics from 'expo-haptics';

interface TokenClaimedCelebrationProps {
  visible: boolean;
  onComplete: () => void;
  tokensEarned: number;
}

const { width, height } = Dimensions.get('window');

const TokenClaimedCelebration: React.FC<TokenClaimedCelebrationProps> = ({
  visible,
  onComplete,
  tokensEarned,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Create confetti animations
  const confettiAnims = useRef(
    Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Main animation sequence
      Animated.sequence([
        // 1. Token burst in
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        // 2. Fade in text
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti rain
      confettiAnims.forEach((anim, index) => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 1000,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anim.rotate, {
              toValue: 360,
              duration: 1000 + Math.random() * 1000,
              useNativeDriver: true,
            })
          ),
        ]).start();
      });

      // Auto-dismiss after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
          // Reset animations
          scaleAnim.setValue(0);
          fadeAnim.setValue(0);
          confettiAnims.forEach(anim => {
            anim.y.setValue(-50);
          });
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const confettiColors = [
    COLORS.cyan400,
    COLORS.purple500,
    COLORS.pink500,
    COLORS.yellow500,
    COLORS.orange500,
    COLORS.green500,
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                left: anim.x,
                transform: [
                  { translateY: anim.y },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { scale: anim.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Center Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.yellow500, COLORS.orange500]}
            style={styles.tokenCircle}
          >
            <Ionicons name="diamond" size={80} color={COLORS.white} />
          </LinearGradient>

          <Text style={styles.mainText}>TOKENS CLAIMED!</Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.plusSign}>+</Text>
            <Text style={styles.amount}>{tokensEarned}</Text>
            <Ionicons name="diamond" size={40} color={COLORS.yellow400} />
          </View>

          <Text style={styles.subText}>Added to your wallet! 🎉</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    alignItems: 'center',
  },
  tokenCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.yellow500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 24,
    letterSpacing: 2,
    textShadowColor: COLORS.cyan400,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  plusSign: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.green500,
  },
  amount: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.yellow400,
    textShadowColor: COLORS.orange500,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.cyan400,
    marginTop: 8,
  },
});

export default TokenClaimedCelebration;
