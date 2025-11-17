// src/screens/DiscoveryFeedScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,  // ADD THIS
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, orderBy, limit, where, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 30) / 2; // 2 columns with margins

interface Canvas {
  id: string;
  title: string;
  likeCount: number;
  viewCount: number;
  createdAt: number;
  expiresAt: number;
  exportedImageUrl?: string;
  backgroundColor: string;
  creatorUsername: string;
  accessType: 'public' | 'private';
  layers: any[];
}

type FilterType = 'trending' | 'popular' | 'new' | 'expiring';

const ITEMS_PER_PAGE = 20;

const DiscoveryFeedScreen = () => {
  const navigation = useNavigation();
  const { userId } = useAuth();

  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('trending');
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const FILTERS = [
    { key: 'trending' as FilterType, label: '🔥 Trending', icon: 'flame' },
    { key: 'popular' as FilterType, label: '👁️ Popular', icon: 'eye' },
    { key: 'new' as FilterType, label: '✨ New', icon: 'sparkles' },
    { key: 'expiring' as FilterType, label: '⏰ Expiring', icon: 'time' },
  ];

  useEffect(() => {
    loadCanvases(true);
  }, [activeFilter]);

  const getQuery = (isInitial: boolean = true) => {
    const canvasesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases');
    let q;

    // Base filter: only public canvases that haven't expired
    const baseConstraints = [
      where('accessType', '==', 'public'),
      where('expiresAt', '>', Date.now()),
    ];

    switch (activeFilter) {
      case 'trending':
        const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        q = query(
          canvasesRef,
          where('accessType', '==', 'public'),
          where('expiresAt', '>', Date.now()),
          where('createdAt', '>', last24Hours),
          where('viewCount', '>=', 10), // Change from > 0 to >= 10
          orderBy('viewCount', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        break;

      case 'popular':
        q = query(
          canvasesRef,
          where('accessType', '==', 'public'),
          where('expiresAt', '>', Date.now()),
          where('viewCount', '>=', 20), // Must have significant views
          orderBy('viewCount', 'desc'),
          orderBy('likeCount', 'desc'), // Secondary sort by likes
          limit(20)
        );
        break;

      case 'new':
        // New: Created in last 3 hours
        const last3Hours = Date.now() - (3 * 60 * 60 * 1000);
        q = query(
          canvasesRef,
          where('accessType', '==', 'public'),
          where('expiresAt', '>', Date.now()),
          where('createdAt', '>', last3Hours),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        break;

      case 'expiring':
        // Expiring: Less than 2 hours left
        const twoHoursFromNow = Date.now() + (2 * 60 * 60 * 1000);
        q = query(
          canvasesRef,
          where('accessType', '==', 'public'),
          where('expiresAt', '>', Date.now()),
          where('expiresAt', '<', twoHoursFromNow),
          orderBy('expiresAt', 'asc'),
          limit(20)
        );
        break;
    }

    // Add pagination if not initial load
    if (!isInitial && lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    return q;
  };

  const loadCanvases = async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setCanvases([]);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const q = getQuery(isInitial);
      const snapshot = await getDocs(q);

      const newCanvases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Canvas, 'id'>),
      })) as Canvas[];

      if (isInitial) {
        setCanvases(newCanvases);
      } else {
        setCanvases(prev => [...prev, ...newCanvases]);
      }

      // Set last document for pagination
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastDoc(null); // No more docs to load
      }

      // Check if we've reached the end
      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false); // No more canvases to load
      }

    } catch (error) {
      console.error('Error loading canvases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCanvases(true);
  };

  const loadMore = () => {
    if (!loadingMore && lastDoc && hasMore) {
      loadCanvases(false);
    }
  };

  const getTimeRemaining = (expiresAt: number): string => {
    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `${minutes}m`;
    }
    return `${hours}h`;
  };

  const navigateToCanvas = (canvasId: string) => {
    (navigation as any).navigate('CanvasEditor', { canvasId });
  };

  const renderCanvasCard = ({ item }: { item: Canvas }) => (
    <TouchableOpacity
      style={styles.canvasCard}
      onPress={() => navigateToCanvas(item.id)}
      activeOpacity={0.8}
    >
      {/* Canvas Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: item.backgroundColor }]}>
        {item.exportedImageUrl ? (
          <Image source={{ uri: item.exportedImageUrl }} style={styles.thumbnailImage} />
        ) : (
          <View style={[styles.placeholderThumbnail, { backgroundColor: item.backgroundColor }]}>
            <Ionicons name="color-palette" size={24} color={COLORS.slate400} />
            <Text style={styles.layerCount}>{item.layers?.length || 0} layers</Text>
          </View>
        )}

        {/* Time remaining overlay */}
        <View style={styles.timeOverlay}>
          <Ionicons name="time-outline" size={12} color={COLORS.white} />
          <Text style={styles.timeText}>{getTimeRemaining(item.expiresAt)}</Text>
        </View>
      </View>

      {/* Canvas Info */}
      <View style={styles.cardContent}>
        <Text style={styles.canvasTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.creatorText} numberOfLines={1}>
          by @{item.creatorUsername}
        </Text>

        {/* Canvas Info */}
        <View style={styles.canvasInfo}>
          <Text style={styles.layersText}>
            {item.layers?.length || 0} layers • {Object.keys(item.collaborators || {}).length} creators
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={12} color={COLORS.red400} />
            <Text style={styles.statText}>{item.likeCount || 0}</Text>
          </View>

          <View style={styles.stat}>
            <Ionicons name="eye" size={12} color={COLORS.cyan400} />
            <Text style={styles.statText}>{item.viewCount || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Discover Canvases</Text>
      <Text style={styles.headerSubtitle}>
        Explore collaborative art from the Fluxx community
      </Text>

      {/* Filter Tabs */}
<ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false}
  style={styles.filterContainer}
  contentContainerStyle={styles.filterContentContainer}
>
  {FILTERS.map((filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterTab,
        activeFilter === filter.key && styles.activeFilterTab,
      ]}
      onPress={() => setActiveFilter(filter.key)}
    >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={activeFilter === filter.key ? COLORS.white : COLORS.slate400}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.activeFilterText,
              ]}
            >
              {filter.label.split(' ')[1]} {/* Remove emoji, keep text */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading more canvases...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Discovering amazing canvases...</Text>
      </View>
    );
  }

  const renderEmptyState = () => {
    if (loading) return null;

    let message = '';
    let icon = '';

    switch (activeFilter) {
      case 'trending':
        message = 'No trending canvases right now.\nBe the first to create something viral!';
        icon = 'flame-outline';
        break;
      case 'popular':
        message = 'No popular canvases yet.\nCreate amazing art to get featured here!';
        icon = 'eye-outline';
        break;
      case 'new':
        message = 'No new canvases in the last 3 hours.\nStart creating fresh content!';
        icon = 'sparkles-outline';
        break;
      case 'expiring':
        message = 'No canvases expiring soon.\nEverything is still fresh!';
        icon = 'time-outline';
        break;
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name={icon as any} size={64} color={COLORS.slate600} />
        <Text style={styles.emptyMessage}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={canvases}
        renderItem={renderCanvasCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}  // ADD THIS LINE
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.cyan400]}
            tintColor={COLORS.cyan400}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.slate400,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60, // Account for status bar
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.slate400,
    marginBottom: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: COLORS.cyan500,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  canvasCard: {
    width: CARD_WIDTH,
    marginHorizontal: 5,
    marginBottom: 16,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: CARD_WIDTH * 1.2, // Slightly taller than square
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  layerCount: {
    fontSize: 12,
    color: COLORS.slate400,
    fontWeight: '600',
  },
  timeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  canvasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  creatorText: {
    fontSize: 12,
    color: COLORS.slate400,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: '600',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  canvasInfo: {
    marginBottom: 6,
  },
  layersText: {
    fontSize: 11,
    color: COLORS.slate500,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyMessage: {
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  filterContentContainer: {
    paddingRight: 20, // Extra padding at the end
  },
});

export default DiscoveryFeedScreen;
