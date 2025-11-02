import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

const AuthLoadingScreen = () => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <LinearGradient
      colors={[COLORS.slate900, COLORS.slate800, COLORS.indigo600]}
      style={styles.container}
    >
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.logoText}>
          FLUX<Text style={styles.logoAccent}>X</Text>
        </Text>
      </Animated.View>
      <ActivityIndicator size="large" color={COLORS.cyan400} style={styles.loader} />
      <Text style={styles.loadingText}>Initializing Fluxx...</Text>
      <Text style={styles.tagline}>The Future of Social Connection</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.slate900,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 8,
  },
  logoAccent: {
    color: COLORS.cyan400,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.cyan400,
    marginTop: 20,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default AuthLoadingScreen;
