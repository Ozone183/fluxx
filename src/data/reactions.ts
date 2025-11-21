// src/data/reactions.ts

export type ReactionType = 
  // ❤️ LOVE & AFFECTION (Original + New)
  | 'heart' | 'heart_eyes' | 'kiss' | 'sparkling_heart' | 'two_hearts' 
  | 'cupid' | 'love_letter' | 'heart_hands' | 'smiling_face_with_hearts'
  
  // 🔥 HYPE & ENERGY (Original + New)
  | 'fire' | 'sparkles' | 'star' | 'glowing_star' | 'dizzy' | 'boom' 
  | 'zap' | 'rocket' | 'crown' | 'gem'
  
  // 😂 FUNNY & JOY (Original + New)
  | 'laugh' | 'joy' | 'rofl' | 'sweat_smile' | 'grin' | 'sunglasses'
  | 'smirk' | 'upside_down' | 'wink' | 'tongue_out'
  
  // 👏 SUPPORT & CELEBRATION (Original + New)
  | 'clap' | 'raised_hands' | 'pray' | 'muscle' | 'victory' 
  | 'thumbs_up' | 'ok_hand' | 'fist_bump' | 'handshake' | 'wave'
  
  // 🎉 CELEBRATION & PARTY
  | 'party' | 'tada' | 'confetti_ball' | 'balloon' | 'trophy' 
  | 'medal' | 'gift' | 'cake' | 'champagne' | 'fireworks'
  
  // 😮 EMOTION & REACTION
  | 'cry' | 'sob' | 'pleading' | 'shocked' | 'scream' 
  | 'mind_blown' | 'thinking' | 'monocle' | 'shush' | 'eyes'
  
  // 🎨 CREATIVE & AESTHETIC
  | 'art' | 'rainbow' | 'camera' | 'music_notes' | 'headphone'
  | 'microphone' | 'paintbrush' | 'film' | 'books' | 'magic'
  
  // 🍕 FOOD & LIFESTYLE
  | 'pizza' | 'burger' | 'coffee' | 'wine' | 'cake_slice'
  | 'ice_cream' | 'donut' | 'taco' | 'sushi' | 'hot_beverage';

export interface Reaction {
  id: ReactionType;
  emoji: string;
  label: string;
  category: ReactionCategory;
  isPremium?: boolean;
}

export type ReactionCategory = 
  | 'love' 
  | 'hype' 
  | 'funny' 
  | 'support' 
  | 'celebration' 
  | 'emotion' 
  | 'creative' 
  | 'lifestyle';

export const REACTION_CATEGORIES: Record<ReactionCategory, string> = {
  love: '❤️ Love',
  hype: '🔥 Hype',
  funny: '😂 Funny',
  support: '👏 Support',
  celebration: '🎉 Party',
  emotion: '😮 Feelings',
  creative: '🎨 Creative',
  lifestyle: '🍕 Vibes',
};

