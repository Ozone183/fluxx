import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

interface AnimatedSplashProps {
  onFinish: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const gradientRotation = useRef(new Animated.Value(0)).current;

  // Generate 20 floating particles
  const particles = useRef<Particle[]>(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.5 + 0.3),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }))
  ).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse animation (continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gradient rotation animation (slow)
    Animated.loop(
      Animated.timing(gradientRotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Floating particles animation
    particles.forEach((particle) => {
      const floatAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 4000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 4000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 10000 + Math.random() * 5000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 10000 + Math.random() * 5000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.3 + 0.2,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.5 + 0.3,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      floatAnimation.start();
    });

    // Exit animation after 3 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={[COLORS.slate900, '#1a1456', COLORS.slate900]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      {/* Wave Effect Overlay */}
      <View style={styles.waveContainer}>
        <LinearGradient
          colors={['transparent', COLORS.cyan400 + '10', 'transparent']}
          style={styles.wave}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Logo Container with Glow */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Outer Glow */}
        <Animated.View
          style={[
            styles.glowOuter,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Inner Glow */}
        <Animated.View
          style={[
            styles.glowInner,
            {
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Logo Text */}
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>
            FLUX<Text style={styles.logoAccent}>X</Text>
          </Text>
          <LinearGradient
            colors={[COLORS.cyan400, COLORS.electricPurple, COLORS.hotPink] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoUnderline}
          />
          <Text style={styles.logoTagline}>where ideas flow</Text>
        </View>
      </Animated.View>

      {/* Bottom Sparkle */}
      <View style={styles.sparkleContainer}>
        {[...Array(5)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.sparkle,
              {
                opacity: glowOpacity,
                left: `${20 + i * 15}%`,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  waveContainer: {
    position: 'absolute',
    width: width * 2,
    height: height * 0.5,
    top: height * 0.25,
    left: -width * 0.5,
  },
  wave: {
    flex: 1,
    transform: [{ rotate: '15deg' }],
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.cyan400,
    opacity: 0.1,
  },
  glowInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.electricPurple,
    opacity: 0.15,
  },
  logoTextContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 8,
    textShadowColor: COLORS.cyan400,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoAccent: {
    color: COLORS.cyan400,
    textShadowColor: COLORS.cyan400,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  logoUnderline: {
    width: 200,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  logoTagline: {
    fontSize: 18,
    color: COLORS.slate400,
    marginTop: 16,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'lowercase',
    fontStyle: 'italic',
  },
  sparkleContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    height: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sparkle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

export default AnimatedSplash;
