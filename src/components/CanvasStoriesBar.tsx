// src/components/CanvasStoriesBar.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref as dbRef, onValue } from 'firebase/database';
import { firestore, database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, ActivePresence } from '../types/canvas';
import CanvasStoryRing from './CanvasStoryRing';

const CanvasStoriesBar = () => {
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [presenceCounts, setPresenceCounts] = useState<{ [canvasId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Fetch active canvases (not expired)
  useEffect(() => {
    const canvasesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases');
    const now = Date.now();
    
    const q = query(
      canvasesRef,
      where('isExpired', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeCanvases = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Canvas))
        .filter(canvas => canvas.expiresAt > now); // Double check not expired

      setCanvases(activeCanvases);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to presence for all canvases
  useEffect(() => {
    if (canvases.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    canvases.forEach(canvas => {
      const presenceRef = dbRef(database, `canvases/${canvas.id}/presence`);
      
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        const presences = snapshot.val() || {};
        const activeCount = Object.values(presences).filter((p: any) => 
          Date.now() - (p.lastActive || 0) < 10000 // Active in last 10 seconds
        ).length;

        setPresenceCounts(prev => ({ ...prev, [canvas.id]: activeCount }));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [canvases]);

  const handleCreateCanvas = () => {
    (navigation as any).navigate('Canvas');
  };

  const handleOpenCanvas = (canvasId: string) => {
    (navigation as any).navigate('CanvasEditor', { canvasId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.cyan400} />
      </View>
    );
  }

  if (canvases.length === 0 && !userId) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create New Canvas Button */}
        <CanvasStoryRing 
          isCreateNew 
          onPress={handleCreateCanvas}
        />

        {/* Active Canvases */}
        {canvases.map(canvas => (
          <CanvasStoryRing
            key={canvas.id}
            canvas={canvas}
            onPress={() => handleOpenCanvas(canvas.id)}
            activeCollaboratorsCount={presenceCounts[canvas.id] || 0}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.slate900,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: COLORS.slate900,
  },
});

export default CanvasStoriesBar;
