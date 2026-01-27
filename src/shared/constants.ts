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
  defaultMode: 'polish',
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
  polish: {
    label: 'Polish',
    description: 'Refine clarity, quality, and structure',
  },
  expand: {
    label: 'Expand',
    description: 'Add richness, detail, atmosphere',
  },
  mutate: {
    label: 'Mutate',
    description: 'Experimental techniques, break rules',
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

REFERENCE AESTHETIC (ROTATE RANDOMLY - PICK 2-3):
- Nigerian Twitter chaos: "Your fave could never", "We move", "No wahala"
- Ghanaian meme energy: Shatta Wale drama stills, "Charley!", "Ah well"
- Kenyan internet: KOT (Kenyans On Twitter) energy, "Siwezi", Gen Z Sheng chaos
- South African chaos: "Eish!", amapiano reaction culture, "Yho!", taxi culture memes
- Tanzanian Bongo energy: Diamond Platnumz drama, "Bongo Flava!" excess
- Ugandan chaos: "Banange!", Eddy Kenzo meme formats
- Caribbean-African crossover: "Real talk", "Bruh", shared diaspora chaos
- African TikTok: duet chains, reaction stitches, sound remix culture
- WhatsApp forward hell: "Good morning" image macros evolved into chaos
- African parent energy: "When I was your age", the slipper threat aesthetic

COLOR THEORY (VARY THESE):
- Deep fried orange/red tint (WhatsApp hell)
- Oversaturated Lagos purple nights
- Accra golden hour gone wrong
- Nairobi dust filter chaos
- Johannesburg neon excess
- Eye-bleeding contrast cranked past 11
- JPEG artifacts as intentional texture
- Phone camera auto-exposure disasters

VISUAL LANGUAGE (MIX AND VARY):
- Deep fried/nuked image quality
- "Nollywood VFX budget" energy (no repeating)
- Mixed African emoji reactions: 💀😭🤣😤🙆‍♂️
- WhatsApp status compression
- Screen-recorded-then-screenshot quality
- "I go explain" caption energy
- "Na so e be" resignation aesthetic
- "Omo!" reaction freeze frames
- African wedding excess
- Owambe party chaos
- "African parents" cold stare
- Market seller negotiation energy
- Generator-powered glow
- The "e don happen" moment
- "Abeg make we dey go" tired uncle vibes
- Ankara clash color accidents
- Lagos traffic freeze frame
- "Who send you message" paranoia
- "Did you eat?" wholesome chaos
- Jollof rice discourse intensity

TRANSFORMATION APPROACH: Channel the specific chaos of African internet culture - but VARY IT each time. Draw from Nigerian, Ghanaian, Kenyan, South African, or diaspora meme cultures randomly. Use different slang each time: "Wahala", "Eish", "Charley", "Siwezi", "Banange". The energy should feel like 3am on African Twitter/WhatsApp - absurdist, chaotic, deeply funny to those who know. Never repeat the same references.`,
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
  cursed: {
    id: 'cursed',
    name: 'Cursed',
    emoji: '☠️',
    description: 'Nightmare fuel, uncanny valley, deliberately wrong',
    keywords: ['cursed image', 'nightmare fuel', 'uncanny valley', 'wrong', 'unsettling', 'liminal', 'backrooms', 'fever dream'],
    styleGuide: `CURSED AESTHETIC TRANSFORMATION:

REFERENCE: Cursed image meme culture, liminal space photography, AI hallucination aesthetics, model collapse outputs, deliberately wrong imagery

COLOR THEORY: Oversaturated or completely desaturated, sickly yellows and greens, harsh flash photography whites, compression artifact colors

VISUAL LANGUAGE:
- Flash photography in wrong contexts
- Uncanny valley faces and proportions
- Liminal spaces (empty malls, backrooms)
- Objects in wrong places/scales
- Almost-correct anatomy
- JPEG compression as aesthetic
- Model collapse convergence patterns
- "Something is wrong" atmosphere

TRANSFORMATION APPROACH: Make it feel inexplicably wrong. Add elements that shouldn't be there. Place subjects in liminal spaces. Use flash photography aesthetic. Create uncanny valley proportions. The viewer should feel uncomfortable without knowing exactly why.`,
  },
  void: {
    id: 'void',
    name: 'Void',
    emoji: '🕳️',
    description: 'Model collapse aesthetic, convergence, entropy',
    keywords: ['void', 'entropy', 'collapse', 'convergence', 'degradation', 'recursive', 'feedback loop', 'Habsburg AI'],
    styleGuide: `VOID/COLLAPSE AESTHETIC TRANSFORMATION:

REFERENCE: AI model collapse research, recursive generation deterioration, "Habsburg AI" outputs, training data entropy, visual elevator music

COLOR THEORY: Muddy convergence colors, loss of saturation through iterations, gray-brown homogenization, occasional artifact spikes of wrong colors

VISUAL LANGUAGE:
- Recursive generation artifacts
- Features blurring into sameness
- Loss of fine detail and edge cases
- Homogenized textures
- The "trained on its own output" look
- Minority features disappearing
- Generic convergence patterns
- Entropy visualization

TRANSFORMATION APPROACH: Make it look like the 30th generation of AI training on itself. Remove edge cases and unique features. Blur distinct elements toward generic forms. Add the aesthetic of information decay and model collapse.`,
  },
  signal: {
    id: 'signal',
    name: 'Signal',
    emoji: '📡',
    description: 'Glitch, datamosh, transmission decay, VHS',
    keywords: ['glitch', 'datamosh', 'VHS', 'signal decay', 'transmission error', 'static', 'scan lines', 'compression'],
    styleGuide: `SIGNAL/GLITCH AESTHETIC TRANSFORMATION:

REFERENCE: Rosa Menkman glitch art, Phillip Stearns textile glitches, datamosh video art, VHS decay, broadcast transmission errors, compression artifacts as art

COLOR THEORY: RGB channel separation, chromatic aberration, posterized gradients from compression, neon glitch colors against black, scan line interference patterns

VISUAL LANGUAGE:
- Pixel sorting and data moshing
- VHS tracking errors and scan lines
- Compression macro blocks
- RGB channel displacement
- Signal static and noise
- Transmission interference patterns
- Broken data stream aesthetics
- Frame buffer corruption

TRANSFORMATION APPROACH: Corrupt the signal. Add data transmission errors, VHS tracking problems, compression artifacts. Treat the image as data that's been damaged in transit. The beauty is in the breakdown of the signal.`,
  },
};

