import { doc, updateDoc, increment, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';

export type TokenTransactionType = 
  | 'daily_checkin' 
  | 'streak_bonus' 
  | 'share' 
  | 'post' 
  | 'comment' 
  | 'voice_comment';

interface AwardTokensParams {
  userId: string;
  amount: number;
  type: TokenTransactionType;
  description: string;
  relatedId?: string; // Related post/comment ID
}

/**
 * Award tokens to a user and log the transaction
 */
export const awardTokens = async (params: AwardTokensParams) => {
  const { userId, amount, type, description, relatedId } = params;

  try {
    // Update user's token balance
    const profileRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'profiles',
      userId
    );

    await updateDoc(profileRef, {
      tokens: increment(amount),
    });

    // Log transaction
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

    await addDoc(transactionsRef, {
      amount,
      type,
      description,
      relatedId: relatedId || null,
      timestamp: serverTimestamp(),
    });

    console.log(`🪙 Awarded ${amount} tokens to ${userId} for ${type}`);
    return true;
  } catch (error) {
    console.error('Award tokens error:', error);
    return false;
  }
};

/**
 * Check if user is eligible for daily check-in
 */
export const checkDailyCheckInEligibility = async (userId: string): Promise<boolean> => {
  try {
    const profileRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'profiles',
      userId
    );

    const profileDoc = await getDoc(profileRef);
    if (!profileDoc.exists()) return false;

    const profileData = profileDoc.data();
    const lastCheckIn = profileData.lastCheckIn?.toDate();

    if (!lastCheckIn) return true; // First time check-in

    // Check if last check-in was on a different day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckInDate = new Date(lastCheckIn);
    lastCheckInDate.setHours(0, 0, 0, 0);

    return today.getTime() > lastCheckInDate.getTime();
  } catch (error) {
    console.error('Check eligibility error:', error);
    return false;
  }
};

/**
 * Process daily check-in and award tokens
 */
export const processDailyCheckIn = async (userId: string): Promise<{ success: boolean; tokens: number; streak: number }> => {
  try {
    const profileRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'profiles',
      userId
    );

    const profileDoc = await getDoc(profileRef);
    if (!profileDoc.exists()) {
      return { success: false, tokens: 0, streak: 0 };
    }

    const profileData = profileDoc.data();
    const lastCheckIn = profileData.lastCheckIn?.toDate();
    const currentStreak = profileData.checkInStreak || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = 1;
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn);
      lastCheckInDate.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if last check-in was yesterday (continue streak)
      if (lastCheckInDate.getTime() === yesterday.getTime()) {
        newStreak = currentStreak + 1;
      }
    }

    // Base reward
    let tokensAwarded = 10;

    // Streak bonus (every 7 days)
    if (newStreak % 7 === 0 && newStreak > 0) {
      tokensAwarded += 50;
    }

    // Update profile
    await updateDoc(profileRef, {
      lastCheckIn: serverTimestamp(),
      checkInStreak: newStreak,
    });

    // Award tokens
    await awardTokens({
      userId,
      amount: tokensAwarded,
      type: 'daily_checkin',
      description: newStreak % 7 === 0 
        ? `Daily check-in + ${newStreak} day streak bonus!`
        : 'Daily check-in reward',
    });

    return { success: true, tokens: tokensAwarded, streak: newStreak };
  } catch (error) {
    console.error('Process check-in error:', error);
    return { success: false, tokens: 0, streak: 0 };
  }
};
