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
  // SOCIAL - Wedding Vibes
  // ========================================
  wedding_vibes: {
    templateId: 'wedding_vibes',
    storyTitle: 'Forever Begins Today',
    musicPrompt: 'Romantic orchestral wedding music with strings, elegant ceremony vibes',
    layers: [
      { layerNumber: 1, prompt: 'Bride getting ready, wedding dress hanging in window with morning light', description: 'Getting Ready' },
      { layerNumber: 2, prompt: 'Groom adjusting tie in mirror, nervous excitement', description: 'Groom Preparations' },
      { layerNumber: 3, prompt: 'Wedding venue decorated with flowers and white chairs', description: 'The Venue' },
      { layerNumber: 4, prompt: 'Bride walking down aisle with bouquet, emotional moment', description: 'The Walk' },
      { layerNumber: 5, prompt: 'Couple exchanging rings, close-up of hands and rings', description: 'The Rings' },
      { layerNumber: 6, prompt: 'First kiss as married couple, confetti falling', description: 'The Kiss' },
      { layerNumber: 7, prompt: 'Wedding reception with elegant table settings and centerpieces', description: 'Reception Setup' },
      { layerNumber: 8, prompt: 'First dance under twinkling lights, romantic moment', description: 'First Dance' },
      { layerNumber: 9, prompt: 'Wedding cake cutting, multi-tiered elegant cake', description: 'Cake Cutting' },
      { layerNumber: 10, prompt: 'Dancing celebration with all guests, party atmosphere', description: 'Celebration Dance' },
      { layerNumber: 11, prompt: 'Sparkler send-off at night, magical exit', description: 'Grand Exit' },
      { layerNumber: 12, prompt: 'Text overlay "Happily Ever After" with elegant script', description: 'Forever Love' },
    ],
  },

  // ========================================
  // SOCIAL - Baby Shower
  // ========================================
  baby_shower: {
    templateId: 'baby_shower',
    storyTitle: 'Bundle of Joy',
    musicPrompt: 'Soft gentle lullaby music with peaceful nurturing vibes',
    layers: [
      { layerNumber: 1, prompt: 'Baby shower invitation with pastel colors and teddy bear', description: 'The Invitation' },
      { layerNumber: 2, prompt: 'Pregnant mom glowing with baby bump, excited smile', description: 'Mom To Be' },
      { layerNumber: 3, prompt: 'Baby shower decorations with balloons and banners', description: 'Party Decorations' },
      { layerNumber: 4, prompt: 'Gifts wrapped in baby-themed paper piled high', description: 'Gift Mountain' },
      { layerNumber: 5, prompt: 'Nursery room setup with crib and soft toys', description: 'Nursery Dreams' },
      { layerNumber: 6, prompt: 'Baby shower games being played, guests laughing', description: 'Party Games' },
      { layerNumber: 7, prompt: 'Diaper cake centerpiece, creative baby gift display', description: 'Diaper Cake' },
      { layerNumber: 8, prompt: 'Gender reveal moment with pink or blue confetti', description: 'Big Reveal' },
      { layerNumber: 9, prompt: 'Baby clothes and tiny shoes, adorable outfits', description: 'Tiny Clothes' },
      { layerNumber: 10, prompt: 'Well wishes cards and advice from guests', description: 'Words of Wisdom' },
      { layerNumber: 11, prompt: 'Baby ultrasound photo, first glimpse of baby', description: 'First Photo' },
      { layerNumber: 12, prompt: 'Text overlay "Welcome Little One" with hearts', description: 'Welcome Baby' },
    ],
  },

  // ========================================
  // SOCIAL - Squad Reunion
  // ========================================
  reunion: {
    templateId: 'reunion',
    storyTitle: 'The Gang is Back',
    musicPrompt: 'Nostalgic upbeat reunion music, feel-good friendship vibes',
    layers: [
      { layerNumber: 1, prompt: 'Old group photo from years ago, throwback memory', description: 'Way Back When' },
      { layerNumber: 2, prompt: 'Group chat planning reunion, excited messages', description: 'Planning Time' },
      { layerNumber: 3, prompt: 'Friends arriving one by one, emotional greetings', description: 'The Arrival' },
      { layerNumber: 4, prompt: 'Group hug with everyone, pure joy and excitement', description: 'Squad United' },
      { layerNumber: 5, prompt: 'Catching up over coffee and food, deep conversations', description: 'Catching Up' },
      { layerNumber: 6, prompt: 'Looking through old photos together, laughing at memories', description: 'Memory Lane' },
      { layerNumber: 7, prompt: 'Recreating old photo poses, then and now comparison', description: 'Recreate Moment' },
      { layerNumber: 8, prompt: 'Playing old games or doing familiar activities together', description: 'Like Old Times' },
      { layerNumber: 9, prompt: 'Sharing updates about life changes and achievements', description: 'Life Updates' },
      { layerNumber: 10, prompt: 'New group photo recreating the old one', description: 'New Memories' },
      { layerNumber: 11, prompt: 'Planning next meetup, making future promises', description: 'See You Soon' },
      { layerNumber: 12, prompt: 'Text overlay "True friends never change" friendship quote', description: 'Forever Squad' },
    ],
  },

  // ========================================
  // CREATIVE - Outfit Inspo
  // ========================================
  outfit_inspo: {
    templateId: 'outfit_inspo',
    storyTitle: 'Fashion Forward',
    musicPrompt: 'Trendy fashion show music with runway vibes, stylish beats',
    layers: [
      { layerNumber: 1, prompt: 'Fashion magazine spread with trending styles', description: 'Trend Alert' },
      { layerNumber: 2, prompt: 'Casual streetwear outfit laid flat, urban style', description: 'Street Style' },
      { layerNumber: 3, prompt: 'Business casual outfit for office, professional look', description: 'Work Fashion' },
      { layerNumber: 4, prompt: 'Date night outfit with elegant accessories', description: 'Date Night Look' },
      { layerNumber: 5, prompt: 'Weekend casual comfort outfit, relaxed vibes', description: 'Chill Vibes' },
      { layerNumber: 6, prompt: 'Gym workout outfit with sneakers, athletic wear', description: 'Gym Fit' },
      { layerNumber: 7, prompt: 'Party outfit with bold colors and statement pieces', description: 'Party Ready' },
      { layerNumber: 8, prompt: 'Seasonal outfit appropriate for weather, layered look', description: 'Season Style' },
      { layerNumber: 9, prompt: 'Accessories flatlay with bags, jewelry, sunglasses', description: 'Accessory Game' },
      { layerNumber: 10, prompt: 'Shoe collection display, various styles', description: 'Shoe Goals' },
      { layerNumber: 11, prompt: 'Mirror selfie in favorite outfit, confidence pose', description: 'OOTD' },
      { layerNumber: 12, prompt: 'Text overlay "Style is a way to say who you are" fashion quote', description: 'Style Statement' },
    ],
  },

  // ========================================
  // CREATIVE - Art Portfolio
  // ========================================
  art_portfolio: {
    templateId: 'art_portfolio',
    storyTitle: 'Creative Evolution',
    musicPrompt: 'Inspiring artistic music with creative energy, gallery ambiance',
    layers: [
      { layerNumber: 1, prompt: 'Artist workspace with paints, brushes, and canvas', description: 'The Studio' },
      { layerNumber: 2, prompt: 'Early sketch or concept drawing, creative beginning', description: 'First Sketch' },
      { layerNumber: 3, prompt: 'Work in progress showing artistic process', description: 'Creating Process' },
      { layerNumber: 4, prompt: 'Finished painting or artwork, full piece displayed', description: 'Completed Work' },
      { layerNumber: 5, prompt: 'Digital art on tablet or computer screen', description: 'Digital Creation' },
      { layerNumber: 6, prompt: 'Traditional medium artwork, watercolor or oil painting', description: 'Traditional Art' },
      { layerNumber: 7, prompt: 'Abstract art piece with bold colors and shapes', description: 'Abstract Expression' },
      { layerNumber: 8, prompt: 'Portrait or figure drawing showing skill', description: 'Figure Study' },
      { layerNumber: 9, prompt: 'Nature or landscape artwork, scenic beauty', description: 'Landscape Art' },
      { layerNumber: 10, prompt: 'Mixed media collage with various materials', description: 'Mixed Media' },
      { layerNumber: 11, prompt: 'Gallery wall with multiple artworks displayed', description: 'Gallery Display' },
      { layerNumber: 12, prompt: 'Text overlay with artist signature or motto', description: 'Artist Statement' },
    ],
  },

  // ========================================
  // LIFESTYLE - Music Recs
  // ========================================
  music_recs: {
    templateId: 'music_recs',
    storyTitle: 'On Repeat',
    musicPrompt: 'Eclectic music mix with diverse genres, playlist energy',
    layers: [
      { layerNumber: 1, prompt: 'Headphones on white background, music lifestyle', description: 'Music Mode' },
      { layerNumber: 2, prompt: 'Vinyl record collection, classic music vibes', description: 'Vinyl Collection' },
      { layerNumber: 3, prompt: 'Spotify or music app playlist screenshot', description: 'Current Playlist' },
      { layerNumber: 4, prompt: 'Album cover of favorite current album', description: 'Album Obsession' },
      { layerNumber: 5, prompt: 'Concert ticket stubs or live music memories', description: 'Concert Memories' },
      { layerNumber: 6, prompt: 'Lyrics written out from favorite song', description: 'Meaningful Lyrics' },
      { layerNumber: 7, prompt: 'Musical instruments, guitar or piano aesthetic', description: 'Music Creation' },
      { layerNumber: 8, prompt: 'Festival wristbands or music event memories', description: 'Festival Vibes' },
      { layerNumber: 9, prompt: 'CD collection or cassette tapes, nostalgic media', description: 'Throwback Media' },
      { layerNumber: 10, prompt: 'Person listening to music with eyes closed, feeling it', description: 'Lost in Music' },
      { layerNumber: 11, prompt: 'Music notes floating in air, artistic representation', description: 'Music Visual' },
      { layerNumber: 12, prompt: 'Text overlay "Where words fail, music speaks" quote', description: 'Music Quote' },
    ],
  },

  // ========================================
  // LIFESTYLE - Movie Marathon
  // ========================================
  movie_marathon: {
    templateId: 'movie_marathon',
    storyTitle: 'Cinema Nights',
    musicPrompt: 'Dramatic cinematic music with movie theater vibes',
    layers: [
      { layerNumber: 1, prompt: 'Movie theater entrance with marquee lights', description: 'Cinema Magic' },
      { layerNumber: 2, prompt: 'Popcorn bucket and candy, movie snacks ready', description: 'Snack Time' },
      { layerNumber: 3, prompt: 'Cozy home theater setup with blankets and pillows', description: 'Cozy Setup' },
      { layerNumber: 4, prompt: 'Stack of DVDs or streaming queue screenshot', description: 'Watch List' },
      { layerNumber: 5, prompt: 'Classic movie poster, iconic film reference', description: 'Classic Pick' },
      { layerNumber: 6, prompt: 'Recent release poster, new movie excitement', description: 'New Release' },
      { layerNumber: 7, prompt: 'Genre collection, horror, comedy, or action theme', description: 'Genre Night' },
      { layerNumber: 8, prompt: 'Movie rating system with stars or scores', description: 'Rating Time' },
      { layerNumber: 9, prompt: 'Friends watching together, group movie night', description: 'Watch Party' },
      { layerNumber: 10, prompt: 'Emotional movie moment, tissues ready', description: 'Cry Worthy' },
      { layerNumber: 11, prompt: 'Film credits rolling on screen', description: 'End Credits' },
      { layerNumber: 12, prompt: 'Text overlay "Lights, Camera, Action" cinema quote', description: 'Movie Motto' },
    ],
  },

  // ========================================
  // LIFESTYLE - Book Club
  // ========================================
  book_club: {
    templateId: 'book_club',
    storyTitle: 'Reading Journey',
    musicPrompt: 'Peaceful library ambiance with soft instrumental, reading vibes',
    layers: [
      { layerNumber: 1, prompt: 'Cozy reading nook with armchair and lamp', description: 'Reading Corner' },
      { layerNumber: 2, prompt: 'Stack of books to read, TBR pile', description: 'Book Stack' },
      { layerNumber: 3, prompt: 'Current book being read with bookmark', description: 'Current Read' },
      { layerNumber: 4, prompt: 'Bookshelf filled with diverse book collection', description: 'Book Collection' },
      { layerNumber: 5, prompt: 'Favorite quote highlighted in book pages', description: 'Favorite Quote' },
      { layerNumber: 6, prompt: 'Coffee and book pairing, perfect reading combo', description: 'Coffee & Books' },
      { layerNumber: 7, prompt: 'Library card or bookstore membership', description: 'Book Lover' },
      { layerNumber: 8, prompt: 'Book club meeting with friends discussing', description: 'Club Discussion' },
      { layerNumber: 9, prompt: 'Vintage classic book with aged pages', description: 'Classic Literature' },
      { layerNumber: 10, prompt: 'New release from favorite author', description: 'New Release' },
      { layerNumber: 11, prompt: 'Bookmarks collection, various designs', description: 'Bookmark Collection' },
      { layerNumber: 12, prompt: 'Text overlay "So many books, so little time" reader quote', description: 'Reader Life' },
    ],
  },

  // ========================================
  // LIFESTYLE - Home Decor
  // ========================================
  home_decor: {
    templateId: 'home_decor',
    storyTitle: 'Home Transformation',
    musicPrompt: 'Calm ambient music with home improvement energy, cozy vibes',
    layers: [
      { layerNumber: 1, prompt: 'Living room before renovation, starting point', description: 'Before Look' },
      { layerNumber: 2, prompt: 'Paint samples on wall, choosing colors', description: 'Color Selection' },
      { layerNumber: 3, prompt: 'Furniture shopping or browsing design stores', description: 'Furniture Hunt' },
      { layerNumber: 4, prompt: 'DIY project in progress, creative decorating', description: 'DIY Project' },
      { layerNumber: 5, prompt: 'Gallery wall arrangement with frames and art', description: 'Gallery Wall' },
      { layerNumber: 6, prompt: 'Plant collection, indoor greenery aesthetic', description: 'Plant Paradise' },
      { layerNumber: 7, prompt: 'Lighting fixtures, stylish lamps and chandeliers', description: 'Perfect Lighting' },
      { layerNumber: 8, prompt: 'Textile layers with pillows, throws, and rugs', description: 'Cozy Textiles' },
      { layerNumber: 9, prompt: 'Kitchen or bathroom upgrade, functional beauty', description: 'Room Upgrade' },
      { layerNumber: 10, prompt: 'Personal touches with photos and memories', description: 'Personal Touch' },
      { layerNumber: 11, prompt: 'Living room after transformation, finished look', description: 'After Reveal' },
      { layerNumber: 12, prompt: 'Text overlay "Home is where the heart is" decor quote', description: 'Home Sweet Home' },
    ],
  },

  // ========================================
  // LIFESTYLE - Pet Tribute
  // ========================================
  pet_tribute: {
    templateId: 'pet_tribute',
    storyTitle: 'Best Friend Forever',
    musicPrompt: 'Heartwarming cheerful music with playful pet energy',
    layers: [
      { layerNumber: 1, prompt: 'Pet as puppy or kitten, adorable baby photo', description: 'Baby Days' },
      { layerNumber: 2, prompt: 'Pet playing with favorite toy, action shot', description: 'Play Time' },
      { layerNumber: 3, prompt: 'Pet sleeping in funny position, cute moment', description: 'Nap Time' },
      { layerNumber: 4, prompt: 'Pet with food bowl, meal time excitement', description: 'Food Lover' },
      { layerNumber: 5, prompt: 'Pet doing silly trick or funny behavior', description: 'Silly Moments' },
      { layerNumber: 6, prompt: 'Pet and owner cuddling, bonding moment', description: 'Best Friends' },
      { layerNumber: 7, prompt: 'Pet on outdoor adventure, exploring nature', description: 'Adventure Buddy' },
      { layerNumber: 8, prompt: 'Pet wearing costume or outfit, dressed up', description: 'Fashion Pet' },
      { layerNumber: 9, prompt: 'Pet meeting other pets, social butterfly', description: 'Making Friends' },
      { layerNumber: 10, prompt: 'Pet birthday celebration with treats', description: 'Birthday Pet' },
      { layerNumber: 11, prompt: 'Pet looking majestic and photogenic', description: 'Model Shot' },
      { layerNumber: 12, prompt: 'Text overlay "My heart belongs to you" with paw prints', description: 'Unconditional Love' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Study Notes
  // ========================================
  study_notes: {
    templateId: 'study_notes',
    storyTitle: 'Study Grind',
    musicPrompt: 'Focused lo-fi study beats, concentration ambiance',
    layers: [
      { layerNumber: 1, prompt: 'Organized study desk with laptop and books', description: 'Study Space' },
      { layerNumber: 2, prompt: 'Color-coded notes with highlighters and pens', description: 'Note Taking' },
      { layerNumber: 3, prompt: 'Textbooks open with important sections marked', description: 'Reading Material' },
      { layerNumber: 4, prompt: 'Coffee or energy drink for late night studying', description: 'Study Fuel' },
      { layerNumber: 5, prompt: 'Flashcards spread out for memorization', description: 'Flashcard Review' },
      { layerNumber: 6, prompt: 'Mind map or diagram explaining concepts', description: 'Visual Learning' },
      { layerNumber: 7, prompt: 'Study group collaborating on assignment', description: 'Group Study' },
      { layerNumber: 8, prompt: 'Library atmosphere, focused environment', description: 'Library Grind' },
      { layerNumber: 9, prompt: 'Practice problems being solved, working through', description: 'Problem Solving' },
      { layerNumber: 10, prompt: 'Calendar with exam dates circled', description: 'Exam Prep' },
      { layerNumber: 11, prompt: 'Completed assignment or good grade received', description: 'Success' },
      { layerNumber: 12, prompt: 'Text overlay "Study hard, dream big" motivation quote', description: 'Study Motto' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Gym Progress
  // ========================================
  workout_tracker: {
    templateId: 'workout_tracker',
    storyTitle: 'Transformation Journey',
    musicPrompt: 'Intense workout music with motivational gym energy',
    layers: [
      { layerNumber: 1, prompt: 'Starting point progress photo, before transformation', description: 'Day One' },
      { layerNumber: 2, prompt: 'Early morning alarm and workout gear ready', description: 'Rise & Grind' },
      { layerNumber: 3, prompt: 'Gym entrance or home workout setup', description: 'Workout Space' },
      { layerNumber: 4, prompt: 'Weight training or strength exercise in action', description: 'Lifting Heavy' },
      { layerNumber: 5, prompt: 'Cardio session, running or cycling energy', description: 'Cardio Burn' },
      { layerNumber: 6, prompt: 'Meal prep containers with healthy food', description: 'Nutrition Game' },
      { layerNumber: 7, prompt: 'Water bottle and gym towel, stay hydrated', description: 'Hydration Station' },
      { layerNumber: 8, prompt: 'Progress measurements or fitness tracker stats', description: 'Tracking Progress' },
      { layerNumber: 9, prompt: 'Post-workout selfie showing dedication', description: 'Gym Selfie' },
      { layerNumber: 10, prompt: 'Recovery and stretching, self-care', description: 'Recovery Time' },
      { layerNumber: 11, prompt: 'Current progress photo showing transformation', description: 'Progress Made' },
      { layerNumber: 12, prompt: 'Text overlay "Stronger than yesterday" fitness mantra', description: 'Keep Going' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Habit Tracker
  // ========================================
  habit_tracker: {
    templateId: 'habit_tracker',
    storyTitle: 'Daily Wins',
    musicPrompt: 'Uplifting productivity music with positive routine vibes',
    layers: [
      { layerNumber: 1, prompt: 'Blank habit tracker template, fresh start', description: 'Fresh Start' },
      { layerNumber: 2, prompt: 'Morning routine checklist, starting strong', description: 'Morning Ritual' },
      { layerNumber: 3, prompt: 'Water intake tracker with bottles', description: 'Hydration Goal' },
      { layerNumber: 4, prompt: 'Exercise habit checkbox marked complete', description: 'Workout Done' },
      { layerNumber: 5, prompt: 'Healthy meal logged, nutrition tracking', description: 'Eating Well' },
      { layerNumber: 6, prompt: 'Reading time habit, book pages turned', description: 'Reading Habit' },
      { layerNumber: 7, prompt: 'Meditation or mindfulness practice logged', description: 'Mindful Moment' },
      { layerNumber: 8, prompt: 'Sleep schedule tracking, consistent rest', description: 'Sleep Quality' },
      { layerNumber: 9, prompt: 'Productivity task completed, work habits', description: 'Tasks Completed' },
      { layerNumber: 10, prompt: 'Week completed with checkmarks, winning streak', description: 'Week Won' },
      { layerNumber: 11, prompt: 'Month view showing consistency and progress', description: 'Month Progress' },
      { layerNumber: 12, prompt: 'Text overlay "Small habits, big changes" motivational quote', description: 'Habit Power' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Career Goals
  // ========================================
  career_goals: {
    templateId: 'career_goals',
    storyTitle: 'Professional Rise',
    musicPrompt: 'Corporate motivational music with ambitious professional vibes',
    layers: [
      { layerNumber: 1, prompt: 'Professional headshot or LinkedIn photo', description: 'Professional Image' },
      { layerNumber: 2, prompt: 'Resume or CV being updated', description: 'Resume Update' },
      { layerNumber: 3, prompt: 'Networking event or professional conference', description: 'Networking' },
      { layerNumber: 4, prompt: 'Learning new skills, online courses or certifications', description: 'Skill Building' },
      { layerNumber: 5, prompt: 'Coffee meeting or mentorship discussion', description: 'Mentorship' },
      { layerNumber: 6, prompt: 'Project presentation or pitch meeting', description: 'Big Presentation' },
      { layerNumber: 7, prompt: 'Achieving milestone, award or recognition', description: 'Achievement' },
      { layerNumber: 8, prompt: 'Business cards or professional branding', description: 'Personal Brand' },
      { layerNumber: 9, prompt: 'Salary negotiation or promotion discussion', description: 'Level Up' },
      { layerNumber: 10, prompt: 'Industry conference badge or event attendance', description: 'Industry Events' },
      { layerNumber: 11, prompt: 'Corner office or dream workspace', description: 'Career Goal' },
      { layerNumber: 12, prompt: 'Text overlay "Success is not final" career quote', description: 'Keep Climbing' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Budget Planner
  // ========================================
  budget_planner: {
    templateId: 'budget_planner',
    storyTitle: 'Money Moves',
    musicPrompt: 'Calm financial planning music with smart money vibes',
    layers: [
      { layerNumber: 1, prompt: 'Piggy bank and coins, savings beginning', description: 'Start Saving' },
      { layerNumber: 2, prompt: 'Budget spreadsheet or app screenshot', description: 'Budget Planning' },
      { layerNumber: 3, prompt: 'Income sources listed, money in', description: 'Income Tracking' },
      { layerNumber: 4, prompt: 'Essential expenses breakdown, bills and necessities', description: 'Fixed Expenses' },
      { layerNumber: 5, prompt: 'Cutting unnecessary expenses, savings strategies', description: 'Smart Cuts' },
      { layerNumber: 6, prompt: 'Savings goal visualization, dream purchase or emergency fund', description: 'Savings Goal' },
      { layerNumber: 7, prompt: 'Investment portfolio or financial growth chart', description: 'Investing Wisely' },
      { layerNumber: 8, prompt: 'Debt payoff plan or loan reduction', description: 'Debt Freedom' },
      { layerNumber: 9, prompt: 'Financial books or resources for money management', description: 'Financial Education' },
      { layerNumber: 10, prompt: 'Monthly savings achievement, hitting targets', description: 'Monthly Win' },
      { layerNumber: 11, prompt: 'Growing bank account balance, progress visible', description: 'Balance Growing' },
      { layerNumber: 12, prompt: 'Text overlay "Save today, live tomorrow" financial wisdom', description: 'Money Mindset' },
    ],
  },

  // ========================================
  // FUN - Bingo Card
  // ========================================
  bingo_card: {
    templateId: 'bingo_card',
    storyTitle: 'Bingo Challenge',
    musicPrompt: 'Playful game show music with exciting challenge vibes',
    layers: [
      { layerNumber: 1, prompt: 'Empty bingo card grid, ready for challenge', description: 'Blank Card' },
      { layerNumber: 2, prompt: 'First bingo square completed with checkmark', description: 'First Check' },
      { layerNumber: 3, prompt: 'Easy challenge completed, simple task done', description: 'Easy Win' },
      { layerNumber: 4, prompt: 'Moderate challenge completed, getting harder', description: 'Medium Task' },
      { layerNumber: 5, prompt: 'Difficult challenge accomplished, tough one', description: 'Hard Challenge' },
      { layerNumber: 6, prompt: 'Multiple squares checked off, making progress', description: 'Progress Made' },
      { layerNumber: 7, prompt: 'Friends competing on their own cards', description: 'Friendly Competition' },
      { layerNumber: 8, prompt: 'Creative or funny bingo square completed', description: 'Fun Moment' },
      { layerNumber: 9, prompt: 'Almost complete card, tension building', description: 'Almost There' },
      { layerNumber: 10, prompt: 'Last square being attempted, final challenge', description: 'Final Square' },
      { layerNumber: 11, prompt: 'Complete bingo card, all checked off', description: 'BINGO!' },
      { layerNumber: 12, prompt: 'Text overlay "Challenge Accepted, Challenge Completed"', description: 'Victory' },
    ],
  },

  // ========================================
  // FUN - Year Wrapped
  // ========================================
  wrapped: {
    templateId: 'wrapped',
    storyTitle: 'Year in Review',
    musicPrompt: 'Nostalgic compilation music with year reflection vibes',
    layers: [
      { layerNumber: 1, prompt: 'Calendar showing January 1st, year beginning', description: 'New Year Start' },
      { layerNumber: 2, prompt: 'First quarter highlights, early year memories', description: 'Q1 Highlights' },
      { layerNumber: 3, prompt: 'Spring and summer adventures, seasonal moments', description: 'Summer Vibes' },
      { layerNumber: 4, prompt: 'Major achievement or milestone reached', description: 'Big Achievement' },
      { layerNumber: 5, prompt: 'Travel moments from the year, wanderlust', description: 'Travel Memories' },
      { layerNumber: 6, prompt: 'Favorite moments with friends and family', description: 'Best People' },
      { layerNumber: 7, prompt: 'Personal growth moments, lessons learned', description: 'Growth Journey' },
      { layerNumber: 8, prompt: 'Top songs or albums of the year', description: 'Music Soundtrack' },
      { layerNumber: 9, prompt: 'Challenges overcome, tough moments conquered', description: 'Overcame Challenges' },
      { layerNumber: 10, prompt: 'Favorite photos from throughout the year', description: 'Photo Highlights' },
      { layerNumber: 11, prompt: 'December 31st countdown, year ending', description: 'Year End' },
      { layerNumber: 12, prompt: 'Text overlay "Grateful for this year" reflection quote', description: 'Gratitude' },
    ],
  },

  // ========================================
  // SOCIAL - Couples Canvas
  // ========================================
  couples_canvas: {
    templateId: 'couples_canvas',
    storyTitle: 'Love Story',
    musicPrompt: 'Romantic sweet music with relationship love vibes',
    layers: [
      { layerNumber: 1, prompt: 'How we met story, first encounter memory', description: 'How We Met' },
      { layerNumber: 2, prompt: 'First date location or activity together', description: 'First Date' },
      { layerNumber: 3, prompt: 'Couple selfie showing happiness together', description: 'Happy Together' },
      { layerNumber: 4, prompt: 'Special tradition or inside joke between couple', description: 'Our Thing' },
      { layerNumber: 5, prompt: 'Adventure or trip taken together', description: 'Adventures' },
      { layerNumber: 6, prompt: 'Cozy home date night, quality time', description: 'Cozy Nights' },
      { layerNumber: 7, prompt: 'Supporting each other through challenges', description: 'Through Thick & Thin' },
      { layerNumber: 8, prompt: 'Celebrating milestones and anniversaries', description: 'Milestones' },
      { layerNumber: 9, prompt: 'Silly moments and laughter together', description: 'Silly Us' },
      { layerNumber: 10, prompt: 'Future dreams and plans together', description: 'Future Together' },
      { layerNumber: 11, prompt: 'Love notes or sweet messages exchanged', description: 'Love Notes' },
      { layerNumber: 12, prompt: 'Text overlay "You & Me forever" love quote', description: 'Forever Love' },
    ],
  },

  // ========================================
  // SOCIAL - Friendship Anniversary
  // ========================================
  friendship_anniversary: {
    templateId: 'friendship_anniversary',
    storyTitle: 'Friendship Forever',
    musicPrompt: 'Cheerful friendship celebration music, best friends energy',
    layers: [
      { layerNumber: 1, prompt: 'First photo together, when friendship began', description: 'Day We Met' },
      { layerNumber: 2, prompt: 'Early friendship memories, getting to know each other', description: 'Early Days' },
      { layerNumber: 3, prompt: 'Inside jokes that only you two understand', description: 'Inside Jokes' },
      { layerNumber: 4, prompt: 'Adventures and spontaneous trips together', description: 'Adventures' },
      { layerNumber: 5, prompt: 'Being there through tough times', description: 'Through Hard Times' },
      { layerNumber: 6, prompt: 'Celebrating wins together, shared joy', description: 'Celebrating Wins' },
      { layerNumber: 7, prompt: 'Matching outfits or coordinated looks', description: 'Twinning' },
      { layerNumber: 8, prompt: 'Late night talks and deep conversations', description: 'Late Night Talks' },
      { layerNumber: 9, prompt: 'Silly photos and goofy moments', description: 'Being Silly' },
      { layerNumber: 10, prompt: 'Supporting each other\'s dreams', description: 'Dream Support' },
      { layerNumber: 11, prompt: 'Recent photo together, friendship strong', description: 'Still Going Strong' },
      { layerNumber: 12, prompt: 'Text overlay "Best friends for life" friendship promise', description: 'BFFs Forever' },
    ],
  },

  // ========================================
  // CREATIVE - Quick Flex
  // ========================================
  quick_flex: {
    templateId: 'quick_flex',
    storyTitle: 'Minimal Flex',
    musicPrompt: 'Cool confident music with subtle flex vibes, minimalist beats',
    layers: [
      { layerNumber: 1, prompt: 'Clean minimal background, setting the tone', description: 'Clean Start' },
      { layerNumber: 2, prompt: 'Achievement or accomplishment showcased simply', description: 'The Flex' },
      { layerNumber: 3, prompt: 'Luxury item or purchase, tasteful display', description: 'Worth It' },
      { layerNumber: 4, prompt: 'Workspace or creative setup, aesthetic minimal', description: 'Work Space' },
      { layerNumber: 5, prompt: 'Style moment, outfit or accessory detail', description: 'Style Detail' },
      { layerNumber: 6, prompt: 'Travel destination or exclusive location', description: 'Location Flex' },
      { layerNumber: 7, prompt: 'Skill or talent display, subtle showcase', description: 'Skill Flex' },
      { layerNumber: 8, prompt: 'Lifestyle moment, living well', description: 'Life Style' },
      { layerNumber: 9, prompt: 'Minimal art or design piece', description: 'Aesthetic' },
      { layerNumber: 10, prompt: 'Night city view or luxury setting', description: 'Evening Vibe' },
      { layerNumber: 11, prompt: 'Confident pose or power stance', description: 'Confidence' },
      { layerNumber: 12, prompt: 'Text overlay "Less is more" minimal philosophy', description: 'Minimal Motto' },
    ],
  },

  // ========================================
  // SPECIAL - Blank Canvas (Keep Flexible)
  // ========================================
  blank_canvas: {
    templateId: 'blank_canvas',
    storyTitle: 'Your Story',
    musicPrompt: 'Versatile ambient music, open creative energy',
    layers: [
      { layerNumber: 1, prompt: 'Clean slate, pure white canvas ready', description: 'Fresh Canvas' },
      { layerNumber: 2, prompt: 'Abstract geometric shape, modern design', description: 'Modern Element' },
      { layerNumber: 3, prompt: 'Color gradient background, vibrant energy', description: 'Color Energy' },
      { layerNumber: 4, prompt: 'Minimalist composition with single object', description: 'Minimal Focus' },
      { layerNumber: 5, prompt: 'Nature element, organic texture', description: 'Natural Touch' },
      { layerNumber: 6, prompt: 'Urban architecture detail, city aesthetic', description: 'Urban Style' },
      { layerNumber: 7, prompt: 'Artistic pattern or texture', description: 'Pattern Play' },
      { layerNumber: 8, prompt: 'Light and shadow play, dramatic contrast', description: 'Light Drama' },
      { layerNumber: 9, prompt: 'Abstract art expression, creative flow', description: 'Creative Flow' },
      { layerNumber: 10, prompt: 'Unexpected perspective or angle', description: 'Fresh Perspective' },
      { layerNumber: 11, prompt: 'Final creative element bringing it together', description: 'Final Touch' },
      { layerNumber: 12, prompt: 'Text overlay with custom message or quote', description: 'Your Message' },
    ],
  },

  // ========================================
  // LIFESTYLE - TGIF
  // ========================================
  tgif: {
    templateId: 'tgif',
    storyTitle: 'Friday Feeling',
    musicPrompt: 'High energy party music with weekend celebration vibes',
    layers: [
      { layerNumber: 1, prompt: 'Friday morning alarm, excited to wake up', description: 'Friday Morning' },
      { layerNumber: 2, prompt: 'Work day flying by, counting down hours', description: 'Almost There' },
      { layerNumber: 3, prompt: 'Clock hitting 5pm, freedom time', description: 'Clock Out' },
      { layerNumber: 4, prompt: 'Changing from work clothes to party outfit', description: 'Outfit Change' },
      { layerNumber: 5, prompt: 'Meeting friends, squad assembling', description: 'Squad Up' },
      { layerNumber: 6, prompt: 'Happy hour drinks, cheers to weekend', description: 'Happy Hour' },
      { layerNumber: 7, prompt: 'Dinner out at favorite restaurant', description: 'Dinner Time' },
      { layerNumber: 8, prompt: 'Heading to party or club, night starting', description: 'Night Begins' },
      { layerNumber: 9, prompt: 'Dance floor energy, letting loose', description: 'Dance Floor' },
      { layerNumber: 10, prompt: 'Late night adventures, making memories', description: 'Late Night' },
      { layerNumber: 11, prompt: 'Sunrise ending the night, epic conclusion', description: 'Night End' },
      { layerNumber: 12, prompt: 'Text overlay "Best Friday Ever" celebration text', description: 'Epic Friday' },
    ],
  },

  // ========================================
  // LIFESTYLE - Weekend Vibes
  // ========================================
  weekend_vibes: {
    templateId: 'weekend_vibes',
    storyTitle: 'Weekend Mode',
    musicPrompt: 'Relaxed chill music with weekend relaxation vibes',
    layers: [
      { layerNumber: 1, prompt: 'Sleeping in, no alarm clock bliss', description: 'Sleep In' },
      { layerNumber: 2, prompt: 'Lazy morning in pajamas, coffee in bed', description: 'Lazy Morning' },
      { layerNumber: 3, prompt: 'Leisurely brunch with mimosas', description: 'Brunch Goals' },
      { layerNumber: 4, prompt: 'Outdoor activity, enjoying nice weather', description: 'Outside Time' },
      { layerNumber: 5, prompt: 'Shopping or exploring local spots', description: 'Explore' },
      { layerNumber: 6, prompt: 'Afternoon nap or reading break', description: 'Afternoon Chill' },
      { layerNumber: 7, prompt: 'Hobby time, creative pursuits', description: 'Hobby Hour' },
      { layerNumber: 8, prompt: 'Quality time with loved ones', description: 'Together Time' },
      { layerNumber: 9, prompt: 'Sunset viewing, golden hour magic', description: 'Golden Hour' },
      { layerNumber: 10, prompt: 'Home cooked meal or takeout treat', description: 'Good Food' },
      { layerNumber: 11, prompt: 'Movie night or show binge', description: 'Entertainment' },
      { layerNumber: 12, prompt: 'Text overlay "Weekends are for living" lifestyle motto', description: 'Weekend Life' },
    ],
  },

  // ========================================
  // LIFESTYLE - Saturday Night
  // ========================================
  saturday_night: {
    templateId: 'saturday_night',
    storyTitle: 'Saturday Night Live',
    musicPrompt: 'Energetic club music with party night vibes',
    layers: [
      { layerNumber: 1, prompt: 'Getting ready montage, hair and makeup', description: 'Getting Ready' },
      { layerNumber: 2, prompt: 'Mirror selfie in going out outfit', description: 'Outfit Check' },
      { layerNumber: 3, prompt: 'Pre-game with friends, getting hyped', description: 'Pre-Game' },
      { layerNumber: 4, prompt: 'Uber or ride to the venue', description: 'On The Way' },
      { layerNumber: 5, prompt: 'Club entrance, line or VIP entry', description: 'Arrival' },
      { layerNumber: 6, prompt: 'First round of drinks ordered', description: 'Drinks Flowing' },
      { layerNumber: 7, prompt: 'DJ booth and music pumping', description: 'Music Vibes' },
      { layerNumber: 8, prompt: 'Dance circle with squad, energy peak', description: 'Dance Squad' },
      { layerNumber: 9, prompt: 'Making new friends, social butterfly', description: 'Meeting People' },
      { layerNumber: 10, prompt: 'Group photo capturing the moment', description: 'Memory Captured' },
      { layerNumber: 11, prompt: 'After party or late night food', description: 'Night Continues' },
      { layerNumber: 12, prompt: 'Text overlay "Saturdays are for the squad" night motto', description: 'Squad Night' },
    ],
  },

  // ========================================
  // LIFESTYLE - Sunday Funday
  // ========================================
  sunday_funday: {
    templateId: 'sunday_funday',
    storyTitle: 'Self Care Sunday',
    musicPrompt: 'Peaceful relaxing music with self-care Sunday vibes',
    layers: [
      { layerNumber: 1, prompt: 'Morning meditation or yoga, peaceful start', description: 'Mindful Morning' },
      { layerNumber: 2, prompt: 'Healthy breakfast spread, nourishing meal', description: 'Breakfast Spread' },
      { layerNumber: 3, prompt: 'Face mask and skincare routine', description: 'Skincare Sunday' },
      { layerNumber: 4, prompt: 'Journaling or planning week ahead', description: 'Planning Time' },
      { layerNumber: 5, prompt: 'Walk in nature or outdoor relaxation', description: 'Nature Walk' },
      { layerNumber: 6, prompt: 'Favorite hobby or creative project', description: 'Creative Time' },
      { layerNumber: 7, prompt: 'Bubble bath or spa at home', description: 'Bath Time' },
      { layerNumber: 8, prompt: 'Reading book or listening to podcast', description: 'Mind Food' },
      { layerNumber: 9, prompt: 'Cooking or baking therapy', description: 'Kitchen Therapy' },
      { layerNumber: 10, prompt: 'Phone on do not disturb, unplugging', description: 'Digital Detox' },
      { layerNumber: 11, prompt: 'Early bedtime prep, restful evening', description: 'Rest Prep' },
      { layerNumber: 12, prompt: 'Text overlay "Self-care is not selfish" wellness quote', description: 'Self Love' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Hump Day Wednesday
  // ========================================
  hump_day: {
    templateId: 'hump_day',
    storyTitle: 'Midweek Motivation',
    musicPrompt: 'Motivational push music with midweek energy boost',
    layers: [
      { layerNumber: 1, prompt: 'Wednesday morning, halfway through week', description: 'Hump Day' },
      { layerNumber: 2, prompt: 'Extra coffee needed, caffeine boost', description: 'Caffeine Power' },
      { layerNumber: 3, prompt: 'To-do list review, checking progress', description: 'Progress Check' },
      { layerNumber: 4, prompt: 'Motivational quote on workspace', description: 'Motivation Needed' },
      { layerNumber: 5, prompt: 'Power through work tasks, focused energy', description: 'Power Through' },
      { layerNumber: 6, prompt: 'Lunch break recharge, midday reset', description: 'Midday Recharge' },
      { layerNumber: 7, prompt: 'Afternoon productivity burst', description: 'Second Wind' },
      { layerNumber: 8, prompt: 'Team collaboration, shared goals', description: 'Team Energy' },
      { layerNumber: 9, prompt: 'Crossing off completed tasks', description: 'Tasks Done' },
      { layerNumber: 10, prompt: 'Planning for rest of week', description: 'Week Planning' },
      { layerNumber: 11, prompt: 'Small wins to celebrate', description: 'Small Victories' },
      { layerNumber: 12, prompt: 'Text overlay "Halfway there, keep going" midweek mantra', description: 'Keep Pushing' },
    ],
  },

  // ========================================
  // PRODUCTIVITY - Fresh Start Friday
  // ========================================
  fresh_start: {
    templateId: 'fresh_start',
    storyTitle: 'End Strong',
    musicPrompt: 'Triumphant ending music with week completion energy',
    layers: [
      { layerNumber: 1, prompt: 'Friday morning with positive energy', description: 'Friday Energy' },
      { layerNumber: 2, prompt: 'Week recap, looking at achievements', description: 'Week Review' },
      { layerNumber: 3, prompt: 'Completed projects or finished tasks', description: 'Finished Work' },
      { layerNumber: 4, prompt: 'Goals hit for the week', description: 'Goals Achieved' },
      { layerNumber: 5, prompt: 'Team wins and collaboration success', description: 'Team Success' },
      { layerNumber: 6, prompt: 'Personal growth moments from week', description: 'Growth Moments' },
      { layerNumber: 7, prompt: 'Challenges overcome this week', description: 'Obstacles Beaten' },
      { layerNumber: 8, prompt: 'Lessons learned to carry forward', description: 'Lessons Learned' },
      { layerNumber: 9, prompt: 'Celebrating small and big wins', description: 'Celebration Time' },
      { layerNumber: 10, prompt: 'Setting intentions for next week', description: 'Next Week Goals' },
      { layerNumber: 11, prompt: 'Weekend plans reward for hard work', description: 'Weekend Reward' },
      { layerNumber: 12, prompt: 'Text overlay "Finished strong, ready for more" success mindset', description: 'Strong Finish' },
    ],
  },

  // ========================================
  // FUN - Truth or Dare
  // ========================================
  truth_or_dare: {
    templateId: 'truth_or_dare',
    storyTitle: 'Truth or Dare Night',
    musicPrompt: 'Suspenseful party game music with daring challenge vibes',
    layers: [
      { layerNumber: 1, prompt: 'Group circle gathered for game', description: 'Game Time' },
      { layerNumber: 2, prompt: 'Spinning bottle or choosing victim', description: 'Who\'s Next' },
      { layerNumber: 3, prompt: 'First truth question being asked', description: 'Truth Question' },
      { layerNumber: 4, prompt: 'Confession revealed, shocking truth', description: 'Truth Revealed' },
      { layerNumber: 5, prompt: 'Dare challenge presented, risky move', description: 'Dare Challenge' },
      { layerNumber: 6, prompt: 'Victim attempting dare, nervous energy', description: 'Doing Dare' },
      { layerNumber: 7, prompt: 'Embarrassing dare completed, everyone laughing', description: 'Dare Done' },
      { layerNumber: 8, prompt: 'Wild truth confession, drama ensues', description: 'Wild Confession' },
      { layerNumber: 9, prompt: 'Epic dare that everyone remembers', description: 'Epic Dare' },
      { layerNumber: 10, prompt: 'Group reaction to shocking moment', description: 'Shocked Reactions' },
      { layerNumber: 11, prompt: 'Final round, stakes getting higher', description: 'Final Round' },
      { layerNumber: 12, prompt: 'Text overlay "What happens in truth or dare..." game motto', description: 'Game Secrets' },
    ],
  },

  // ========================================
  // FUN - Would You Rather
  // ========================================
  would_you_rather: {
    templateId: 'would_you_rather',
    storyTitle: 'Impossible Choices',
    musicPrompt: 'Thinking music with decision-making dilemma vibes',
    layers: [
      { layerNumber: 1, prompt: 'Two options presented side by side', description: 'The Question' },
      { layerNumber: 2, prompt: 'Person contemplating difficult choice', description: 'Thinking Hard' },
      { layerNumber: 3, prompt: 'Pro and con list for each option', description: 'Weighing Options' },
      { layerNumber: 4, prompt: 'Friends debating different sides', description: 'The Debate' },
      { layerNumber: 5, prompt: 'Impossible scenario visualization', description: 'Wild Scenario' },
      { layerNumber: 6, prompt: 'Split decision among group', description: 'Divided Opinions' },
      { layerNumber: 7, prompt: 'Explaining reasoning for choice', description: 'The Reasoning' },
      { layerNumber: 8, prompt: 'Plot twist making choice harder', description: 'Plot Twist' },
      { layerNumber: 9, prompt: 'Final decision being made', description: 'Final Choice' },
      { layerNumber: 10, prompt: 'Reactions to choice revealed', description: 'Reactions' },
      { layerNumber: 11, prompt: 'Next impossible question coming', description: 'Next Round' },
      { layerNumber: 12, prompt: 'Text overlay "The hardest choices" philosophical text', description: 'Deep Thoughts' },
    ],
  },

  // ========================================
  // FUN - Hot Takes
  // ========================================
  hot_takes: {
    templateId: 'hot_takes',
    storyTitle: 'Controversial Corner',
    musicPrompt: 'Intense debate music with controversial opinion energy',
    layers: [
      { layerNumber: 1, prompt: 'Warning sign, controversial opinions ahead', description: 'Warning' },
      { layerNumber: 2, prompt: 'First hot take presented boldly', description: 'Hot Take 1' },
      { layerNumber: 3, prompt: 'Shocked reactions from listeners', description: 'Shock Factor' },
      { layerNumber: 4, prompt: 'Defending the unpopular opinion', description: 'Defense' },
      { layerNumber: 5, prompt: 'Another controversial take', description: 'Hot Take 2' },
      { layerNumber: 6, prompt: 'Debate breaking out, multiple sides', description: 'The Debate' },
      { layerNumber: 7, prompt: 'Evidence supporting hot take', description: 'Making Points' },
      { layerNumber: 8, prompt: 'Most controversial take yet', description: 'Nuclear Take' },
      { layerNumber: 9, prompt: 'Comments section going wild', description: 'Internet React' },
      { layerNumber: 10, prompt: 'Standing by opinions despite backlash', description: 'Stand Firm' },
      { layerNumber: 11, prompt: 'Final hot take to end it', description: 'Final Take' },
      { layerNumber: 12, prompt: 'Text overlay "Change my mind" challenge text', description: 'Challenge' },
    ],
  },

  // ========================================
  // FUN - Never Have I Ever
  // ========================================
  never_have_i_ever: {
    templateId: 'never_have_i_ever',
    storyTitle: 'Confession Time',
    musicPrompt: 'Playful confession music with secret revealing vibes',
    layers: [
      { layerNumber: 1, prompt: 'Group sitting in circle for game', description: 'Game Setup' },
      { layerNumber: 2, prompt: 'First confession statement made', description: 'First Confession' },
      { layerNumber: 3, prompt: 'People raising hands admitting they have', description: 'Who Has?' },
      { layerNumber: 4, prompt: 'Story behind the confession', description: 'The Story' },
      { layerNumber: 5, prompt: 'Surprising confession nobody expected', description: 'Plot Twist' },
      { layerNumber: 6, prompt: 'Everyone has done this one', description: 'Universal Truth' },
      { layerNumber: 7, prompt: 'Wild confession that shocks group', description: 'Wild One' },
      { layerNumber: 8, prompt: 'Innocent confession everyone laughs at', description: 'Innocent One' },
      { layerNumber: 9, prompt: 'Spicy confession gets attention', description: 'Spicy Truth' },
      { layerNumber: 10, prompt: 'Friends learning new things about each other', description: 'New Info' },
      { layerNumber: 11, prompt: 'Most embarrassing confession', description: 'Embarrassing' },
      { layerNumber: 12, prompt: 'Text overlay "What happens at NHIE..." secrecy pact', description: 'Game Secrets' },
    ],
  },

  // ========================================
  // FUN - Weekend This or That
  // ========================================
  this_or_that_weekend: {
    templateId: 'this_or_that_weekend',
    storyTitle: 'Weekend Edition',
    musicPrompt: 'Fun weekend decision music with choice-making vibes',
    layers: [
      { layerNumber: 1, prompt: 'Saturday party vs Sunday chill comparison', description: 'Saturday or Sunday' },
      { layerNumber: 2, prompt: 'Going out vs staying in decision', description: 'Out or In' },
      { layerNumber: 3, prompt: 'Brunch vs breakfast in bed choice', description: 'Brunch or Bed' },
      { layerNumber: 4, prompt: 'Day drinking vs night party option', description: 'Day or Night' },
      { layerNumber: 5, prompt: 'Adventure vs relaxation weekend', description: 'Active or Chill' },
      { layerNumber: 6, prompt: 'Friends hangout vs solo time', description: 'Social or Solo' },
      { layerNumber: 7, prompt: 'Road trip vs staycation choice', description: 'Travel or Stay' },
      { layerNumber: 8, prompt: 'Fancy dinner vs food delivery', description: 'Dine or Deliver' },
      { layerNumber: 9, prompt: 'Early start vs sleep in decision', description: 'Early or Late' },
      { layerNumber: 10, prompt: 'Shopping vs saving money choice', description: 'Spend or Save' },
      { layerNumber: 11, prompt: 'Movie theater vs home streaming', description: 'Theater or Home' },
      { layerNumber: 12, prompt: 'Text overlay "Weekend decisions matter" choice philosophy', description: 'Choose Wisely' },
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
