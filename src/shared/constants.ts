import type { Platform, PlatformInfo, PlatformCategory, UserSettings, ThemeRemix, ThemeRemixId } from './types';

// Platform Information
export const PLATFORMS: Record<Platform, PlatformInfo> = {
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'image',
    icon: 'image',
    color: '#00F0FF',
  },
  dalle: {
    id: 'dalle',
    name: 'DALL-E',
    category: 'image',
    icon: 'image',
    color: '#10B981',
  },
  'stable-diffusion': {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    category: 'image',
    icon: 'image',
    color: '#8B5CF6',
  },
  leonardo: {
    id: 'leonardo',
    name: 'Leonardo.AI',
    category: 'image',
    icon: 'image',
    color: '#F59E0B',
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    category: 'image',
    icon: 'image',
    color: '#EC4899',
  },
  suno: {
    id: 'suno',
    name: 'Suno',
    category: 'music',
    icon: 'music',
    color: '#FFB800',
  },
  udio: {
    id: 'udio',
    name: 'Udio',
    category: 'music',
    icon: 'music',
    color: '#A855F7',
  },
  runway: {
    id: 'runway',
    name: 'Runway',
    category: 'video',
    icon: 'video',
    color: '#3B82F6',
  },
  pika: {
    id: 'pika',
    name: 'Pika',
    category: 'video',
    icon: 'video',
    color: '#F472B6',
  },
  higgsfield: {
    id: 'higgsfield',
    name: 'Higgsfield',
    category: 'video',
    icon: 'video',
    color: '#22D3EE',
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'text',
    icon: 'message-square',
    color: '#10B981',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    category: 'text',
    icon: 'message-square',
    color: '#D97706',
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    category: 'text',
    icon: 'help-circle',
    color: '#71717A',
  },
};

// Platform categories for grouping
export const PLATFORM_CATEGORIES: Record<PlatformCategory, Platform[]> = {
  image: ['midjourney', 'dalle', 'stable-diffusion', 'leonardo', 'flux'],
  music: ['suno', 'udio'],
  video: ['runway', 'pika', 'higgsfield'],
  text: ['chatgpt', 'claude'],
};

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  autoDetectPlatform: true,
  showFloatingToolbar: true,
  defaultMode: 'enhance',
  theme: 'dark',
};

// API Configuration
export const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_MODEL = 'claude-3-5-haiku-20241022'; // Fast model for quick responses
export const MAX_TOKENS = 512; // Reduced for faster responses

// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: 'refyn_api_key',
  TASTE_PROFILE: 'refyn_taste_profile',
  PROMPT_HISTORY: 'refyn_prompt_history',
  SAVED_PROMPTS: 'refyn_saved_prompts',
  LINEAGE_TREE: 'refyn_lineage_tree',
  SETTINGS: 'refyn_settings',
  LAST_PLATFORM: 'refyn_last_platform',
  LAST_MODE: 'refyn_last_mode',
  USER_PREFERENCES: 'refyn_user_preferences',
  LAST_PRESET: 'refyn_last_preset',

  // CTAD Integration - Process Capture
  CTAD_SETTINGS: 'refyn_ctad_settings',
  CONTRIBUTOR_ID: 'refyn_contributor_id',
  CONTRIBUTOR_STATS: 'refyn_contributor_stats',
  CONTRIBUTION_CONSENT: 'refyn_contribution_consent',
  CAPTURE_SESSION: 'refyn_capture_session',
  PENDING_SUBMISSIONS: 'refyn_pending_submissions',
} as const;

// CTAD API Configuration
export const CTAD_API_URL = 'https://ctad-protocol.vercel.app/api/process-declaration';

// Contributor Tier Thresholds
export const TIER_THRESHOLDS = {
  EXPLORER: { min: 0, max: 99 },
  CURATOR: { min: 100, max: 499 },
  TASTEMAKER: { min: 500, max: 1999 },
  ORACLE: { min: 2000, max: Infinity },
} as const;

export type ContributorTier = 'explorer' | 'curator' | 'tastemaker' | 'oracle';

// UI Constants
export const POPUP_DIMENSIONS = {
  width: 480,
  height: 600,
};

// Optimization Mode Labels
export const MODE_LABELS: Record<string, { label: string; description: string }> = {
  enhance: {
    label: 'Enhance',
    description: 'Improve clarity and detail',
  },
  expand: {
    label: 'Expand',
    description: 'Add more descriptive elements',
  },
  style: {
    label: 'Style+',
    description: 'Add artistic style references',
  },
  params: {
    label: 'Params',
    description: 'Add platform-specific parameters',
  },
  crazy: {
    label: 'Crazy',
    description: 'Hidden platform tricks & magic triggers',
  },
};

