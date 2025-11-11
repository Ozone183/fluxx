export interface CanvasTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  suggestedPrompts: string[];
  maxLayers: number;
  totalPages: number; // ← ADD THIS
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'weekend_vibes',
    title: 'Weekend Vibes',
    description: 'Share your weekend plans and mood',
    icon: 'sunny',
    backgroundColor: '#FFF5E1',
    suggestedPrompts: [
      'Add your weekend activity',
      'Share your mood',
      'Drop your outfit inspo',
    ],
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
  },
  {
    id: 'movie_night',
    title: 'Movie Night',
    description: 'Favorite films and watch party picks',
    icon: 'film',
    backgroundColor: '#1A1A2E',
    suggestedPrompts: [
      'Add your favorite movie poster',
      'Share your snack choice',
      'Drop a movie quote',
    ],
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
  },
  {
    id: 'travel_goals',
    title: 'Travel Goals',
    description: 'Dream destinations and vacation vibes',
    icon: 'airplane',
    backgroundColor: '#E3F2FD',
    suggestedPrompts: [
      'Add your dream destination',
      'Share travel photo',
      'Drop your bucket list spot',
    ],
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
  },
  {
    id: 'study_session',
    title: 'Study Session',
    description: 'Notes, resources, and motivation',
    icon: 'book',
    backgroundColor: '#FFF8DC',
    suggestedPrompts: [
      'Add study notes',
      'Share helpful resources',
      'Drop motivation quote',
    ],
    maxLayers: 14,
    totalPages: 2, // ← ADD THIS
  },
  {
    id: 'blank_canvas',
    title: 'Blank Canvas',
    description: 'Start from scratch - no rules',
    icon: 'create',
    backgroundColor: '#FFFFFF',
    suggestedPrompts: [],
    maxLayers: 14,
    totalPages: 2, // ← ADD THIS
  },
  {
    id: 'birthday',
    title: 'Birthday Party',
    description: 'Celebrate together',
    icon: 'balloon',
    backgroundColor: '#FFE5F1',
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
    suggestedPrompts: [
      'Share birthday photos',
      'Write wishes',
      'Add fun stickers',
    ],
  },
  {
    id: 'vacation',
    title: 'Vacation Vibes',
    description: 'Trip memories',
    icon: 'airplane',
    backgroundColor: '#E0F2FE',
    maxLayers: 12,
    totalPages: 3, // ← ADD THIS
    suggestedPrompts: [
      'Upload travel photos',
      'Share favorite moments',
      'Add location tags',
    ],
  },
  {
    id: 'event',
    title: 'Event Recap',
    description: 'Concert, party, meetup',
    icon: 'musical-notes',
    backgroundColor: '#F3E8FF',
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
    suggestedPrompts: [
      'Event highlights',
      'Group photos',
      'Best moments',
    ],
  },
  {
    id: 'moodboard',
    title: 'Mood Board',
    description: 'Vibes & aesthetics',
    icon: 'color-palette',
    backgroundColor: '#FEF3C7',
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
    suggestedPrompts: [
      'Inspirational images',
      'Color themes',
      'Style references',
    ],
  },
  {
    id: 'blank',
    title: 'Blank Canvas',
    description: 'Start from scratch',
    icon: 'create',
    backgroundColor: '#FFFFFF',
    maxLayers: 12,
    totalPages: 2, // ← ADD THIS
    suggestedPrompts: [],
  },
];

