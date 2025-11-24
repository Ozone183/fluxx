export interface DrawingTemplate {
  id: string;
  type: 'drawing';
  name: string;
  description: string;
  background: string;
  gridLines?: boolean;
  gridSize?: number;
  dotted?: boolean;
  preDrawnElements?: PreDrawnElement[];
  instructions?: string;
  icon: string;
  category: 'quick' | 'games' | 'creative';
}

interface PreDrawnElement {
  type: 'line' | 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  strokeWidth: number;
}

export const DRAWING_TEMPLATES: DrawingTemplate[] = [
  // QUICK SKETCHES
  {
    id: 'blank-canvas',
    type: 'drawing',
    name: 'Blank Canvas',
    description: 'Pure white canvas - start from scratch',
    background: '#FFFFFF',
    instructions: 'Draw whatever comes to mind!',
    icon: 'square-outline',
    category: 'quick',
  },
  {
    id: 'grid-canvas',
    type: 'drawing',
    name: 'Grid Canvas',
    description: 'Grid lines for precise drawing and planning',
    background: '#FFFFFF',
    gridLines: true,
    gridSize: 40,
    instructions: 'Use the grid to plan your drawing',
    icon: 'grid-outline',
    category: 'quick',
  },
  {
    id: 'dotted-canvas',
    type: 'drawing',
    name: 'Dotted Canvas',
    description: 'Bullet journal style with dots',
    background: '#FFFFFF',
    dotted: true,
    gridSize: 20,
    instructions: 'Perfect for bullet journaling!',
    icon: 'ellipsis-horizontal',
    category: 'quick',
  },

  // COLLABORATIVE GAMES
  {
    id: 'tic-tac-toe',
    type: 'drawing',
    name: 'Tic-Tac-Toe',
    description: 'Classic game with friends',
    background: '#FFFFFF',
    preDrawnElements: [
      // Vertical lines
      { type: 'line', x: 133, y: 50, width: 0, height: 300, color: '#000000', strokeWidth: 3 },
      { type: 'line', x: 266, y: 50, width: 0, height: 300, color: '#000000', strokeWidth: 3 },
      // Horizontal lines
      { type: 'line', x: 50, y: 150, width: 300, height: 0, color: '#000000', strokeWidth: 3 },
      { type: 'line', x: 50, y: 250, width: 300, height: 0, color: '#000000', strokeWidth: 3 },
    ],
    instructions: 'Draw X or O in squares. First to 3 in a row wins!',
    icon: 'grid',
    category: 'games',
  },
  {
    id: 'pictionary',
    type: 'drawing',
    name: 'Pictionary',
    description: 'Draw and guess the word',
    background: '#FFFFFF',
    instructions: 'One person draws, others guess in comments!',
    icon: 'help-circle-outline',
    category: 'games',
  },
  {
    id: 'exquisite-corpse',
    type: 'drawing',
    name: 'Exquisite Corpse',
    description: 'Each person draws one part',
    background: '#FFFFFF',
    preDrawnElements: [
      // Divide canvas into 3 sections
      { type: 'line', x: 0, y: 133, width: 400, height: 0, color: '#CCCCCC', strokeWidth: 2 },
      { type: 'line', x: 0, y: 266, width: 400, height: 0, color: '#CCCCCC', strokeWidth: 2 },
      { type: 'text', x: 150, y: 60, text: 'HEAD', color: '#999999', strokeWidth: 1 },
      { type: 'text', x: 150, y: 193, text: 'BODY', color: '#999999', strokeWidth: 1 },
      { type: 'text', x: 150, y: 326, text: 'LEGS', color: '#999999', strokeWidth: 1 },
    ],
    instructions: 'Person 1: Head, Person 2: Body, Person 3: Legs',
    icon: 'people-outline',
    category: 'games',
  },
  {
    id: 'doodle-battle',
    type: 'drawing',
    name: 'Doodle Battle',
    description: 'Compete to draw the coolest doodle',
    background: '#FFFFFF',
    preDrawnElements: [
      // Divide canvas in half
      { type: 'line', x: 200, y: 0, width: 0, height: 400, color: '#CCCCCC', strokeWidth: 2 },
      { type: 'text', x: 60, y: 30, text: 'PLAYER 1', color: '#999999', strokeWidth: 1 },
      { type: 'text', x: 260, y: 30, text: 'PLAYER 2', color: '#999999', strokeWidth: 1 },
    ],
    instructions: 'Each side draws - most likes wins!',
    icon: 'trophy-outline',
    category: 'games',
  },

  // CREATIVE
  {
    id: 'portrait-challenge',
    type: 'drawing',
    name: 'Portrait Challenge',
    description: 'Draw someone in the group',
    background: '#FFFFFF',
    preDrawnElements: [
      // Face outline circle
      { type: 'circle', x: 200, y: 200, radius: 100, color: '#EEEEEE', strokeWidth: 2 },
    ],
    instructions: 'Draw a portrait of someone in the canvas!',
    icon: 'person-outline',
    category: 'creative',
  },
  {
    id: 'comic-strip',
    type: 'drawing',
    name: 'Comic Strip',
    description: 'Create a 4-panel comic together',
    background: '#FFFFFF',
    preDrawnElements: [
      // 4 panels
      { type: 'rect', x: 10, y: 10, width: 185, height: 185, color: '#000000', strokeWidth: 3 },
      { type: 'rect', x: 205, y: 10, width: 185, height: 185, color: '#000000', strokeWidth: 3 },
      { type: 'rect', x: 10, y: 205, width: 185, height: 185, color: '#000000', strokeWidth: 3 },
      { type: 'rect', x: 205, y: 205, width: 185, height: 185, color: '#000000', strokeWidth: 3 },
      // Panel numbers
      { type: 'text', x: 20, y: 30, text: '1', color: '#CCCCCC', strokeWidth: 1 },
      { type: 'text', x: 215, y: 30, text: '2', color: '#CCCCCC', strokeWidth: 1 },
      { type: 'text', x: 20, y: 225, text: '3', color: '#CCCCCC', strokeWidth: 1 },
      { type: 'text', x: 215, y: 225, text: '4', color: '#CCCCCC', strokeWidth: 1 },
    ],
    instructions: 'Tell a story in 4 panels!',
    icon: 'albums-outline',
    category: 'creative',
  },
  {
    id: 'mood-doodle',
    type: 'drawing',
    name: 'Mood Doodle',
    description: 'Express your current mood through art',
    background: '#FFFEF7',
    instructions: 'Draw how you feel right now',
    icon: 'happy-outline',
    category: 'creative',
  },
];

export const getTemplatesByCategory = (category: 'quick' | 'games' | 'creative') => {
  return DRAWING_TEMPLATES.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return DRAWING_TEMPLATES.find(t => t.id === id);
};