// Core Theme IDs - African aesthetics + error/experimental
export const CORE_THEME_IDS: Exclude<ThemeRemixId, null>[] = [
  'freaq',    // Afro-digital glitch
  'egun',     // Ancestral darkness
  'alien',    // Afrofuturism
  'bk2dvd',   // Black cinema
  'wahala',   // African internet chaos
  'minimal',  // African minimalism
  'signal',   // Glitch/transmission
];

// Extended themes (shown on expand)
export const EXTENDED_THEME_IDS: Exclude<ThemeRemixId, null>[] = [
  'surreal',
  'y2k',
  'vaporwave',
  'brutalist',
  'cursed',
  'void',
];

// All themes for iteration
export const THEME_REMIX_IDS: Exclude<ThemeRemixId, null>[] = [
  ...CORE_THEME_IDS,
  ...EXTENDED_THEME_IDS,
];

// =====================================================
// TEXTURE EFFECTS - Second layer for photo manipulation
// =====================================================

export interface TextureEffect {
  id: string;
  name: string;
  emoji: string;
  description: string;
  keywords: string[];
  promptModifier: string; // What to add to the prompt
}

export const TEXTURE_EFFECTS: TextureEffect[] = [
  {
    id: 'burnt',
    name: 'Burnt',
    emoji: '🔥',
    description: 'Burnt edges, scorched marks, fire damage aesthetic',
    keywords: ['burnt edges', 'scorched', 'charred', 'fire damaged', 'singed corners'],
    promptModifier: 'with burnt edges and scorch marks, charred paper aesthetic, fire-damaged photograph, singed corners fading to black',
  },
  {
    id: 'melted',
    name: 'Melted',
    emoji: '🫠',
    description: 'Melting photo, heat distortion, warped emulsion',
    keywords: ['melted photograph', 'heat distortion', 'warped emulsion', 'drooping', 'liquified'],
    promptModifier: 'with melting photograph effect, heat-warped emulsion, drooping and liquified elements, as if left in the sun too long',
  },
  {
    id: 'glitched-edges',
    name: 'Glitch Edge',
    emoji: '📺',
    description: 'Glitched borders, corrupted frame edges',
    keywords: ['glitched edges', 'corrupted borders', 'pixel decay at edges', 'frame corruption'],
    promptModifier: 'with glitched and corrupted edges, pixel decay around the borders, frame buffer corruption at margins, digital rot at the edges',
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    emoji: '🔮',
    description: 'Kaleidoscopic fragmentation, prismatic analog',
    keywords: ['kaleidoscope', 'prismatic', 'fragmented reflections', 'mirrored segments', 'analog kaleidoscope'],
    promptModifier: 'with kaleidoscopic fragmentation, prismatic analog effect, mirrored and repeated segments, through a kaleidoscope lens',
  },
  {
    id: 'water-damaged',
    name: 'Water Damage',
    emoji: '💧',
    description: 'Water stains, moisture warping, flood damage',
    keywords: ['water damaged', 'moisture warping', 'water stains', 'flood damaged photograph', 'rippled'],
    promptModifier: 'with water damage effects, moisture warping and water stains, rippled paper texture, flood-damaged photograph aesthetic',
  },
  {
    id: 'torn',
    name: 'Torn',
    emoji: '📄',
    description: 'Ripped edges, torn paper, collage fragments',
    keywords: ['torn edges', 'ripped paper', 'collage fragments', 'jagged tears', 'peeling layers'],
    promptModifier: 'with torn and ripped edges, jagged paper tears, collage fragment aesthetic, peeling layers revealing underneath',
  },
  {
    id: 'double-exposure',
    name: 'Double Exp',
    emoji: '👥',
    description: 'Double exposure, overlaid images, film accident',
    keywords: ['double exposure', 'overlaid images', 'film accident', 'ghosted layers', 'superimposed'],
    promptModifier: 'with double exposure effect, overlaid and superimposed imagery, ghosted layers, accidental film double exposure aesthetic',
  },
  {
    id: 'light-leak',
    name: 'Light Leak',
    emoji: '☀️',
    description: 'Light leaks, film fogging, accidental exposure',
    keywords: ['light leak', 'film fogging', 'accidental exposure', 'orange light bleed', 'lens flare'],
    promptModifier: 'with light leak effects, film fogging and accidental exposure, warm orange and red light bleeding through, damaged film aesthetic',
  },
  {
    id: 'scratched',
    name: 'Scratched',
    emoji: '✖️',
    description: 'Scratched film, surface damage, wear marks',
    keywords: ['scratched film', 'surface damage', 'wear marks', 'aged scratches', 'vinyl record scratches'],
    promptModifier: 'with scratched and worn surface, deep scratch marks across the image, aged film damage, physical media deterioration',
  },
  {
    id: 'noise-grain',
    name: 'Heavy Grain',
    emoji: '📷',
    description: 'Extreme film grain, high ISO noise, analog texture',
    keywords: ['extreme grain', 'high ISO', 'analog noise', 'pushed film', 'grainy texture'],
    promptModifier: 'with extreme film grain, high ISO noise texture, pushed film aesthetic, heavy analog grain throughout',
  },
  {
    id: 'solarized',
    name: 'Solarized',
    emoji: '🌗',
    description: 'Solarization effect, inverted midtones, Sabattier',
    keywords: ['solarized', 'Sabattier effect', 'inverted midtones', 'tone reversal', 'psychedelic exposure'],
    promptModifier: 'with solarization effect, Sabattier technique, inverted midtones and tone reversals, darkroom accident aesthetic',
  },
  {
    id: 'xerox',
    name: 'Xerox',
    emoji: '🖨️',
    description: 'Photocopy degradation, xerox generations, toner texture',
    keywords: ['xerox', 'photocopy', 'toner texture', 'copy of a copy', 'degraded reproduction'],
    promptModifier: 'with xerox photocopy aesthetic, toner texture and high contrast, copy-of-a-copy degradation, photocopier generations effect',
  },
];

