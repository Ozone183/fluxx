// src/components/CursorOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { UserCursor } from '../services/cursorService';

interface CursorOverlayProps {
  cursors: UserCursor[];
  canvasWidth: number;
  canvasHeight: number;
}

interface AnimatedCursor {
  userId: string;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({
  cursors,
  canvasWidth,
  canvasHeight,
}) => {
  const animatedCursorsRef = useRef<Map<string, AnimatedCursor>>(new Map());

  useEffect(() => {
    const animatedCursors = animatedCursorsRef.current;

    cursors.forEach((cursor) => {
      let animated = animatedCursors.get(cursor.userId);

      if (!animated) {
        // Create new animated values for this cursor
        animated = {
          userId: cursor.userId,
          animatedX: new Animated.Value(cursor.position.x),
          animatedY: new Animated.Value(cursor.position.y),
        };
        animatedCursors.set(cursor.userId, animated);
      } else {
        // Animate to new position
        Animated.parallel([
          Animated.timing(animated.animatedX, {
            toValue: cursor.position.x,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animated.animatedY, {
            toValue: cursor.position.y,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Clean up cursors that are no longer active
    const activeCursorIds = new Set(cursors.map(c => c.userId));
    Array.from(animatedCursors.keys()).forEach((userId) => {
      if (!activeCursorIds.has(userId)) {
        animatedCursors.delete(userId);
      }
    });
  }, [cursors]);

  return (
    <View style={styles.container} pointerEvents="none">
      {cursors.map((cursor) => {
        const animated = animatedCursorsRef.current.get(cursor.userId);
        if (!animated) return null;

        return (
          <Animated.View
            key={cursor.userId}
            style={[
              styles.cursorContainer,
              {
                transform: [
                  { translateX: animated.animatedX },
                  { translateY: animated.animatedY },
                ],
              },
            ]}
          >
            {/* Cursor Icon */}
            <View style={styles.cursor}>
              <View style={[styles.cursorPointer, { backgroundColor: cursor.color }]} />
              <View style={[styles.cursorTail, { backgroundColor: cursor.color }]} />
            </View>

            {/* Username Label */}
            <View style={[styles.label, { backgroundColor: cursor.color }]}>
              <Text style={styles.labelText} numberOfLines={1}>
                {cursor.username}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  cursorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cursor: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  cursorPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '-45deg' }],
  },
  cursorTail: {
    width: 3,
    height: 12,
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 1.5,
  },
  label: {
    marginTop: 8,
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 100,
  },
});

export default CursorOverlay;
