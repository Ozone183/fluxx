import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

type AnimationType = 'fadeScale' | 'spinIn' | 'pageFlip' | 'glideIn';

export const useCanvasEntrance = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const rotateYValue = useRef(new Animated.Value(0)).current;
  
  // THE FINAL CONFIDENT SQUAD - NO SCARED BASTARDS ALLOWED
  const animations: AnimationType[] = ['fadeScale', 'spinIn', 'pageFlip', 'glideIn'];
  const selectedAnimation = useRef(
    animations[Math.floor(Math.random() * animations.length)]
  ).current;

  useEffect(() => {
    console.log(`🎪 Canvas entrance: ${selectedAnimation}`);
    
    setTimeout(() => {
      runAnimation(selectedAnimation);
    }, 150);
    
  }, []);

  const runAnimation = (type: AnimationType) => {
    switch (type) {
      case 'fadeScale':
        // SEXY, SMOOTH, CINEMATIC ✨
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }).start();
        break;

      case 'spinIn':
        // CORPORATE AGBERO WITH SWAGGER 🌪️
        Animated.parallel([
          Animated.spring(animatedValue, {
            toValue: 1,
            tension: 20,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'pageFlip':
        // FADESCALE'S TWIN SISTER 📖
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1600,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(rotateYValue, {
            toValue: 1,
            duration: 1600,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'glideIn':
        // SMOOTH CINEMA ENTRANCE ✈️
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1400,
          easing: Easing.bezier(0.22, 1, 0.36, 1), // Smooth glide curve
          useNativeDriver: true,
        }).start();
        break;
    }
  };

  const getAnimatedStyle = (): any => {
    switch (selectedAnimation) {
      case 'fadeScale':
        // SMOOTH FADE + SCALE ✨
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        };

      case 'spinIn':
        // DOUBLE SPIN WITH SCALE 🌪️
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 1],
              }),
            },
            {
              rotate: rotateValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['720deg', '0deg'],
              }),
            },
          ],
        };

      case 'pageFlip':
        // 3D PAGE FLIP EFFECT 📖
        return {
          opacity: animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
          }),
          transform: [
            { perspective: 1000 },
            {
              rotateY: rotateYValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['-90deg', '0deg'],
              }),
            },
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };

      case 'glideIn':
        // SMOOTH HORIZONTAL SLIDE ✈️
        return {
          opacity: animatedValue.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 0.8, 1], // Fade in smoothly
          }),
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [400, 0], // Slide from right
              }),
            },
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1], // Slight scale up
              }),
            },
          ],
        };

      default:
        return { opacity: 1 };
    }
  };

  return {
    animatedStyle: getAnimatedStyle(),
    animationType: selectedAnimation,
  };
};