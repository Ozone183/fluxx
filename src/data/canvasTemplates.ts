export interface CanvasTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  suggestedPrompts: string[];
  maxLayers: number;
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
    maxLayers: 8,
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
    maxLayers: 8,
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
    maxLayers: 8,
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
    maxLayers: 10,
  },
  {
    id: 'blank_canvas',
    title: 'Blank Canvas',
    description: 'Start from scratch - no rules',
    icon: 'create',
    backgroundColor: '#FFFFFF',
    suggestedPrompts: [],
    maxLayers: 10,
  },
];
