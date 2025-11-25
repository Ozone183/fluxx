// src/data/premiumTemplates.ts

import { CanvasLayer } from '../types/canvas';

export interface PremiumTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  category: 'social' | 'creative' | 'productivity' | 'fun' | 'lifestyle';
  popularity: number;
  tags: string[];
  layers: CanvasLayer[];
  totalPages: number;
  maxLayers: number;
}

// Helper function to create placeholder layers
const createPlaceholderLayer = (
  id: string,
  type: 'image' | 'text',
  position: { x: number; y: number },
  size: { width: number; height: number },
  options?: {
    text?: string;
    fontSize?: number;
    fontColor?: string;
    zIndex?: number;
    pageIndex?: number;
  }
): CanvasLayer => ({
  id,
  type,
  position,
  size,
  rotation: 0,
  zIndex: options?.zIndex || 1,
  pageIndex: options?.pageIndex || 0,
  createdBy: 'system',
  createdByUsername: 'Fluxx',
  createdByProfilePic: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  placeholder: true, // 👈 Mark as placeholder
  ...(type === 'text' && {
    text: options?.text || 'Add text here',
    fontSize: options?.fontSize || 24,
    fontColor: options?.fontColor || '#FFFFFF',
  }),
  ...(type === 'image' && {
    imageUrl: '', // Empty, waiting for user upload
  }),
});

