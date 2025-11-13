// src/data/canvasTemplates.ts

export interface CanvasTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  suggestedPrompts: string[];
  maxLayers: number;
  totalPages: number;
  category: 'social' | 'creative' | 'productivity' | 'fun' | 'lifestyle';
  popularity: number;
  tags?: string[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  // ========================================
  // CATEGORY: SOCIAL (Celebrations & Events)
  // ========================================
  {
    id: 'birthday_bash',
    title: 'Birthday Bash',
    description: '🎉 Celebrate another trip around the sun',
    icon: 'gift',
    backgroundColor: '#FF6B9D',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add birthday photos',
      'Write birthday wishes',
      'Share funny memories',
      'Add embarrassing moments',
    ],
    category: 'social',
    popularity: 10,
    tags: ['birthday', 'party', 'celebration'],
  },
  {
    id: 'grad_party',
    title: 'Graduation Party',
    description: '🎓 Celebrate your achievement',
    icon: 'school',
    backgroundColor: '#4A90E2',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add graduation photos',
      'Share future plans',
      'Thank your supporters',
      'Add cap decorations',
    ],
    category: 'social',
    popularity: 8,
    tags: ['graduation', 'achievement', 'milestone'],
  },
  {
    id: 'wedding_vibes',
    title: 'Wedding Vibes',
    description: '💍 Celebrate love & marriage',
    icon: 'heart-circle',
    backgroundColor: '#FFF0F5',
    maxLayers: 15, // ⭐ PREMIUM FEEL
    totalPages: 3,  // ⭐ PREMIUM FEEL
    suggestedPrompts: [
      'Add ceremony photos',
      'Share vows',
      'Reception highlights',
      'Guest messages',
    ],
    category: 'social',
    popularity: 7,
    tags: ['wedding', 'marriage', 'love'],
  },
  {
    id: 'baby_shower',
    title: 'Baby Shower',
    description: '👶 Welcome the little one',
    icon: 'body',
    backgroundColor: '#B4E7CE',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add baby bump pics',
      'Share name ideas',
      'Nursery setup',
      'Well wishes',
    ],
    category: 'social',
    popularity: 6,
    tags: ['baby', 'shower', 'pregnancy'],
  },
  {
    id: 'friend_roast',
    title: 'Friend Roast',
    description: '🔥 Roast your bestie (with love)',
    icon: 'flame',
    backgroundColor: '#FF5733',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add embarrassing photos',
      'Write savage roasts',
      'Share awkward moments',
      'Tag the victim',
    ],
    category: 'fun',
    popularity: 10,
    tags: ['roast', 'funny', 'friends', 'memes'],
  },
  {
    id: 'reunion',
    title: 'Squad Reunion',
    description: '👥 The gang back together',
    icon: 'people',
    backgroundColor: '#FFD700',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add group photos',
      'Share catching-up moments',
      'Remember old times',
      'Future plans',
    ],
    category: 'social',
    popularity: 7,
    tags: ['reunion', 'friends', 'squad'],
  },

  // ========================================
  // CATEGORY: CREATIVE (Art & Expression)
  // ========================================
  {
    id: 'photo_dump',
    title: 'Photo Dump',
    description: '📸 Unfiltered chaos, raw moments, no filter needed',
    icon: 'images',
    backgroundColor: '#2C2C2E',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add random moments',
      'Mix unfiltered pics',
      'Create authentic vibes',
      'No caption needed',
    ],
    category: 'creative',
    popularity: 10,
    tags: ['photo', 'dump', 'aesthetic', 'instagram'],
  },
  {
    id: 'moodboard',
    title: 'Aesthetic Moodboard',
    description: '🎨 Curate your visual vibe',
    icon: 'color-palette',
    backgroundColor: '#F5E6D3',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add inspiration pics',
      'Create color themes',
      'Collect design ideas',
      'Build your aesthetic',
    ],
    category: 'creative',
    popularity: 9,
    tags: ['moodboard', 'aesthetic', 'design', 'inspo'],
  },
  {
    id: 'outfit_inspo',
    title: 'Outfit Inspo',
    description: '👗 Fashion & style ideas',
    icon: 'shirt',
    backgroundColor: '#FFE4E1',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add outfit photos',
      'Style combinations',
      'Fashion references',
      'OOTD archive',
    ],
    category: 'lifestyle',
    popularity: 8,
    tags: ['fashion', 'outfit', 'style', 'ootd'],
  },
  {
    id: 'art_portfolio',
    title: 'Art Portfolio',
    description: '🖼️ Showcase your creative work',
    icon: 'brush',
    backgroundColor: '#1A1A2E',
    maxLayers: 15, // ⭐ PREMIUM FEEL
    totalPages: 3,  // ⭐ PREMIUM FEEL
    suggestedPrompts: [
      'Add your artwork',
      'Show WIP process',
      'Share art journey',
      'Get feedback',
    ],
    category: 'creative',
    popularity: 7,
    tags: ['art', 'portfolio', 'creative', 'design'],
  },
  {
    id: 'music_recs',
    title: 'Music Recs',
    description: '🎵 Share your playlist vibes',
    icon: 'musical-notes',
    backgroundColor: '#1DB954',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add album covers',
      'Share favorite lyrics',
      'Current obsessions',
      'Concert memories',
    ],
    category: 'lifestyle',
    popularity: 8,
    tags: ['music', 'playlist', 'spotify', 'songs'],
  },
  {
    id: 'movie_marathon',
    title: 'Movie Marathon',
    description: '🎬 Film watch list & reviews',
    icon: 'film',
    backgroundColor: '#1A1A2E',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add movie posters',
      'Rate your favorites',
      'Share hot takes',
      'Recommend films',
    ],
    category: 'lifestyle',
    popularity: 7,
    tags: ['movies', 'films', 'watchlist', 'reviews'],
  },
  {
    id: 'book_club',
    title: 'Book Club',
    description: '📚 Reading list & book reviews',
    icon: 'book',
    backgroundColor: '#8B4513',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add book covers',
      'Share favorite quotes',
      'Review your reads',
      'TBR pile',
    ],
    category: 'lifestyle',
    popularity: 6,
    tags: ['books', 'reading', 'bookclub', 'literature'],
  },

  // ========================================
  // CATEGORY: LIFESTYLE (Travel & Living)
  // ========================================
  {
    id: 'travel_diary',
    title: 'Travel Diary',
    description: '✈️ Document your adventures',
    icon: 'airplane',
    backgroundColor: '#87CEEB',
    maxLayers: 15, // ⭐ PREMIUM FEEL
    totalPages: 3,  // ⭐ PREMIUM FEEL
    suggestedPrompts: [
      'Add travel photos',
      'Mark locations',
      'Share experiences',
      'Travel tips',
    ],
    category: 'lifestyle',
    popularity: 9,
    tags: ['travel', 'vacation', 'adventure', 'explore'],
  },
  {
    id: 'foodie_finds',
    title: 'Foodie Finds',
    description: '🍕 Best eats & restaurant recs',
    icon: 'restaurant',
    backgroundColor: '#FF6347',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add food pics',
      'Rate restaurants',
      'Share recipes',
      'Cooking experiments',
    ],
    category: 'lifestyle',
    popularity: 8,
    tags: ['food', 'restaurants', 'cooking', 'recipes'],
  },
  {
    id: 'home_decor',
    title: 'Home Decor',
    description: '🏡 Interior design inspiration',
    icon: 'home',
    backgroundColor: '#F0EAD6',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add room photos',
      'Design ideas',
      'Before & after',
      'Decor shopping list',
    ],
    category: 'lifestyle',
    popularity: 7,
    tags: ['home', 'decor', 'interior', 'design'],
  },
  {
    id: 'pet_tribute',
    title: 'Pet Tribute',
    description: '🐾 Celebrate your furry friend',
    icon: 'paw',
    backgroundColor: '#C5A3FF',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add pet photos',
      'Share funny moments',
      'Pet personality',
      'Favorite memories',
    ],
    category: 'lifestyle',
    popularity: 9,
    tags: ['pets', 'dogs', 'cats', 'animals'],
  },

  // ========================================
  // CATEGORY: PRODUCTIVITY (Goals & Growth)
  // ========================================
  {
    id: 'vision_board',
    title: 'Vision Board',
    description: '✨ Manifest your 2026 goals',
    icon: 'star',
    backgroundColor: '#D4AF37',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add dream goals',
      'Visualize success',
      'Create affirmations',
      'Track milestones',
    ],
    category: 'productivity',
    popularity: 10,
    tags: ['goals', 'vision', 'manifestation', 'dreams'],
  },
  {
    id: 'study_notes',
    title: 'Study Notes',
    description: '📝 Organize your learning',
    icon: 'newspaper',
    backgroundColor: '#FFF8DC',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add study notes',
      'Share resources',
      'Create flashcards',
      'Exam prep',
    ],
    category: 'productivity',
    popularity: 7,
    tags: ['study', 'notes', 'learning', 'school'],
  },
  {
    id: 'workout_tracker',
    title: 'Gym Progress',
    description: '💪 Track your fitness journey',
    icon: 'barbell',
    backgroundColor: '#4CAF50',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add progress pics',
      'Log workouts',
      'Share PRs',
      'Meal prep ideas',
    ],
    category: 'productivity',
    popularity: 8,
    tags: ['fitness', 'gym', 'workout', 'health'],
  },
  {
    id: 'habit_tracker',
    title: 'Habit Tracker',
    description: '📊 Build better routines',
    icon: 'checkbox',
    backgroundColor: '#00CED1',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'List daily habits',
      'Track progress',
      'Share wins',
      'Accountability check',
    ],
    category: 'productivity',
    popularity: 7,
    tags: ['habits', 'routine', 'productivity', 'self-improvement'],
  },
  {
    id: 'career_goals',
    title: 'Career Goals',
    description: '💼 Professional development',
    icon: 'briefcase',
    backgroundColor: '#4169E1',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Set career goals',
      'Track achievements',
      'Skills to learn',
      'Network contacts',
    ],
    category: 'productivity',
    popularity: 6,
    tags: ['career', 'professional', 'goals', 'business'],
  },
  {
    id: 'budget_planner',
    title: 'Budget Planner',
    description: '💰 Money management made easy',
    icon: 'cash',
    backgroundColor: '#228B22',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Track expenses',
      'Savings goals',
      'Budget breakdown',
      'Financial wins',
    ],
    category: 'productivity',
    popularity: 6,
    tags: ['budget', 'money', 'finance', 'savings'],
  },

  // ========================================
  // CATEGORY: FUN (Games & Entertainment)
  // ========================================
  {
    id: 'this_or_that',
    title: 'This or That',
    description: '🤔 Quick preference game',
    icon: 'shuffle',
    backgroundColor: '#FF69B4',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add choice options',
      'Vote with friends',
      'Share results',
      'Debate picks',
    ],
    category: 'fun',
    popularity: 9,
    tags: ['game', 'choices', 'interactive', 'fun'],
  },
  {
    id: 'bingo_card',
    title: 'Bingo Card',
    description: '🎯 Create custom bingo game',
    icon: 'grid',
    backgroundColor: '#FFD700',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add bingo squares',
      'Themed categories',
      'Track completions',
      'Play with friends',
    ],
    category: 'fun',
    popularity: 7,
    tags: ['bingo', 'game', 'challenge', 'interactive'],
  },
  {
    id: 'wrapped',
    title: 'Year Wrapped',
    description: '🎁 Your year in review',
    icon: 'calendar',
    backgroundColor: '#1DB954',
    maxLayers: 15, // ⭐ PREMIUM FEEL
    totalPages: 3,  // ⭐ PREMIUM FEEL
    suggestedPrompts: [
      'Top moments',
      'Best memories',
      'Lessons learned',
      'Next year goals',
    ],
    category: 'fun',
    popularity: 10,
    tags: ['year', 'review', 'wrapped', 'memories'],
  },

  // ========================================
  // CATEGORY: RELATIONSHIPS
  // ========================================
  {
    id: 'couples_canvas',
    title: 'Couples Canvas',
    description: '💕 Celebrate your relationship',
    icon: 'heart',
    backgroundColor: '#FFB6C1',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add couple photos',
      'Love notes',
      'Anniversary memories',
      'Future plans together',
    ],
    category: 'social',
    popularity: 8,
    tags: ['couples', 'relationship', 'love', 'romance'],
  },
  {
    id: 'friendship_anniversary',
    title: 'Friendship Anniversary',
    description: '👯 Celebrate your bestie',
    icon: 'people-circle',
    backgroundColor: '#FFE4B5',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'First meeting story',
      'Inside jokes',
      'Favorite memories',
      'Future adventures',
    ],
    category: 'social',
    popularity: 8,
    tags: ['friendship', 'bestfriends', 'anniversary', 'memories'],
  },

  // ========================================
  // CATEGORY: SPECIAL USE CASES
  // ========================================
  {
    id: 'quick_flex',
    title: 'Quick Flex',
    description: '💎 Minimalist showcase',
    icon: 'diamond',
    backgroundColor: '#000000',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [
      'Add flex pics',
      'Keep it minimal',
      'Curated aesthetic',
      'Less is more',
    ],
    category: 'creative',
    popularity: 7,
    tags: ['flex', 'minimal', 'aesthetic', 'showcase'],
  },
  {
    id: 'blank_canvas',
    title: 'Blank Canvas',
    description: '⚡ Start from scratch',
    icon: 'create',
    backgroundColor: '#1E293B',
    maxLayers: 12,
    totalPages: 2,
    suggestedPrompts: [],
    category: 'creative',
    popularity: 10,
    tags: ['blank', 'custom', 'freestyle'],
  },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export const getTemplateById = (id: string): CanvasTemplate | undefined => {
  return CANVAS_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): CanvasTemplate[] => {
  return CANVAS_TEMPLATES.filter(template => template.category === category);
};

export const getPopularTemplates = (limit?: number): CanvasTemplate[] => {
  const sorted = [...CANVAS_TEMPLATES].sort((a, b) => b.popularity - a.popularity);
  return limit ? sorted.slice(0, limit) : sorted;
};

export const getTrendingTemplates = (): CanvasTemplate[] => {
  return CANVAS_TEMPLATES.filter(t => t.popularity >= 9);
};

export const searchTemplates = (query: string): CanvasTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return CANVAS_TEMPLATES.filter(template => 
    template.title.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const CATEGORY_LABELS = {
  social: '👥 Social',
  creative: '🎨 Creative',
  productivity: '📊 Productivity',
  fun: '🎮 Fun',
  lifestyle: '✨ Lifestyle',
};