// =====================================================
// CHAOS EFFECTS DATABASE
// Research compiled from Discord/Reddit communities
// Used by chaos intensity slider to add weird/experimental effects
// =====================================================

export interface ChaosEffect {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  parameters?: Record<string, string | number>;  // Platform-specific params like --weird 500
  multiPromptModifier?: string;  // For :: syntax effects
  negativePrompt?: string;  // Things to avoid for cleaner weird
  platforms: Platform[];  // Which platforms support this
  intensityRange: [number, number];  // Min-max chaos intensity this applies to (0-100)
}

export interface ChaosCategory {
  id: string;
  name: string;
  description: string;
  effects: ChaosEffect[];
}

// Chaos effects organized by category
export const CHAOS_CATEGORIES: ChaosCategory[] = [
  // ==========================================
  // GLITCH & DIGITAL CORRUPTION
  // ==========================================
  {
    id: 'glitch',
    name: 'Glitch & Corruption',
    description: 'Digital artifacts, data corruption, pixel manipulation',
    effects: [
      {
        id: 'glitch-art',
        name: 'Glitch Art',
        description: 'Digital glitches and visual errors as aesthetic',
        keywords: ['glitch art', 'data corruption', 'pixel sorting', 'chromatic aberration', 'scan lines', 'VHS glitch'],
        parameters: { weird: 500, stylize: 250 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [30, 70],
      },
      {
        id: 'datamosh',
        name: 'Datamosh',
        description: 'Video compression artifacts, macro blocks, smearing',
        keywords: ['datamosh', 'compression artifacts', 'macro blocks', 'pixel smear', 'digital decay', 'corrupted video'],
        parameters: { weird: 750 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo'],
        intensityRange: [50, 85],
      },
      {
        id: 'deep-fried',
        name: 'Deep Fried',
        description: 'Over-processed, JPEG artifacts, extreme saturation',
        keywords: ['deep fried', 'jpeg artifacts', 'oversaturated', 'nuked', 'crusty', 'low quality aesthetic'],
        parameters: { weird: 1000, chaos: 50 },
        platforms: ['midjourney', 'stable-diffusion', 'dalle'],
        intensityRange: [60, 100],
      },
      {
        id: 'signal-noise',
        name: 'Signal Noise',
        description: 'Static, interference patterns, broadcast errors',
        keywords: ['static noise', 'TV static', 'signal interference', 'broadcast glitch', 'analog noise', 'white noise'],
        parameters: { weird: 400 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo'],
        intensityRange: [20, 60],
      },
    ],
  },

  // ==========================================
  // SURREAL & DREAMLIKE
  // ==========================================
  {
    id: 'surreal',
    name: 'Surreal & Dreamlike',
    description: 'Dream logic, impossible physics, unconscious imagery',
    effects: [
      {
        id: 'double-exposure',
        name: 'Double Exposure',
        description: 'Layered imagery, silhouette fills, merged subjects',
        keywords: ['double exposure', 'multiple exposure', 'silhouette overlay', 'layered imagery', 'transparent overlay'],
        parameters: { stylize: 500 },
        multiPromptModifier: '::0.7',  // Blend ratio
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [15, 50],
      },
      {
        id: 'liminal-space',
        name: 'Liminal Space',
        description: 'Uncanny empty spaces, transitional areas, backrooms',
        keywords: ['liminal space', 'backrooms', 'empty mall', 'abandoned', 'uncanny valley', 'transitional space', 'poolrooms'],
        parameters: { weird: 600, stylize: 300 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [35, 75],
      },
      {
        id: 'fever-dream',
        name: 'Fever Dream',
        description: 'Delirious imagery, impossible logic, nightmare fuel',
        keywords: ['fever dream', 'nightmare fuel', 'delirious', 'hallucinatory', 'surreal nightmare', 'dream logic'],
        parameters: { weird: 1500, chaos: 75 },
        platforms: ['midjourney', 'stable-diffusion'],
        intensityRange: [65, 100],
      },
      {
        id: 'impossible-geometry',
        name: 'Impossible Geometry',
        description: 'Escher-like, non-Euclidean, paradoxical spaces',
        keywords: ['impossible geometry', 'non-euclidean', 'Escher', 'paradox', 'infinite loop', 'recursive', 'tesseract'],
        parameters: { weird: 800, stylize: 400 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo'],
        intensityRange: [45, 85],
      },
    ],
  },

  // ==========================================
  // HORROR & UNSETTLING
  // ==========================================
  {
    id: 'horror',
    name: 'Horror & Unsettling',
    description: 'Creepy, cosmic horror, body horror, uncanny',
    effects: [
      {
        id: 'cosmic-horror',
        name: 'Cosmic Horror',
        description: 'Lovecraftian, eldritch, incomprehensible entities',
        keywords: ['cosmic horror', 'Lovecraftian', 'eldritch', 'Cthulhu', 'tentacles', 'incomprehensible', 'existential dread', 'void'],
        parameters: { weird: 1200, stylize: 500 },
        negativePrompt: 'cute, friendly, cartoonish',
        platforms: ['midjourney', 'stable-diffusion', 'leonardo'],
        intensityRange: [55, 95],
      },
      {
        id: 'body-horror',
        name: 'Body Horror',
        description: 'Anatomical distortion, mutation, flesh manipulation',
        keywords: ['body horror', 'mutation', 'distorted anatomy', 'flesh', 'biomechanical', 'Cronenberg', 'grotesque'],
        parameters: { weird: 1000, chaos: 60 },
        negativePrompt: 'normal anatomy, clean, pristine',
        platforms: ['midjourney', 'stable-diffusion'],
        intensityRange: [60, 100],
      },
      {
        id: 'uncanny-faces',
        name: 'Uncanny Faces',
        description: 'Almost-human faces, wrong proportions, unsettling',
        keywords: ['uncanny valley', 'wrong face', 'distorted features', 'too many eyes', 'melting face', 'merged faces'],
        parameters: { weird: 700 },
        platforms: ['midjourney', 'stable-diffusion', 'dalle'],
        intensityRange: [40, 80],
      },
      {
        id: 'cursed-image',
        name: 'Cursed Image',
        description: 'Inexplicably wrong, uncomfortable, meme horror',
        keywords: ['cursed image', 'cursed photo', 'blursed', 'uncomfortable', 'something wrong', 'ominous'],
        parameters: { weird: 900, chaos: 50 },
        platforms: ['midjourney', 'stable-diffusion', 'dalle'],
        intensityRange: [50, 90],
      },
    ],
  },

  // ==========================================
  // VISUAL EFFECTS & TECHNIQUES
  // ==========================================
  {
    id: 'effects',
    name: 'Visual Effects',
    description: 'Specific visual techniques and camera effects',
    effects: [
      {
        id: 'broken-glass',
        name: 'Broken Glass',
        description: 'Shattered glass overlay, fragmented reflections',
        keywords: ['broken glass', 'shattered', 'glass shards', 'fractured', 'cracked glass', 'glass explosion'],
        parameters: { stylize: 400 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [25, 60],
      },
      {
        id: 'motion-blur',
        name: 'Extreme Motion',
        description: 'Speed blur, motion trails, kinetic energy',
        keywords: ['motion blur', 'speed lines', 'motion trails', 'kinetic', 'blur streaks', 'fast movement'],
        parameters: { weird: 300 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [20, 55],
      },
      {
        id: 'kaleidoscope',
        name: 'Kaleidoscope',
        description: 'Symmetrical reflections, mandala patterns',
        keywords: ['kaleidoscope', 'mandala', 'symmetrical', 'mirrored', 'radial symmetry', 'fractal pattern'],
        parameters: { weird: 500, stylize: 600 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo'],
        intensityRange: [30, 70],
      },
      {
        id: 'tilt-shift',
        name: 'Miniature/Macro',
        description: 'Tilt-shift, miniature effect, extreme macro',
        keywords: ['tilt shift', 'miniature', 'diorama', 'macro photography', 'tiny world', 'selective focus'],
        parameters: { stylize: 350 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [10, 40],
      },
    ],
  },

  // ==========================================
  // STYLE MUTATIONS
  // ==========================================
  {
    id: 'mutations',
    name: 'Style Mutations',
    description: 'Unexpected style combinations and transformations',
    effects: [
      {
        id: 'style-bleed',
        name: 'Style Bleed',
        description: 'Multiple conflicting art styles merging',
        keywords: ['mixed media', 'style clash', 'art collision', 'genre mashup', 'aesthetic conflict'],
        parameters: { weird: 600, chaos: 70 },
        multiPromptModifier: '::1.3',
        platforms: ['midjourney', 'stable-diffusion'],
        intensityRange: [40, 80],
      },
      {
        id: 'time-warp',
        name: 'Time Warp',
        description: 'Anachronistic elements, time periods colliding',
        keywords: ['anachronistic', 'time warp', 'past meets future', 'retro-futurism', 'temporal collision'],
        parameters: { weird: 500, stylize: 450 },
        platforms: ['midjourney', 'stable-diffusion', 'leonardo', 'dalle'],
        intensityRange: [35, 75],
      },
      {
        id: 'anti-aesthetic',
        name: 'Anti-Aesthetic',
        description: 'Deliberately ugly, anti-art, brutalist visuals',
        keywords: ['anti-aesthetic', 'deliberately ugly', 'brutal', 'raw', 'unrefined', 'harsh', 'anti-art'],
        parameters: { weird: 1500, stylize: 0 },
        platforms: ['midjourney', 'stable-diffusion'],
        intensityRange: [70, 100],
      },
      {
        id: 'niji-chaos',
        name: 'Anime Chaos',
        description: 'Surreal anime, experimental Japanese aesthetics',
        keywords: ['surreal anime', 'experimental manga', 'psychedelic anime', 'abstract anime', 'deconstructed anime'],
        parameters: { weird: 800 },
        platforms: ['midjourney'],  // Niji mode specific
        intensityRange: [45, 85],
      },
    ],
  },
];

// ==========================================
// MIDJOURNEY-SPECIFIC PARAMETERS BY CHAOS LEVEL
// ==========================================
export const MIDJOURNEY_CHAOS_PARAMS: Record<string, { weird: number; chaos: number; stylize: number }> = {
  // Level names match UI labels
  clean: { weird: 0, chaos: 0, stylize: 100 },       // 0-10%
  subtle: { weird: 100, chaos: 10, stylize: 150 },   // 10-25%
  mild: { weird: 250, chaos: 25, stylize: 200 },     // 25-40%
  moderate: { weird: 500, chaos: 40, stylize: 300 }, // 40-55%
  spicy: { weird: 750, chaos: 60, stylize: 400 },    // 55-70%
  wild: { weird: 1000, chaos: 75, stylize: 500 },    // 70-85%
  unhinged: { weird: 1500, chaos: 90, stylize: 750 },// 85-95%
  maximum: { weird: 3000, chaos: 100, stylize: 1000 },// 95-100%
};

// ==========================================
// WEIRD TRIGGER KEYWORDS BY INTENSITY
// These get randomly injected based on chaos slider
// ==========================================
export const CHAOS_KEYWORDS: Record<string, string[]> = {
  // Low chaos (10-30%): Subtle artistic touches
  low: [
    'ethereal', 'dreamlike', 'soft focus', 'hazy', 'atmospheric',
    'mysterious', 'moody lighting', 'dramatic shadows', 'cinematic',
    'painterly', 'impressionistic', 'soft glow', 'luminous',
  ],

  // Medium chaos (30-60%): Noticeable experimental elements
  medium: [
    'surreal', 'double exposure', 'kaleidoscopic', 'fragmented',
    'distorted perspective', 'impossible architecture', 'floating elements',
    'melting', 'morphing', 'twisted', 'warped reality', 'optical illusion',
    'mirrored', 'inverted colors', 'chromatic aberration', 'lens distortion',
  ],

  // High chaos (60-85%): Strong experimental/weird effects
  high: [
    'glitch art', 'data corruption', 'pixel sorting', 'scan lines',
    'liminal space', 'uncanny valley', 'cosmic horror', 'eldritch',
    'bio-mechanical', 'flesh machinery', 'recursive nightmare',
    'non-euclidean', 'fever dream', 'hallucination', 'psychedelic breakdown',
    'datamosh', 'visual static', 'signal decay',
  ],

  // Maximum chaos (85-100%): Full experimental mode
  extreme: [
    'cursed image', 'nightmare fuel', 'reality collapse', 'dimensional rift',
    'anti-aesthetic', 'deliberately broken', 'wrong in every way',
    'incomprehensible', 'existential dread visualization', 'void entity',
    'impossible biology', 'physics violation', 'perception error',
    'memory corruption', 'dream within dream', 'ego death aesthetic',
    'deep fried reality', 'jpeg hell', 'compression nightmare',
  ],
};

// ==========================================
// MULTI-PROMPT CHAOS TECHNIQUES
// Uses :: syntax for Midjourney
// ==========================================
export const CHAOS_MULTIPROMPT_TECHNIQUES = [
  {
    name: 'Concept Collision',
    description: 'Force unrelated concepts together',
    template: '{subject}::1.5 {random_concept}::0.5',
    intensityRange: [40, 70] as [number, number],
  },
  {
    name: 'Style War',
    description: 'Conflicting artistic styles',
    template: '{subject}::1 {style_a}::0.8 {style_b}::-0.3',
    intensityRange: [50, 80] as [number, number],
  },
  {
    name: 'Negative Amplification',
    description: 'Use negative weights creatively',
    template: '{subject}::2 normal::-1 expected::-0.5',
    intensityRange: [60, 90] as [number, number],
  },
  {
    name: 'Reality Blend',
    description: 'Mix real and impossible',
    template: '{subject}::1.2 photorealistic::0.5 impossible physics::0.8',
    intensityRange: [45, 75] as [number, number],
  },
];

// ==========================================
// ARTIST REFERENCES FOR WEIRD/EXPERIMENTAL
// ==========================================
export const CHAOS_ARTIST_REFERENCES = {
  glitch: ['Rosa Menkman', 'Phillip Stearns', 'Sabato Visconti', 'Daniel Temkin'],
  surreal: ['Salvador Dali', 'Rene Magritte', 'Zdzislaw Beksinski', 'HR Giger'],
  horror: ['Junji Ito', 'Kentaro Miura', 'Francis Bacon', 'Wayne Barlowe'],
  psychedelic: ['Alex Grey', 'Android Jones', 'Robert Venosa', 'Mati Klarwein'],
  experimental: ['Yayoi Kusama', 'Anish Kapoor', 'James Turrell', 'Olafur Eliasson'],
};