// ========================================
// 1. PHOTO DUMP - Grid Layout
// ========================================
export const PHOTO_DUMP_TEMPLATE: PremiumTemplate = {
  id: 'photo_dump_premium',
  title: 'Photo Dump Pro',
  description: '📸 Professional grid layout - 6 photo slots',
  icon: 'images',
  backgroundColor: '#2C2C2E',
  category: 'creative',
  popularity: 10,
  tags: ['photo', 'dump', 'grid', 'aesthetic'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Top Row (3 photos)
    createPlaceholderLayer('pd-1', 'image', { x: 10, y: 20 }, { width: 100, height: 140 }, { zIndex: 1 }),
    createPlaceholderLayer('pd-2', 'image', { x: 125, y: 20 }, { width: 100, height: 140 }, { zIndex: 1 }),
    createPlaceholderLayer('pd-3', 'image', { x: 240, y: 20 }, { width: 100, height: 140 }, { zIndex: 1 }),
    
    // Bottom Row (3 photos)
    createPlaceholderLayer('pd-4', 'image', { x: 10, y: 175 }, { width: 100, height: 140 }, { zIndex: 1 }),
    createPlaceholderLayer('pd-5', 'image', { x: 125, y: 175 }, { width: 100, height: 140 }, { zIndex: 1 }),
    createPlaceholderLayer('pd-6', 'image', { x: 240, y: 175 }, { width: 100, height: 140 }, { zIndex: 1 }),
    
    // Title Text
    createPlaceholderLayer('pd-title', 'text', { x: 20, y: 330 }, { width: 310, height: 50 }, {
      text: 'my vibe lately ✨',
      fontSize: 28,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Caption Text
    createPlaceholderLayer('pd-caption', 'text', { x: 20, y: 390 }, { width: 310, height: 40 }, {
      text: 'unfiltered moments 📷',
      fontSize: 16,
      fontColor: '#94A3B8',
      zIndex: 2,
    }),
  ],
};

// ========================================
// 2. BIRTHDAY BASH - Celebration Layout
// ========================================
export const BIRTHDAY_BASH_TEMPLATE: PremiumTemplate = {
  id: 'birthday_bash_premium',
  title: 'Birthday Bash Pro',
  description: '🎉 Celebration card with photo & wishes',
  icon: 'gift',
  backgroundColor: '#FF6B9D',
  category: 'social',
  popularity: 10,
  tags: ['birthday', 'party', 'celebration'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Hero Photo Slot
    createPlaceholderLayer('bb-hero', 'image', { x: 25, y: 40 }, { width: 300, height: 220 }, { zIndex: 1 }),
    
    // Birthday Title
    createPlaceholderLayer('bb-title', 'text', { x: 40, y: 280 }, { width: 270, height: 60 }, {
      text: 'HAPPY BIRTHDAY! 🎉',
      fontSize: 32,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Birthday Message
    createPlaceholderLayer('bb-message', 'text', { x: 40, y: 350 }, { width: 270, height: 120 }, {
      text: 'another year of being awesome! hope this year brings you everything you wish for 🎂✨',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Age Badge
    createPlaceholderLayer('bb-age', 'text', { x: 280, y: 60 }, { width: 50, height: 50 }, {
      text: '24',
      fontSize: 36,
      fontColor: '#FFD700',
      zIndex: 3,
    }),
  ],
};

// ========================================
// 3. VISION BOARD - Goals Sections
// ========================================
export const VISION_BOARD_TEMPLATE: PremiumTemplate = {
  id: 'vision_board_premium',
  title: 'Vision Board Pro',
  description: '✨ Organized goal sections - career, health, money',
  icon: 'star',
  backgroundColor: '#D4AF37',
  category: 'productivity',
  popularity: 10,
  tags: ['goals', 'vision', 'manifestation'],
  totalPages: 1,
  maxLayers: 15,
  layers: [
    // Title
    createPlaceholderLayer('vb-title', 'text', { x: 50, y: 20 }, { width: 250, height: 40 }, {
      text: '2026 VISION BOARD ✨',
      fontSize: 24,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Career Section
    createPlaceholderLayer('vb-career-label', 'text', { x: 20, y: 70 }, { width: 150, height: 30 }, {
      text: '💼 Career',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    createPlaceholderLayer('vb-career-img', 'image', { x: 20, y: 105 }, { width: 150, height: 110 }, { zIndex: 1 }),
    
    // Health Section
    createPlaceholderLayer('vb-health-label', 'text', { x: 185, y: 70 }, { width: 150, height: 30 }, {
      text: '💪 Health',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    createPlaceholderLayer('vb-health-img', 'image', { x: 185, y: 105 }, { width: 150, height: 110 }, { zIndex: 1 }),
    
    // Relationships Section
    createPlaceholderLayer('vb-relationship-label', 'text', { x: 20, y: 230 }, { width: 150, height: 30 }, {
      text: '💕 Love',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    createPlaceholderLayer('vb-relationship-img', 'image', { x: 20, y: 265 }, { width: 150, height: 110 }, { zIndex: 1 }),
    
    // Money Section
    createPlaceholderLayer('vb-money-label', 'text', { x: 185, y: 230 }, { width: 150, height: 30 }, {
      text: '💰 Wealth',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    createPlaceholderLayer('vb-money-img', 'image', { x: 185, y: 265 }, { width: 150, height: 110 }, { zIndex: 1 }),
    
    // Affirmation
    createPlaceholderLayer('vb-affirmation', 'text', { x: 30, y: 390 }, { width: 290, height: 80 }, {
      text: 'I am worthy of everything I desire 🌟',
      fontSize: 20,
      fontColor: '#FFD700',
      zIndex: 2,
    }),
  ],
};

// ========================================
// 4. YEAR WRAPPED - Multi-Page Story
// ========================================
export const YEAR_WRAPPED_TEMPLATE: PremiumTemplate = {
  id: 'year_wrapped_premium',
  title: 'Year Wrapped Pro',
  description: '🎁 Your year in review - 3 pages',
  icon: 'calendar',
  backgroundColor: '#1DB954',
  category: 'fun',
  popularity: 10,
  tags: ['year', 'review', 'wrapped'],
  totalPages: 3,
  maxLayers: 15,
  layers: [
    // ========== PAGE 1: INTRO ==========
    createPlaceholderLayer('yw-intro-title', 'text', { x: 50, y: 100 }, { width: 250, height: 60 }, {
      text: '2025 WRAPPED 🎁',
      fontSize: 36,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 0,
    }),
    createPlaceholderLayer('yw-intro-subtitle', 'text', { x: 70, y: 180 }, { width: 210, height: 40 }, {
      text: 'what a year it was...',
      fontSize: 18,
      fontColor: '#B3B3B3',
      zIndex: 2,
      pageIndex: 0,
    }),
    createPlaceholderLayer('yw-intro-img', 'image', { x: 75, y: 240 }, { width: 200, height: 240 }, { 
      zIndex: 1,
      pageIndex: 0,
    }),
    
    // ========== PAGE 2: TOP MOMENTS ==========
    createPlaceholderLayer('yw-moments-title', 'text', { x: 50, y: 30 }, { width: 250, height: 40 }, {
      text: 'TOP MOMENTS 🌟',
      fontSize: 28,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 1,
    }),
    createPlaceholderLayer('yw-moment-1', 'image', { x: 20, y: 85 }, { width: 155, height: 120 }, { 
      zIndex: 1,
      pageIndex: 1,
    }),
    createPlaceholderLayer('yw-moment-2', 'image', { x: 185, y: 85 }, { width: 155, height: 120 }, { 
      zIndex: 1,
      pageIndex: 1,
    }),
    createPlaceholderLayer('yw-moment-3', 'image', { x: 20, y: 215 }, { width: 155, height: 120 }, { 
      zIndex: 1,
      pageIndex: 1,
    }),
    createPlaceholderLayer('yw-moment-4', 'image', { x: 185, y: 215 }, { width: 155, height: 120 }, { 
      zIndex: 1,
      pageIndex: 1,
    }),
    createPlaceholderLayer('yw-moments-caption', 'text', { x: 40, y: 350 }, { width: 270, height: 80 }, {
      text: 'best memories of the year ✨',
      fontSize: 20,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 1,
    }),
    
    // ========== PAGE 3: LESSONS LEARNED ==========
    createPlaceholderLayer('yw-lessons-title', 'text', { x: 50, y: 50 }, { width: 250, height: 40 }, {
      text: 'LESSONS LEARNED 💡',
      fontSize: 28,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 2,
    }),
    createPlaceholderLayer('yw-lesson-1', 'text', { x: 30, y: 110 }, { width: 290, height: 60 }, {
      text: '1. Trust the process 🌱',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 2,
    }),
    createPlaceholderLayer('yw-lesson-2', 'text', { x: 30, y: 180 }, { width: 290, height: 60 }, {
      text: '2. You are stronger than you think 💪',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 2,
    }),
    createPlaceholderLayer('yw-lesson-3', 'text', { x: 30, y: 250 }, { width: 290, height: 60 }, {
      text: '3. Gratitude changes everything ✨',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
      pageIndex: 2,
    }),
    createPlaceholderLayer('yw-next-year', 'text', { x: 50, y: 350 }, { width: 250, height: 80 }, {
      text: 'Bring on 2026! 🚀',
      fontSize: 24,
      fontColor: '#1DB954',
      zIndex: 2,
      pageIndex: 2,
    }),
  ],
};

// ========================================
// 5. QUICK FLEX - Minimalist Showcase
// ========================================
export const QUICK_FLEX_TEMPLATE: PremiumTemplate = {
  id: 'quick_flex_premium',
  title: 'Quick Flex Pro',
  description: '💎 Minimalist showcase - 1 hero shot',
  icon: 'diamond',
  backgroundColor: '#000000',
  category: 'creative',
  popularity: 7,
  tags: ['flex', 'minimal', 'showcase'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Hero Image
    createPlaceholderLayer('qf-hero', 'image', { x: 25, y: 80 }, { width: 300, height: 360 }, { zIndex: 1 }),
    
    // Minimalist Caption
    createPlaceholderLayer('qf-caption', 'text', { x: 60, y: 460 }, { width: 230, height: 50 }, {
      text: 'less is more ✨',
      fontSize: 22,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Subtle Tag
    createPlaceholderLayer('qf-tag', 'text', { x: 120, y: 520 }, { width: 110, height: 30 }, {
      text: '💎 CURATED',
      fontSize: 14,
      fontColor: '#94A3B8',
      zIndex: 2,
    }),
  ],
};

// ========================================
// 6. WEEKEND VIBES - Chill Layout
// ========================================
export const WEEKEND_VIBES_TEMPLATE: PremiumTemplate = {
  id: 'weekend_vibes_premium',
  title: 'Weekend Vibes Pro',
  description: '😎 Chill weekend mood board',
  icon: 'sunny',
  backgroundColor: '#FFD93D',
  category: 'lifestyle',
  popularity: 10,
  tags: ['weekend', 'chill', 'vibes'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Title
    createPlaceholderLayer('wv-title', 'text', { x: 60, y: 30 }, { width: 230, height: 50 }, {
      text: 'WEEKEND VIBES 😎',
      fontSize: 28,
      fontColor: '#000000',
      zIndex: 2,
    }),
    
    // Main Activity Photo
    createPlaceholderLayer('wv-main', 'image', { x: 25, y: 95 }, { width: 300, height: 180 }, { zIndex: 1 }),
    
    // Activity 1 (smaller)
    createPlaceholderLayer('wv-act1', 'image', { x: 25, y: 290 }, { width: 145, height: 120 }, { zIndex: 1 }),
    
    // Activity 2 (smaller)
    createPlaceholderLayer('wv-act2', 'image', { x: 180, y: 290 }, { width: 145, height: 120 }, { zIndex: 1 }),
    
    // Mood Text
    createPlaceholderLayer('wv-mood', 'text', { x: 40, y: 430 }, { width: 270, height: 60 }, {
      text: 'living my best life ✨',
      fontSize: 20,
      fontColor: '#000000',
      zIndex: 2,
    }),
    
    // Hashtag
    createPlaceholderLayer('wv-hashtag', 'text', { x: 100, y: 500 }, { width: 150, height: 30 }, {
      text: '#weekendmode',
      fontSize: 16,
      fontColor: '#666666',
      zIndex: 2,
    }),
  ],
};

// ========================================
// 7. FRIEND ROAST - Roast Card
// ========================================
export const FRIEND_ROAST_TEMPLATE: PremiumTemplate = {
  id: 'friend_roast_premium',
  title: 'Friend Roast Pro',
  description: '🔥 Roast card with photo & savage texts',
  icon: 'flame',
  backgroundColor: '#FF5733',
  category: 'fun',
  popularity: 10,
  tags: ['roast', 'funny', 'friends'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Title
    createPlaceholderLayer('fr-title', 'text', { x: 60, y: 25 }, { width: 230, height: 50 }, {
      text: 'ROAST SESSION 🔥',
      fontSize: 28,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Victim Photo
    createPlaceholderLayer('fr-victim', 'image', { x: 90, y: 85 }, { width: 170, height: 200 }, { zIndex: 1 }),
    
    // Roast Text 1
    createPlaceholderLayer('fr-roast1', 'text', { x: 30, y: 300 }, { width: 290, height: 60 }, {
      text: 'your hairline called... it wants a refund 💀',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Roast Text 2
    createPlaceholderLayer('fr-roast2', 'text', { x: 30, y: 370 }, { width: 290, height: 60 }, {
      text: 'respectfully... you built different 😭',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Love Note
    createPlaceholderLayer('fr-love', 'text', { x: 50, y: 450 }, { width: 250, height: 40 }, {
      text: '(love you tho ❤️)',
      fontSize: 16,
      fontColor: '#FFD700',
      zIndex: 2,
    }),
  ],
};

// ========================================
// 8. TRUTH OR DARE - Game Card
// ========================================
export const TRUTH_OR_DARE_TEMPLATE: PremiumTemplate = {
  id: 'truth_or_dare_premium',
  title: 'Truth or Dare Pro',
  description: '😈 Game card with challenge sections',
  icon: 'skull',
  backgroundColor: '#E74C3C',
  category: 'fun',
  popularity: 10,
  tags: ['truth', 'dare', 'game', 'party'],
  totalPages: 1,
  maxLayers: 12,
  layers: [
    // Title
    createPlaceholderLayer('td-title', 'text', { x: 40, y: 30 }, { width: 270, height: 50 }, {
      text: 'TRUTH OR DARE 😈',
      fontSize: 28,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Truth Section
    createPlaceholderLayer('td-truth-label', 'text', { x: 30, y: 100 }, { width: 290, height: 35 }, {
      text: '💬 TRUTH',
      fontSize: 22,
      fontColor: '#FFD700',
      zIndex: 2,
    }),
    createPlaceholderLayer('td-truth-q', 'text', { x: 30, y: 145 }, { width: 290, height: 80 }, {
      text: 'What\'s your most embarrassing moment?',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Dare Section
    createPlaceholderLayer('td-dare-label', 'text', { x: 30, y: 240 }, { width: 290, height: 35 }, {
      text: '🔥 DARE',
      fontSize: 22,
      fontColor: '#FFD700',
      zIndex: 2,
    }),
    createPlaceholderLayer('td-dare-challenge', 'text', { x: 30, y: 285 }, { width: 290, height: 80 }, {
      text: 'Text your crush "hey" right now',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Victim Tag
    createPlaceholderLayer('td-victim', 'text', { x: 60, y: 390 }, { width: 230, height: 50 }, {
      text: '@[tag your victim] 👀',
      fontSize: 18,
      fontColor: '#FFFFFF',
      zIndex: 2,
    }),
    
    // Game Note
    createPlaceholderLayer('td-note', 'text', { x: 80, y: 450 }, { width: 190, height: 40 }, {
      text: 'no backing out! 😤',
      fontSize: 16,
      fontColor: '#FFD700',
      zIndex: 2,
    }),
  ],
};

// ========================================
// EXPORT ALL PREMIUM TEMPLATES
// ========================================
export const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  PHOTO_DUMP_TEMPLATE,
  BIRTHDAY_BASH_TEMPLATE,
  VISION_BOARD_TEMPLATE,
  YEAR_WRAPPED_TEMPLATE,
  QUICK_FLEX_TEMPLATE,
  WEEKEND_VIBES_TEMPLATE,
  FRIEND_ROAST_TEMPLATE,
  TRUTH_OR_DARE_TEMPLATE,
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export const getPremiumTemplateById = (id: string): PremiumTemplate | undefined => {
  return PREMIUM_TEMPLATES.find(template => template.id === id);
};

export const getPremiumTemplatesByCategory = (category: string): PremiumTemplate[] => {
  return PREMIUM_TEMPLATES.filter(template => template.category === category);
};