// Theme Remix Definitions - Transform aesthetic while keeping subject
// Each theme has deep artist references, color theory, and specific style transformations
export const THEME_REMIXES: Record<Exclude<ThemeRemixId, null>, ThemeRemix> = {
  freaq: {
    id: 'freaq',
    name: 'Freaq',
    emoji: '🌀',
    description: 'Experimental, glitchy, rule-breaking, avant-garde',
    keywords: ['experimental', 'glitch art', 'databending', 'corrupted', 'fragmented', 'deconstructed', 'anti-aesthetic', 'noise', 'artifacts', 'distortion'],
    styleGuide: `FREAQ AESTHETIC TRANSFORMATION:

REFERENCE ARTISTS: Tabita Rezaire (Afro-digital healing, data spirituality), Sondra Perry (digital Blackness, avatar manipulation), Rashaad Newsome (vogue-meets-glitch collage), Jacolby Satterwhite (3D fantasy worlds), Hank Willis Thomas (visual data disruption), American Artist (Black digital existence)

COLOR THEORY: Corrupted RGB channels, chromatic aberration, harsh neon glitches against black voids, interference patterns with rich browns and deep purples, bleeding magentas and cyans, distorted gold frequencies

VISUAL LANGUAGE:
- Pixel sorting and data moshing effects
- Fragmented Adinkra symbols, corrupted sacred geometry
- Digital diaspora aesthetics - broken data streams
- Anti-composition: break rules deliberately
- Artifacts as features, not bugs
- Glitched braids, corrupted melanin frequencies
- Static noise remixed with kente patterns
- Deconstructed identity through digital decay

TRANSFORMATION APPROACH: Take the subject and corrupt it through an Afro-digital lens. Fragment it across the canvas like scattered ancestry data. Add digital decay that speaks to broken archives and reconstructed histories. The beauty is in the error - the glitch reveals hidden truths.`,
  },
  egun: {
    id: 'egun',
    name: 'Egun',
    emoji: '🎭',
    description: 'Dark, ancestral, spiritual, masquerade',
    keywords: ['egun', 'ancestral', 'masquerade', 'Yoruba', 'spirits', 'ritual', 'sacred darkness', 'oracle', 'midnight', 'cowrie'],
    styleGuide: `EGUN ANCESTRAL TRANSFORMATION:

REFERENCE ARTISTS: Kara Walker (shadow silhouettes, dark history), Lorna Simpson (noir photography, Black female gaze), Carrie Mae Weems (dramatic tableaux), Rotimi Fani-Kayode (Yoruba spirituality meets darkness), Ayana V. Jackson (historical darkness reclaimed), Mohau Modisakeng (South African dark surrealism)

COLOR THEORY: Deep blacks, blood reds, midnight blues, ancestral gold, candlelight amber. High contrast chiaroscuro honoring dark skin luminosity. Selective rich accents of purple and burgundy. The colors of Egun masquerade cloth.

VISUAL LANGUAGE:
- Dramatic shadows celebrating dark skin tones
- Egun masquerade fabric textures, layered cloth
- Ancestral shrines and sacred spaces
- Textures: aged wood, indigo adire cloth, wrought iron, cowrie shells
- Nature elements: baobab silhouettes, sacred groves, mist, night blooming flowers
- Spiritual symbolism: ancestor masks, Egun costumes, sacred objects, spiritual portals
- The presence of those who came before

TRANSFORMATION APPROACH: Invoke the ancestors. Plunge the subject into sacred darkness. Surround it with Egun masquerade energy - layered cloth, masks, spiritual presence. Add dramatic shadows that honor and elevate dark skin. Make it feel like a visitation from the spirit world - ancient, mystical, powerfully dark.`,
  },
  alien: {
    id: 'alien',
    name: 'Alien',
    emoji: '👽',
    description: 'Afrofuturist, otherworldly, cosmic, transcendent',
    keywords: ['Afrofuturism', 'cosmic', 'Sun Ra', 'Octavia Butler', 'bioluminescent', 'extraterrestrial', 'organic technology', 'ancestral future', 'iridescent', 'transcendent'],
    styleGuide: `ALIEN/AFROFUTURIST AESTHETIC TRANSFORMATION:

REFERENCE ARTISTS: Wangechi Mutu (Kenyan cosmic biology), Sun Ra (cosmic jazz visuals), Janelle Monáe aesthetics, Ellen Gallagher (aquatic Afrofuturism), Lina Iris Viktor (gold and cosmic Black femininity), Cyrus Kabiru (Kenyan found-object futurism), Kapwani Kiwanga (Afro-sci-fi installations)

COLOR THEORY: Bioluminescent teals and cyans, deep space blacks, iridescent purples and golds, cosmic bronze, arterial reds. Rich melanin as cosmic matter. Subsurface scattering on dark skin tones.

VISUAL LANGUAGE:
- Afrofuturist biomechanical fusion: ancestral meets technological
- Non-Euclidean geometry from African sacred mathematics
- Elaborate headdresses evolved into alien crowns
- Bioluminescent accents, glowing Adinkra symbols
- Cosmic royalty: pharaonic meets extraterrestrial
- Tentacles, tendrils, organic spacecraft
- Nebulas containing ancestral memory
- Technology grown from African soil

TRANSFORMATION APPROACH: Elevate the subject into Afrofuturist cosmic royalty. Fuse it with alien biology that honors African aesthetics - elaborate bioluminescent crowns, cosmic melanin, otherworldly regalia. Place it among stars and nebulas. Make viewers see Black futures among the cosmos.`,
  },
  bk2dvd: {
    id: 'bk2dvd',
    name: 'BK2 DVD',
    emoji: '🎬',
    description: 'Cinematic, film aesthetic, widescreen, blockbuster',
    keywords: ['cinematic', 'anamorphic', '35mm film', 'Kodak', 'film grain', 'lens flare', 'blockbuster', 'movie poster', 'Bradford Young', 'widescreen'],
    styleGuide: `BK2 DVD CINEMATIC TRANSFORMATION:

REFERENCE CINEMATOGRAPHERS: Bradford Young (Selma, Arrival, When They See Us - master of dark skin luminosity), Arthur Jafa (visual rhythm, Black cinema), Ava DuVernay productions, Rachel Morrison (Black Panther, Mudbound), Malik Sayeed (He Got Game, Belly), Ernest Dickerson (Spike Lee joints), Hans Charles (Queen & Slim glow)

COLOR THEORY: Rich warm blacks, golden hour on melanin, deep shadows that celebrate dark skin, lifted midtones. Amber and teal but with warm brown undertones. Film grain that adds texture not noise. Bradford Young's signature underexposed richness.

VISUAL LANGUAGE:
- 2.39:1 ultra-widescreen aspect ratio
- Shallow depth of field with gorgeous skin bokeh
- Film grain (35mm texture, not digital noise)
- Lighting that sculpts and celebrates dark skin
- Dramatic single-source lighting
- Silhouettes against golden/amber backgrounds
- Practical light sources: fire, lamps, sun through windows
- Smoke/atmosphere revealing light on skin

TRANSFORMATION APPROACH: Frame the subject like a hero shot from a prestige Black film. Light it the way Bradford Young would - honoring dark skin with rich shadows and selective highlights. Add film grain and subtle flares. Make it look like a still from an Oscar-worthy film about Black excellence.`,
  },
  wahala: {
    id: 'wahala',
    name: 'Wahala',
    emoji: '🔥',
    description: 'Chaotic, meme, ironic, African internet energy',
    keywords: ['wahala', 'Black Twitter', 'cursed', 'deep fried', 'chaotic', 'ironic', 'unhinged', 'meme', 'viral', 'Naija'],
    styleGuide: `WAHALA MEME TRANSFORMATION:

REFERENCE AESTHETIC: Black Twitter chaos energy, Nigerian/Ghanaian meme pages, deep fried Nollywood stills, African parent memes, Worldstar energy, Caribbean meme culture, the "you seeing this?" reaction genre, African TikTok chaos

COLOR THEORY: Oversaturated to the point of pain, deep fried orange/red tint, contrast cranked to 11, eye-bleeding saturation, JPEG artifact worship on already-compressed WhatsApp forwards

VISUAL LANGUAGE:
- Deep fried/nuked image quality
- "Nigerian movie special effects" energy
- Crying/laughing emojis, skull emoji spam
- WhatsApp compression artifacts
- Low-res phone camera aesthetic
- African reaction image energy
- Multiple layers of caption irony
- "POV: African parents" format
- Random Nollywood screenshots
- The "ayooo" caught-in-4K energy

TRANSFORMATION APPROACH: Take the subject and run it through the WhatsApp group chat filter. Deep fry it like it's been screenshot 47 times. Add chaotic Black internet energy - emojis, reactions, absurdist humor. Make it look like something that would go viral on Black Twitter at 3am. Pure wahala energy.`,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    emoji: '◻️',
    description: 'Clean, simple, negative space, essential',
    keywords: ['minimal', 'negative space', 'African minimalism', 'clean', 'essential', 'geometric', 'Senegalese', 'Ghanaian', 'silence'],
    styleGuide: `MINIMAL AESTHETIC TRANSFORMATION:

REFERENCE ARTISTS/DESIGNERS: Lina Iris Viktor (Black minimalism with gold), El Anatsui (reduced material, maximum impact), Theaster Gates (material honesty), David Adjaye (African modernist architecture), Kunlé Adeyemi (NLÉ - floating minimalism), Diébédo Francis Kéré (Burkinabè earth minimalism), Ini Archibong (Afro-minimal furniture)

COLOR THEORY: Restrained earth palette - terracotta, indigo, warm whites, single gold accent. Rich blacks as positive space not absence. Warm neutrals honoring African clay and earth. Every color earned.

VISUAL LANGUAGE:
- Abundant negative space (60%+ of composition)
- Essential forms from African geometry
- Clean lines inspired by Kente weaving grids
- Single powerful focal point
- Mud cloth patterns reduced to essence
- Precise placement, intentional breath
- Natural materials: clay, wood, raffia, brass
- Adinkra symbols in their most minimal form
- Breathing room as respect

TRANSFORMATION APPROACH: Reduce the subject to its essence through an African design lens. Strip away everything but what matters. Use earth tones and warm neutrals. Let negative space speak as loudly as presence. Achieve impact through restraint - the power is in what you choose to keep.`,
  },
  surreal: {
    id: 'surreal',
    name: 'Surreal',
    emoji: '🎭',
    description: 'Dreamlike, impossible, magical realism, ancestral',
    keywords: ['surrealism', 'dreamlike', 'magical realism', 'ancestral dreams', 'impossible', 'subconscious', 'juxtaposition', 'spirit world', 'uncanny'],
    styleGuide: `SURREALIST AESTHETIC TRANSFORMATION:

REFERENCE ARTISTS: Wangechi Mutu (Kenyan surreal collage), Toyin Ojih Odutola (impossible Nigerian landscapes), Njideka Akunyili Crosby (layered reality), Zanele Muholi (surreal self-transformation), Omar Victor Diop (reimagined history), Romuald Hazoumè (Beninese mask surrealism), Edson Chagas (Angolan found surrealism)

COLOR THEORY: Rich saturated colors grounded in African palettes - indigo, terracotta, gold, deep greens. Hyperreal clarity on impossible subjects. Dream-state colors that feel ancestrally familiar yet impossible.

VISUAL LANGUAGE:
- Objects in spirit-world contexts
- Scale distortion (giant masks in landscapes)
- Metamorphosis between human and nature/spirit
- Floating/defying gravity with ancestral grace
- Layered realities (physical world + spirit world)
- Patterns becoming portals
- Hyperrealistic rendering of magical elements
- Landscapes that hold memory
- Hidden ancestors in objects

TRANSFORMATION APPROACH: Take the subject and place it between worlds - physical and spiritual. Transform it through magical realism logic. Combine it with ancestral symbols using dream logic. Render everything with hyperreal precision - the more real it looks, the more powerful the magic. Ask "what would this look like in an ancestor's dream?"`,
  },
  y2k: {
    id: 'y2k',
    name: 'Y2K',
    emoji: '💿',
    description: 'Early 2000s, chrome, cyber, Hype Williams era',
    keywords: ['Y2K', 'chrome', 'millennium', 'cyber', 'metallic', 'holographic', 'Hype Williams', 'Missy Elliott', 'futuristic', 'Aaliyah'],
    styleGuide: `Y2K AESTHETIC TRANSFORMATION:

REFERENCE: Hype Williams music videos (fish-eye, chrome everything), Missy Elliott "The Rain" aesthetic, Aaliyah futurism, TLC "No Scrubs" chrome world, Busta Rhymes videos, early Beyoncé, Timbaland visual era, Destiny's Child millennium glamour, Lil Kim maximalism

COLOR THEORY: Chrome/silver metallics, holographic everything, electric blue, hot pink, platinum blonde, ice white, candy paint colors. Glossy reflective on dark skin. Fish-eye distorted rainbows.

VISUAL LANGUAGE:
- Chrome and metallic surfaces everywhere
- Fish-eye lens distortion (Hype Williams signature)
- Holographic/iridescent materials on melanin
- Futuristic streetwear meets high fashion
- Early CGI morphing effects
- Matching luxury outfits, coordinated crews
- Ice/diamonds/platinum drip
- Inflatable/bubble aesthetic
- White void studios, chrome floors
- Black excellence futurism

TRANSFORMATION APPROACH: Chrome-ify the subject Hype Williams style. Add fish-eye distortion, metallic sheen, holographic highlights. Think "what would this look like in a 2001 Missy Elliott video" - glossy, Black futurist excellence, dripping in chrome and confidence. The future was Black and shiny.`,
  },
  vaporwave: {
    id: 'vaporwave',
    name: 'Vapor',
    emoji: '🌴',
    description: 'Nostalgic, neon, Afro-retrofuture, tropical',
    keywords: ['vaporwave', 'aesthetic', 'Afro-retrofuture', 'neon', 'palm trees', 'Lagos nights', 'sunset', 'tropical noir', 'nostalgia'],
    styleGuide: `VAPORWAVE/AFRO-RETRO TRANSFORMATION:

REFERENCE: Lagos/Accra/Nairobi night aesthetic, Afrobeats video visuals, 80s/90s African city glamour, Fela Kuti's Shrine neon, Congolese sapeur elegance, South African kwaito era, Caribbean dancehall video colors, Nollywood VHS era

COLOR THEORY: Neon pink, electric cyan, sunset orange gradients, purple twilight, but grounded in tropical warmth. Palm tree greens, ocean blues, golden hour amber on dark skin. Humid, glowing night colors.

VISUAL LANGUAGE:
- Tropical city grids extending to horizon
- Palm trees against African sunset
- Neon signs in Yoruba, Swahili, French
- Vintage African textiles meet chrome
- Old Nokia/Blackberry aesthetic
- Sunset gradients (mango-hibiscus-twilight)
- VHS texture from dubbed tapes
- Classic African cars, Mercedes, Peugeot 504
- Night market glow, generator-powered lights

TRANSFORMATION APPROACH: Bathe the subject in tropical neon light - Lagos pink, Nairobi cyan. Place it against an African urban sunset. Add vintage tech elements with local flavor. Make it feel like a nostalgic dream of African city nights - beautiful, warm, eternally golden hour in Accra 1989.`,
  },
  brutalist: {
    id: 'brutalist',
    name: 'Brutal',
    emoji: '🏗️',
    description: 'Raw, concrete, stark, African modernism, monolithic',
    keywords: ['brutalist', 'concrete', 'monolithic', 'raw', 'African modernism', 'independence era', 'geometric', 'massive', 'stark'],
    styleGuide: `BRUTALIST AESTHETIC TRANSFORMATION:

REFERENCE ARCHITECTS/BUILDINGS: Great Mosque of Djenné (mud brutalism), KNUST Kumasi Ghana, Theatre National Algiers, Ponte Tower Johannesburg, Independence-era African government buildings, Egyptian brutalism, Ethiopian monument architecture, Asmara Eritrea modernism, David Adjaye's work

COLOR THEORY: Raw concrete gray, sun-bleached earth tones, terracotta accents. Harsh African sun casting geometric shadows. Oxidized copper, rusted steel. Dusty atmosphere. Colors weathered by equatorial elements.

VISUAL LANGUAGE:
- Massive concrete forms, African béton brut
- Geometric patterns from traditional textiles in architecture
- Monolithic scale echoing ancient structures (Great Zimbabwe energy)
- Harsh shadows from equatorial sun
- Independence-era optimism in concrete
- Weathered by tropical rain and sun
- Bold sans-serif in local languages
- Integration with red earth and vegetation
- Post-colonial monumentalism

TRANSFORMATION APPROACH: Monumentalize the subject in the tradition of African independence-era architecture. Surround it with raw concrete masses that speak to nation-building dreams. Use harsh geometric forms that cast dramatic shadows in equatorial light. Let the weight and permanence speak to African futures built in concrete.`,
  },
};

// Theme IDs for iteration
export const THEME_REMIX_IDS: Exclude<ThemeRemixId, null>[] = [
  'freaq',
  'egun',
  'alien',
  'bk2dvd',
  'wahala',
  'minimal',
  'surreal',
  'y2k',
  'vaporwave',
  'brutalist',
];
