import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface VoiceCommentPlayerProps {
  audioUrl: string;
  duration: number; // in seconds
}

const VoiceCommentPlayer: React.FC<VoiceCommentPlayerProps> = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animation values for waveform
  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startWaveAnimation = () => {
    const animations = waveAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
    });

    Animated.stagger(50, animations).start();
  };

  const stopWaveAnimation = () => {
    waveAnimations.forEach((anim) => {
      anim.setValue(0.3);
    });
  };

  const playSound = async () => {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }

      setIsPlaying(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(Math.floor(status.positionMillis / 1000));

      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
        if (soundRef.current) {
          soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purple500 + '20', COLORS.cyan500 + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Play/Pause Button with glow effect */}
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={isPlaying ? pauseSound : playSound}
        >
          <View style={styles.playButtonGlow}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={COLORS.white}
            />
          </View>
        </TouchableOpacity>

        {/* Animated Waveform */}
        <View style={styles.waveformContainer}>
          {waveAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  transform: [
                    {
                      scaleY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1],
                      }),
                    },
                  ],
                  opacity: isPlaying ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>

        {/* Time Display with fancy styling */}
        <View style={styles.timeContainer}>
          <Text style={styles.currentTime}>{formatTime(currentPosition)}</Text>
          <Text style={styles.separator}>/</Text>
          <Text style={styles.totalTime}>{formatTime(duration)}</Text>
        </View>

        {/* Circular Progress Indicator */}
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.purple500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.purple500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: COLORS.cyan500,
    shadowColor: COLORS.cyan500,
  },
  playButtonGlow: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.cyan400,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cyan400,
  },
  separator: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  totalTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate800 + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan400,
  },
});

export default VoiceCommentPlayer;
