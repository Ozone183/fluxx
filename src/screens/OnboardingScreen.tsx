import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  ViewToken,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: readonly [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Fluxx',
    description: 'The next-generation social platform where creativity meets community. Your ideas, your voice, your channel.',
    icon: 'rocket-outline',
    gradientColors: [COLORS.cyan400, COLORS.deepIndigo] as const,
  },
  {
    id: '2',
    title: 'Your Unique Channel',
    description: 'Create your @channel identity. Stand out with a custom profile that represents who you are in the Fluxx universe.',
    icon: 'at-circle-outline',
    gradientColors: [COLORS.electricPurple, COLORS.hotPink] as const,
  },
  {
    id: '3',
    title: 'AI-Powered Creativity',
    description: 'Get instant AI-generated captions and strategic feedback on your posts. Elevate your content with smart suggestions.',
    icon: 'sparkles-outline',
    gradientColors: [COLORS.hotPink, COLORS.neonGreen] as const,
  },
  {
    id: '4',
    title: 'Join the Flux',
    description: 'Connect with like-minded creators, share your thoughts, and ride the wave of real-time conversations. The future is flowing.',
    icon: 'people-outline',
    gradientColors: [COLORS.neonGreen, COLORS.cyan400] as const,
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

// Animated particle component
const AnimatedParticle = ({ delay, duration }: { delay: number; duration: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -20,
            duration: duration,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingParticle,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const iconRotation = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous icon rotation
    Animated.loop(
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse icon scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    onFinish();
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const rotate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={[COLORS.slate900, ...item.gradientColors, COLORS.slate900]}
          style={styles.slideGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.slideContent,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            {/* Animated Icon with glow */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ rotate }, { scale: iconScale }],
                },
              ]}
            >
              <LinearGradient
                colors={[item.gradientColors[0] + '50', item.gradientColors[1] + '50']}
                style={styles.iconGlow}
              />
              <Ionicons name={item.icon} size={100} color={COLORS.white} />
            </Animated.View>

            {/* Title */}
            <Text style={styles.slideTitle}>{item.title}</Text>

            {/* Description */}
            <Text style={styles.slideDescription}>{item.description}</Text>

            {/* Animated Floating Particles */}
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${(i * 8 + 10) % 90}%`,
                  top: `${(i * 10 + 15) % 70}%`,
                }}
              >
                <AnimatedParticle delay={i * 200} duration={3000 + i * 100} />
              </View>
            ))}
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Footer with pagination and buttons */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 28, 10],
              extrapolate: 'clamp',
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Skip Button */}
          {currentIndex < slides.length - 1 && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Next/Get Started Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.cyan400, COLORS.deepIndigo] as const}
              style={styles.nextGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={currentIndex === slides.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
                size={20}
                color={COLORS.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  slide: {
    width,
    height,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80, // Better centering!
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    flex: 1,
  },
  iconContainer: {
    marginBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  slideTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1.5,
  },
  slideDescription: {
    fontSize: 17,
    color: COLORS.slate300,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  floatingParticle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    paddingHorizontal: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.cyan400,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.slate400,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    marginLeft: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;