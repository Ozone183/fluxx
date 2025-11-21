// src/components/CanvasStoriesBar.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref as dbRef, onValue } from 'firebase/database';
import { firestore, database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, ActivePresence } from '../types/canvas';
import CanvasStoryRing from './CanvasStoryRing';
import PrivateCanvasModal from './PrivateCanvasModal';

const CanvasStoriesBar = () => {
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [presenceCounts, setPresenceCounts] = useState<{ [canvasId: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Fetch active canvases (not expired)
  useEffect(() => {
    const canvasesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases');

    const q = query(
      canvasesRef,
      where('isExpired', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      
      console.log('📊 Total canvases from Firestore:', snapshot.docs.length);
      
      const activeCanvases = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Canvas))
        .filter(canvas => {
          // Filter out expired canvases
          if (canvas.expiresAt <= now) {
            console.log('❌ Filtered out expired:', canvas.title, canvas.id);
            return false;
          }
          
          console.log('✅ Active canvas:', canvas.title, canvas.creatorUsername);
          
          // ✅ SHOW ALL CANVASES (public + private) for engagement
          return true;
        });

      console.log('📊 Final active canvases count:', activeCanvases.length);
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

  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);
  const [showPrivateModal, setShowPrivateModal] = useState(false);

  const handleOpenCanvas = async (canvasId: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (!canvas) return;

    // Check if private and user doesn't have access
    if (canvas.accessType === 'private') {
      const hasAccess =
        canvas.creatorId === userId || // Creator always has access
        canvas.allowedUsers?.includes(userId || '') || // User is in allowed list
        false;

      if (!hasAccess) {
        // Show private modal instead
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedCanvas(canvas);
        setShowPrivateModal(true);
        return;
      }
    }

    // User has access - open canvas
    (navigation as any).navigate('CanvasEditor', { canvasId });
  };

  const handleRequestAccess = async () => {
    if (!selectedCanvas || !userId) return;

    try {
      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', selectedCanvas.id);

      await updateDoc(canvasRef, {
        pendingRequests: arrayUnion(userId),
      });

      // Create notification for creator
      const { createNotification } = await import('../utils/notifications');
      await createNotification({
        recipientUserId: selectedCanvas.creatorId,
        type: 'access_request',
        fromUserId: userId,
        fromUsername: userChannel || '@unknown',
        fromProfilePic: null,
        relatedCanvasId: selectedCanvas.id,
        relatedCanvasTitle: selectedCanvas.title,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Request Sent', `Access request sent to ${selectedCanvas.creatorUsername}`);
      setShowPrivateModal(false);
    } catch (error) {
      console.error('Request access error:', error);
      Alert.alert('Error', 'Failed to send access request');
    }
  };

  const handleEnterCode = async (code: string) => {
    if (!selectedCanvas || !userId) return;

    // Verify invite code
    if (code.toUpperCase() !== selectedCanvas.inviteCode?.toUpperCase()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Code', 'The invite code you entered is incorrect');
      return;
    }

    try {
      // Add user to allowedUsers
      const canvasRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases', selectedCanvas.id);

      await updateDoc(canvasRef, {
        allowedUsers: arrayUnion(userId),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Access Granted', 'You now have access to this canvas!');
      setShowPrivateModal(false);

      // Open canvas immediately
      (navigation as any).navigate('CanvasEditor', { canvasId: selectedCanvas.id });
    } catch (error) {
      console.error('Invite code error:', error);
      Alert.alert('Error', 'Failed to verify invite code');
    }
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
    <>
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

      {/* Private Canvas Modal */}
      {selectedCanvas && (
        <PrivateCanvasModal
          visible={showPrivateModal}
          canvasTitle={selectedCanvas.title}
          creatorUsername={selectedCanvas.creatorUsername}
          onRequestAccess={handleRequestAccess}
          onEnterCode={handleEnterCode}
          onClose={() => setShowPrivateModal(false)}
        />
      )}
    </>
  );
}; // ← ADD THIS CLOSING BRACE

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
