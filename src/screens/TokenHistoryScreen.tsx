import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface TokenTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: any;
  relatedId?: string;
}

const TokenHistoryScreen = () => {
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const transactionsRef = collection(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'profiles',
      userId,
      'tokenTransactions'
    );

    const q = query(transactionsRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: TokenTransaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as TokenTransaction);
      });
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const getIconForType = (type: string) => {
    const icons: { [key: string]: string } = {
      daily_checkin: 'calendar',
      streak_bonus: 'flame',
      post: 'create',
      comment: 'chatbubble',
      voice_comment: 'mic',
      share: 'share-social',
    };
    return icons[type] || 'diamond';
  };

  const getColorForType = (type: string) => {
    const colors: { [key: string]: string } = {
      daily_checkin: COLORS.cyan400,
      streak_bonus: COLORS.orange500,
      post: COLORS.purple400,
      comment: COLORS.green500,
      voice_comment: COLORS.pink500,
      share: COLORS.amber400,
    };
    return colors[type] || COLORS.slate400;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = ({ item }: { item: TokenTransaction }) => {
    const icon = getIconForType(item.type);
    const color = getColorForType(item.type);

    return (
      <View style={styles.transactionCard}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>+{item.amount}</Text>
          <Ionicons name="diamond" size={16} color={COLORS.yellow400} />
        </View>
      </View>
    );
  };

  const totalTokens = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.slate900, COLORS.slate800]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token History</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Total Earned Banner */}
      <LinearGradient
        colors={[COLORS.yellow500, COLORS.orange500]}
        style={styles.totalBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="trophy" size={32} color={COLORS.white} />
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total Earned</Text>
          <View style={styles.totalAmountRow}>
            <Text style={styles.totalAmount}>{totalTokens}</Text>
            <Ionicons name="diamond" size={24} color={COLORS.white} />
          </View>
        </View>
      </LinearGradient>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={COLORS.slate600} />
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Start earning tokens by creating posts, commenting, and checking in daily!
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSpacer: {
    width: 40,
  },
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: COLORS.yellow500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.slate400,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.slate500,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate600,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.yellow400 + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.yellow400,
  },
});

export default TokenHistoryScreen;
