// src/utils/aiStoryGenerator.ts

interface StoryLayer {
  layerNumber: number;
  prompt: string;
  description: string;
}

interface TemplateStory {
  templateId: string;
  storyTitle: string;
  musicPrompt: string;
  layers: StoryLayer[];
}

export const AI_TEMPLATE_STORIES: Record<string, TemplateStory> = {
  // ========================================
  // SOCIAL - Birthday Bash
  // ========================================
  birthday_bash: {
    templateId: 'birthday_bash',
    storyTitle: 'A Birthday Story',
    musicPrompt: 'Upbeat celebration music with happy birthday vibes, energetic pop instrumental',
    layers: [
      { layerNumber: 1, prompt: 'Person waking up excited on birthday morning, sunlight streaming through window', description: 'Morning Awakening' },
      { layerNumber: 2, prompt: 'Friends secretly planning surprise party, whispering and decorating', description: 'Secret Planning' },
      { layerNumber: 3, prompt: 'Colorful balloons and streamers being hung up for party decoration', description: 'Party Decorations' },
      { layerNumber: 4, prompt: 'Beautiful birthday cake with lit candles, chocolate layers and frosting', description: 'The Birthday Cake' },
      { layerNumber: 5, prompt: 'Wrapped birthday presents with ribbons and bows piled high', description: 'Gift Mountain' },
      { layerNumber: 6, prompt: 'Friends arriving at party with big smiles and excitement', description: 'Squad Arrives' },
      { layerNumber: 7, prompt: 'Dance floor with colorful lights, people dancing and celebrating', description: 'Dance Party' },
      { layerNumber: 8, prompt: 'Birthday party games being played, laughter and fun moments', description: 'Party Games' },
      { layerNumber: 9, prompt: 'Group selfie with everyone making funny faces and peace signs', description: 'Memory Photos' },
      { layerNumber: 10, prompt: 'Champagne glasses clinking in celebration toast', description: 'The Toast' },
      { layerNumber: 11, prompt: 'Golden hour sunset from party venue window, warm glow', description: 'Golden Hour' },
      { layerNumber: 12, prompt: 'Text overlay "Best Birthday Ever" with confetti and sparkles', description: 'Perfect Ending' },
    ],
  },

  // ========================================
  // SOCIAL - Graduation Party
  // ========================================
  grad_party: {
    templateId: 'grad_party',
    storyTitle: 'Graduation Journey',
    musicPrompt: 'Inspirational orchestral music with triumphant horns, graduation ceremony vibes',
    layers: [
      { layerNumber: 1, prompt: 'Graduate putting on cap and gown, excited nervous energy', description: 'Getting Ready' },
      { layerNumber: 2, prompt: 'Family taking proud photos before ceremony, emotional moment', description: 'Family Pride' },
      { layerNumber: 3, prompt: 'Graduation ceremony stage with podium and university banner', description: 'The Ceremony' },
      { layerNumber: 4, prompt: 'Graduate walking across stage to receive diploma', description: 'The Walk' },
      { layerNumber: 5, prompt: 'Throwing graduation cap in the air with classmates', description: 'Cap Toss' },
      { layerNumber: 6, prompt: 'Diploma in hand, official graduation certificate close-up', description: 'The Diploma' },
      { layerNumber: 7, prompt: 'Celebration hugs with family and friends after ceremony', description: 'Celebration Hugs' },
      { layerNumber: 8, prompt: 'Graduation party with balloons in school colors', description: 'Grad Party' },
      { layerNumber: 9, prompt: 'Graduate giving speech about future plans and dreams', description: 'Future Dreams' },
      { layerNumber: 10, prompt: 'Thank you card to professors and mentors', description: 'Gratitude' },
      { layerNumber: 11, prompt: 'Looking at college campus one last time, nostalgic view', description: 'Final Look Back' },
      { layerNumber: 12, prompt: 'Text overlay "The Beginning of Something New" inspirational quote', description: 'New Beginnings' },
    ],
  },

  // ========================================
  // CREATIVE - Photo Dump
  // ========================================
  photo_dump: {
    templateId: 'photo_dump',
    storyTitle: 'Life Lately',
    musicPrompt: 'Chill indie pop instrumental, lo-fi aesthetic vibes, relaxed modern beats',
    layers: [
      { layerNumber: 1, prompt: 'Aesthetic coffee cup on wooden table, morning light', description: 'Morning Coffee' },
      { layerNumber: 2, prompt: 'Candid selfie with natural lighting, no filter needed', description: 'Raw Selfie' },
      { layerNumber: 3, prompt: 'Sunset view from window, golden hour photography', description: 'Window View' },
      { layerNumber: 4, prompt: 'Random street art or graffiti wall, urban aesthetic', description: 'Street Art' },
      { layerNumber: 5, prompt: 'Food plate at restaurant, aesthetic food photography', description: 'Food Moment' },
      { layerNumber: 6, prompt: 'Blurry night lights, bokeh city lights effect', description: 'Night Blur' },
      { layerNumber: 7, prompt: 'Mirror selfie in cool outfit, fashion moment', description: 'Fit Check' },
      { layerNumber: 8, prompt: 'Nature close-up, flowers or leaves with depth', description: 'Nature Detail' },
      { layerNumber: 9, prompt: 'Hanging out with friends, candid group moment', description: 'Squad Time' },
      { layerNumber: 10, prompt: 'Aesthetic room corner with plants and decor', description: 'Room Aesthetic' },
      { layerNumber: 11, prompt: 'Late night vibes, neon lights or city at night', description: 'Night Energy' },
      { layerNumber: 12, prompt: 'Text overlay "life lately" in minimal typography', description: 'Caption' },
    ],
  },

  // ========================================
  // LIFESTYLE - Travel Diary
  // ========================================
  travel_diary: {
    templateId: 'travel_diary',
    storyTitle: 'Adventure Awaits',
    musicPrompt: 'Uplifting travel music with acoustic guitar, adventure exploration vibes',
    layers: [
      { layerNumber: 1, prompt: 'Airport terminal with departure board showing destinations', description: 'Departure' },
      { layerNumber: 2, prompt: 'Airplane window view above clouds, wing visible', description: 'In Flight' },
      { layerNumber: 3, prompt: 'Hotel room with suitcase unpacked, travel essentials', description: 'Check In' },
      { layerNumber: 4, prompt: 'Famous landmark or tourist attraction, iconic view', description: 'First Stop' },
      { layerNumber: 5, prompt: 'Local street food vendor, trying new cuisine', description: 'Food Discovery' },
      { layerNumber: 6, prompt: 'Walking through local market with colorful shops', description: 'Market Exploration' },
      { layerNumber: 7, prompt: 'Beach sunset or mountain view, breathtaking scenery', description: 'Natural Beauty' },
      { layerNumber: 8, prompt: 'Meeting locals or making friends while traveling', description: 'New Friends' },
      { layerNumber: 9, prompt: 'Adventure activity like hiking, snorkeling, or exploring', description: 'Adventure Time' },
      { layerNumber: 10, prompt: 'Souvenir shopping, local crafts and gifts', description: 'Souvenirs' },
      { layerNumber: 11, prompt: 'Last sunset at destination, nostalgic goodbye', description: 'Goodbye View' },
      { layerNumber: 12, prompt: 'Text overlay "Not all who wander are lost" travel quote', description: 'Travel Quote' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Vision Board
  // ========================================
  vision_board: {
    templateId: 'vision_board',
    storyTitle: '2026 Dreams',
    musicPrompt: 'Motivational epic music with inspiring crescendo, dream achievement vibes',
    layers: [
      { layerNumber: 1, prompt: 'Person writing goals in journal, focused and determined', description: 'Setting Goals' },
      { layerNumber: 2, prompt: 'Dream home or apartment, aspirational living space', description: 'Dream Home' },
      { layerNumber: 3, prompt: 'Career success visualization, office or workspace goals', description: 'Career Goals' },
      { layerNumber: 4, prompt: 'Financial success symbols, savings and investment growth', description: 'Financial Freedom' },
      { layerNumber: 5, prompt: 'Fitness transformation, healthy lifestyle goals', description: 'Health Goals' },
      { layerNumber: 6, prompt: 'Travel destinations on world map, wanderlust dreams', description: 'Travel Dreams' },
      { layerNumber: 7, prompt: 'Education or learning new skills, personal development', description: 'Growth Mindset' },
      { layerNumber: 8, prompt: 'Relationships and love, meaningful connections', description: 'Love & Connection' },
      { layerNumber: 9, prompt: 'Creative projects or side hustle, passion pursuits', description: 'Passion Projects' },
      { layerNumber: 10, prompt: 'Giving back to community, charity and impact', description: 'Making Impact' },
      { layerNumber: 11, prompt: 'Meditation or mindfulness, inner peace visualization', description: 'Inner Peace' },
      { layerNumber: 12, prompt: 'Text overlay "Dream It. Believe It. Achieve It." affirmation', description: 'Manifestation' },
    ],
  },

  // ========================================
  // FUN - Friend Roast
  // ========================================
  friend_roast: {
    templateId: 'friend_roast',
    storyTitle: 'Roasting My Bestie',
    musicPrompt: 'Comedy show music with playful sarcastic vibes, lighthearted roast energy',
    layers: [
      { layerNumber: 1, prompt: 'Friend looking confident and unsuspecting', description: 'The Victim' },
      { layerNumber: 2, prompt: 'Embarrassing childhood photo, awkward moment captured', description: 'Throwback Cringe' },
      { layerNumber: 3, prompt: 'Friend with terrible fashion choice, fashion disaster', description: 'Fashion Crimes' },
      { layerNumber: 4, prompt: 'Friend failing at something funny, epic fail moment', description: 'Epic Fail' },
      { layerNumber: 5, prompt: 'Weird food combination friend eats, questionable taste', description: 'Food Crimes' },
      { layerNumber: 6, prompt: 'Friend sleeping in weird position, unflattering angle', description: 'Sleeping Beauty' },
      { layerNumber: 7, prompt: 'Text message with autocorrect fail or typo', description: 'Text Fails' },
      { layerNumber: 8, prompt: 'Friend dancing awkwardly, no rhythm detected', description: 'Dance Moves' },
      { layerNumber: 9, prompt: 'Friend making weird face, caught in bad moment', description: 'Caught Lacking' },
      { layerNumber: 10, prompt: 'Friend obsession or weird habit they have', description: 'Quirky Habits' },
      { layerNumber: 11, prompt: 'Group laughing at roast, friend pretending to be mad', description: 'Group Reaction' },
      { layerNumber: 12, prompt: 'Text overlay "Love you though" with heart, friendly ending', description: 'Just Kidding' },
    ],
  },

  // ========================================
  // LIFESTYLE - Foodie Finds
  // ========================================
  foodie_finds: {
    templateId: 'foodie_finds',
    storyTitle: 'Food Journey',
    musicPrompt: 'Upbeat cooking show music, culinary adventure vibes, cheerful dining ambiance',
    layers: [
      { layerNumber: 1, prompt: 'Breakfast spread with pancakes, eggs, and coffee', description: 'Breakfast Goals' },
      { layerNumber: 2, prompt: 'Artisan coffee with latte art, aesthetic cafe vibes', description: 'Coffee Culture' },
      { layerNumber: 3, prompt: 'Lunch bowl with colorful healthy ingredients', description: 'Healthy Lunch' },
      { layerNumber: 4, prompt: 'Street food vendor preparing delicious meal', description: 'Street Eats' },
      { layerNumber: 5, prompt: 'Fancy restaurant plating, fine dining presentation', description: 'Fine Dining' },
      { layerNumber: 6, prompt: 'Pizza with melted cheese pull, comfort food heaven', description: 'Pizza Perfection' },
      { layerNumber: 7, prompt: 'Sushi platter with variety of rolls and sashimi', description: 'Sushi Night' },
      { layerNumber: 8, prompt: 'Dessert paradise with cake, ice cream, and sweets', description: 'Sweet Tooth' },
      { layerNumber: 9, prompt: 'Home cooking in kitchen, preparing meal from scratch', description: 'Home Cooked' },
      { layerNumber: 10, prompt: 'Friends sharing food at restaurant, communal dining', description: 'Dining Together' },
      { layerNumber: 11, prompt: 'Food photography setup, taking the perfect shot', description: 'Gram Worthy' },
      { layerNumber: 12, prompt: 'Text overlay "Good food, good mood" food quote', description: 'Food Motto' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Monday Motivation
  // ========================================
  monday_motivation: {
    templateId: 'monday_motivation',
    storyTitle: 'Crushing Monday',
    musicPrompt: 'Powerful motivational music with driving beat, hustle and grind energy',
    layers: [
      { layerNumber: 1, prompt: 'Alarm clock ringing at dawn, new week beginning', description: 'Rise & Shine' },
      { layerNumber: 2, prompt: 'Morning workout routine, starting week strong', description: 'Morning Workout' },
      { layerNumber: 3, prompt: 'Healthy breakfast smoothie bowl, fuel for the day', description: 'Power Breakfast' },
      { layerNumber: 4, prompt: 'Planner open with weekly goals written out', description: 'Goal Planning' },
      { layerNumber: 5, prompt: 'Commute to work or school, determined mindset', description: 'On The Move' },
      { layerNumber: 6, prompt: 'Workspace setup with laptop and coffee, ready to work', description: 'Work Mode' },
      { layerNumber: 7, prompt: 'Checking off tasks from to-do list, progress made', description: 'Getting Stuff Done' },
      { layerNumber: 8, prompt: 'Team meeting or collaboration, productive discussions', description: 'Team Hustle' },
      { layerNumber: 9, prompt: 'Lunch break with energy-boosting meal', description: 'Refuel' },
      { layerNumber: 10, prompt: 'Afternoon productivity burst, focused work flow', description: 'In The Zone' },
      { layerNumber: 11, prompt: 'End of day reflection, satisfied with progress', description: 'Day Won' },
      { layerNumber: 12, prompt: 'Text overlay "Monday is your chance to set the tone" quote', description: 'Monday Mindset' },
    ],
  },

  // ========================================
  // FUN - This or That
  // ========================================
  this_or_that: {
    templateId: 'this_or_that',
    storyTitle: 'Choose Your Side',
    musicPrompt: 'Playful game show music with suspenseful decision-making vibes',
    layers: [
      { layerNumber: 1, prompt: 'Coffee vs Tea, both drinks side by side', description: 'Coffee or Tea' },
      { layerNumber: 2, prompt: 'Beach vs Mountains, split screen of both destinations', description: 'Beach or Mountains' },
      { layerNumber: 3, prompt: 'Pizza vs Burgers, delicious food comparison', description: 'Pizza or Burgers' },
      { layerNumber: 4, prompt: 'Early Bird vs Night Owl, sunrise and moonlight', description: 'Morning or Night' },
      { layerNumber: 5, prompt: 'Summer vs Winter, seasonal split comparison', description: 'Summer or Winter' },
      { layerNumber: 6, prompt: 'Dogs vs Cats, cute pets side by side', description: 'Dogs or Cats' },
      { layerNumber: 7, prompt: 'Books vs Movies, reading vs watching entertainment', description: 'Books or Movies' },
      { layerNumber: 8, prompt: 'Texting vs Calling, phone communication styles', description: 'Text or Call' },
      { layerNumber: 9, prompt: 'Stay In vs Go Out, cozy home vs party scene', description: 'Home or Out' },
      { layerNumber: 10, prompt: 'Sweet vs Savory, dessert vs snacks', description: 'Sweet or Savory' },
      { layerNumber: 11, prompt: 'Gym vs Home Workout, fitness location choice', description: 'Gym or Home' },
      { layerNumber: 12, prompt: 'Text overlay "What are you choosing?" interactive question', description: 'Your Choice' },
    ],
  },

  // ========================================
  // CREATIVE - Moodboard
  // ========================================
  moodboard: {
    templateId: 'moodboard',
    storyTitle: 'Aesthetic Inspo',
    musicPrompt: 'Dreamy ambient music with soft piano, creative inspiration vibes',
    layers: [
      { layerNumber: 1, prompt: 'Neutral beige color palette swatches, aesthetic tones', description: 'Color Palette' },
      { layerNumber: 2, prompt: 'Minimalist architecture with clean lines', description: 'Architecture Inspo' },
      { layerNumber: 3, prompt: 'Fashion magazine cutout with elegant outfit', description: 'Fashion Reference' },
      { layerNumber: 4, prompt: 'Dried flowers and botanical elements', description: 'Natural Elements' },
      { layerNumber: 5, prompt: 'Typography samples with beautiful fonts', description: 'Typography Goals' },
      { layerNumber: 6, prompt: 'Vintage camera or creative tools, artistic vibe', description: 'Creative Tools' },
      { layerNumber: 7, prompt: 'Texture samples like marble, wood, fabric', description: 'Texture Studies' },
      { layerNumber: 8, prompt: 'Art prints or paintings with similar aesthetic', description: 'Art References' },
      { layerNumber: 9, prompt: 'Interior design inspiration, room aesthetics', description: 'Interior Design' },
      { layerNumber: 10, prompt: 'Jewelry or accessories matching the vibe', description: 'Accessories' },
      { layerNumber: 11, prompt: 'Natural lighting reference, golden hour glow', description: 'Lighting Inspo' },
      { layerNumber: 12, prompt: 'Text overlay with aesthetic quote or mantra', description: 'Mood Caption' },
    ],
  },

  // ========================================
  // DEFAULT - For any template without custom story
  // ========================================
  default: {
    templateId: 'default',
    storyTitle: 'Creative Journey',
    musicPrompt: 'Upbeat modern electronic music, creative energy vibes',
    layers: [
      { layerNumber: 1, prompt: 'Abstract colorful gradient background, vibrant energy', description: 'Opening Visual' },
      { layerNumber: 2, prompt: 'Geometric patterns with modern design aesthetic', description: 'Pattern Play' },
      { layerNumber: 3, prompt: 'Nature landscape with beautiful scenery', description: 'Natural Beauty' },
      { layerNumber: 4, prompt: 'Urban cityscape with modern architecture', description: 'City Vibes' },
      { layerNumber: 5, prompt: 'Artistic composition with creative elements', description: 'Creative Mix' },
      { layerNumber: 6, prompt: 'Minimal design with clean aesthetic', description: 'Clean Design' },
      { layerNumber: 7, prompt: 'Colorful artistic expression, abstract art', description: 'Art Expression' },
      { layerNumber: 8, prompt: 'Dynamic movement and energy capture', description: 'Dynamic Energy' },
      { layerNumber: 9, prompt: 'Textured surface with interesting details', description: 'Texture Detail' },
      { layerNumber: 10, prompt: 'Contrast between light and shadow', description: 'Light Play' },
      { layerNumber: 11, prompt: 'Inspiring composition with positive energy', description: 'Positive Energy' },
      { layerNumber: 12, prompt: 'Text overlay with creative message', description: 'Final Message' },
    ],
  },
};

// Get story for template, fallback to default
export const getTemplateStory = (templateId: string): TemplateStory => {
  return AI_TEMPLATE_STORIES[templateId] || AI_TEMPLATE_STORIES.default;
};