export const ALL_REACTIONS: Reaction[] = [
  // ❤️ LOVE & AFFECTION
  { id: 'heart', emoji: '❤️', label: 'Heart', category: 'love' },
  { id: 'heart_eyes', emoji: '😍', label: 'Heart Eyes', category: 'love' },
  { id: 'kiss', emoji: '😘', label: 'Kiss', category: 'love' },
  { id: 'sparkling_heart', emoji: '💖', label: 'Sparkling Heart', category: 'love' },
  { id: 'two_hearts', emoji: '💕', label: 'Two Hearts', category: 'love' },
  { id: 'cupid', emoji: '💘', label: 'Cupid', category: 'love' },
  { id: 'love_letter', emoji: '💌', label: 'Love Letter', category: 'love' },
  { id: 'heart_hands', emoji: '🫶', label: 'Heart Hands', category: 'love' },
  { id: 'smiling_face_with_hearts', emoji: '🥰', label: 'Smiling Hearts', category: 'love' },

  // 🔥 HYPE & ENERGY
  { id: 'fire', emoji: '🔥', label: 'Fire', category: 'hype' },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles', category: 'hype' },
  { id: 'star', emoji: '⭐', label: 'Star', category: 'hype' },
  { id: 'glowing_star', emoji: '🌟', label: 'Glowing Star', category: 'hype' },
  { id: 'dizzy', emoji: '💫', label: 'Dizzy', category: 'hype' },
  { id: 'boom', emoji: '💥', label: 'Boom', category: 'hype' },
  { id: 'zap', emoji: '⚡', label: 'Zap', category: 'hype' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket', category: 'hype' },
  { id: 'crown', emoji: '👑', label: 'Crown', category: 'hype' },
  { id: 'gem', emoji: '💎', label: 'Gem', category: 'hype' },

  // 😂 FUNNY & JOY
  { id: 'laugh', emoji: '😂', label: 'Laugh', category: 'funny' },
  { id: 'joy', emoji: '😄', label: 'Joy', category: 'funny' },
  { id: 'rofl', emoji: '🤣', label: 'ROFL', category: 'funny' },
  { id: 'sweat_smile', emoji: '😅', label: 'Sweat Smile', category: 'funny' },
  { id: 'grin', emoji: '😁', label: 'Grin', category: 'funny' },
  { id: 'sunglasses', emoji: '😎', label: 'Cool', category: 'funny' },
  { id: 'smirk', emoji: '😏', label: 'Smirk', category: 'funny' },
  { id: 'upside_down', emoji: '🙃', label: 'Upside Down', category: 'funny' },
  { id: 'wink', emoji: '😉', label: 'Wink', category: 'funny' },
  { id: 'tongue_out', emoji: '😛', label: 'Tongue Out', category: 'funny' },

  // 👏 SUPPORT & CELEBRATION
  { id: 'clap', emoji: '👏', label: 'Clap', category: 'support' },
  { id: 'raised_hands', emoji: '🙌', label: 'Raised Hands', category: 'support' },
  { id: 'pray', emoji: '🙏', label: 'Pray', category: 'support' },
  { id: 'muscle', emoji: '💪', label: 'Muscle', category: 'support' },
  { id: 'victory', emoji: '✌️', label: 'Victory', category: 'support' },
  { id: 'thumbs_up', emoji: '👍', label: 'Thumbs Up', category: 'support' },
  { id: 'ok_hand', emoji: '👌', label: 'OK', category: 'support' },
  { id: 'fist_bump', emoji: '👊', label: 'Fist Bump', category: 'support' },
  { id: 'handshake', emoji: '🤝', label: 'Handshake', category: 'support' },
  { id: 'wave', emoji: '👋', label: 'Wave', category: 'support' },

  // 🎉 CELEBRATION & PARTY
  { id: 'party', emoji: '🥳', label: 'Party', category: 'celebration' },
  { id: 'tada', emoji: '🎊', label: 'Tada', category: 'celebration' },
  { id: 'confetti_ball', emoji: '🎉', label: 'Confetti', category: 'celebration' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon', category: 'celebration' },
  { id: 'trophy', emoji: '🏆', label: 'Trophy', category: 'celebration' },
  { id: 'medal', emoji: '🏅', label: 'Medal', category: 'celebration' },
  { id: 'gift', emoji: '🎁', label: 'Gift', category: 'celebration' },
  { id: 'cake', emoji: '🎂', label: 'Cake', category: 'celebration' },
  { id: 'champagne', emoji: '🍾', label: 'Champagne', category: 'celebration' },
  { id: 'fireworks', emoji: '🎆', label: 'Fireworks', category: 'celebration' },

  // 😮 EMOTION & REACTION
  { id: 'cry', emoji: '😢', label: 'Cry', category: 'emotion' },
  { id: 'sob', emoji: '😭', label: 'Sob', category: 'emotion' },
  { id: 'pleading', emoji: '🥺', label: 'Pleading', category: 'emotion' },
  { id: 'shocked', emoji: '😱', label: 'Shocked', category: 'emotion' },
  { id: 'scream', emoji: '😨', label: 'Scream', category: 'emotion' },
  { id: 'mind_blown', emoji: '🤯', label: 'Mind Blown', category: 'emotion' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking', category: 'emotion' },
  { id: 'monocle', emoji: '🧐', label: 'Monocle', category: 'emotion' },
  { id: 'shush', emoji: '🤫', label: 'Shush', category: 'emotion' },
  { id: 'eyes', emoji: '👀', label: 'Eyes', category: 'emotion' },

  // 🎨 CREATIVE & AESTHETIC
  { id: 'art', emoji: '🎨', label: 'Art', category: 'creative' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow', category: 'creative' },
  { id: 'camera', emoji: '📸', label: 'Camera', category: 'creative' },
  { id: 'music_notes', emoji: '🎵', label: 'Music', category: 'creative' },
  { id: 'headphone', emoji: '🎧', label: 'Headphone', category: 'creative' },
  { id: 'microphone', emoji: '🎤', label: 'Microphone', category: 'creative' },
  { id: 'paintbrush', emoji: '🖌️', label: 'Paintbrush', category: 'creative' },
  { id: 'film', emoji: '🎬', label: 'Film', category: 'creative' },
  { id: 'books', emoji: '📚', label: 'Books', category: 'creative' },
  { id: 'magic', emoji: '✨', label: 'Magic', category: 'creative' },

  // 🍕 FOOD & LIFESTYLE
  { id: 'pizza', emoji: '🍕', label: 'Pizza', category: 'lifestyle' },
  { id: 'burger', emoji: '🍔', label: 'Burger', category: 'lifestyle' },
  { id: 'coffee', emoji: '☕', label: 'Coffee', category: 'lifestyle' },
  { id: 'wine', emoji: '🍷', label: 'Wine', category: 'lifestyle' },
  { id: 'cake_slice', emoji: '🍰', label: 'Cake', category: 'lifestyle' },
  { id: 'ice_cream', emoji: '🍦', label: 'Ice Cream', category: 'lifestyle' },
  { id: 'donut', emoji: '🍩', label: 'Donut', category: 'lifestyle' },
  { id: 'taco', emoji: '🌮', label: 'Taco', category: 'lifestyle' },
  { id: 'sushi', emoji: '🍣', label: 'Sushi', category: 'lifestyle' },
  { id: 'hot_beverage', emoji: '☕', label: 'Hot Drink', category: 'lifestyle' },
];

// Helper functions
export const getReactionsByCategory = (category: ReactionCategory): Reaction[] => {
  return ALL_REACTIONS.filter(r => r.category === category);
};

export const getReactionById = (id: ReactionType): Reaction | undefined => {
  return ALL_REACTIONS.find(r => r.id === id);
};

export const getPopularReactions = (): Reaction[] => {
  // Return the original 6 + most popular ones
  return ALL_REACTIONS.filter(r => 
    ['heart', 'fire', 'laugh', 'clap', 'heart_eyes', 'sparkles', 
     'party', 'cry', 'rocket', 'gem', 'pizza', 'mind_blown'].includes(r.id)
  );
};

export const QUICK_REACTIONS: ReactionType[] = [
  'heart', 'fire', 'laugh', 'clap', 'party', 'cry', 'rocket', 'pizza'
];
