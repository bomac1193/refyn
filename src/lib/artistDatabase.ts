/**
 * Artist Database - Comprehensive collection of artists for prompt diversity
 *
 * Focus on post-colonial African, Black diaspora, Latine, PoC, and decanonized artists
 * to encourage discovery beyond the Western canon.
 */

export interface Artist {
  name: string;
  origin: string; // Country/region
  medium: string[]; // painting, photography, sculpture, digital, etc.
  style: string[]; // Abstract, figurative, surreal, etc.
  themes: string[]; // Identity, diaspora, spirituality, etc.
  era: string; // Contemporary, Modern, etc.
}

export type ArtistCategory =
  | 'african_contemporary'      // Contemporary African artists
  | 'african_postcolonial'      // Post-colonial African artists
  | 'black_diaspora_americas'   // Black diaspora - Americas
  | 'black_diaspora_uk_europe'  // Black diaspora - UK/Europe
  | 'black_diaspora_caribbean'  // Black diaspora - Caribbean
  | 'latine'                    // Latin American and Latine artists
  | 'asian_pacific'             // Asian and Pacific artists
  | 'mena'                      // Middle Eastern and North African
  | 'indigenous'                // Indigenous artists globally
  | 'decanonized'               // Lesser-known/non-Western canon
  | 'afrofuturist'              // Afrofuturist artists
  | 'digital_poc';              // Digital/new media PoC artists

// =====================================================
// AFRICAN CONTEMPORARY & POST-COLONIAL ARTISTS
// =====================================================
export const AFRICAN_CONTEMPORARY: Artist[] = [
  // Nigerian Artists
  { name: 'Njideka Akunyili Crosby', origin: 'Nigeria/USA', medium: ['painting', 'collage'], style: ['figurative', 'layered'], themes: ['diaspora', 'identity', 'domestic'], era: 'Contemporary' },
  { name: 'Toyin Ojih Odutola', origin: 'Nigeria/USA', medium: ['drawing', 'pastel'], style: ['figurative', 'narrative'], themes: ['identity', 'mythology', 'skin'], era: 'Contemporary' },
  { name: 'Yinka Shonibare', origin: 'Nigeria/UK', medium: ['sculpture', 'installation'], style: ['conceptual', 'theatrical'], themes: ['colonialism', 'identity', 'fabric'], era: 'Contemporary' },
  { name: 'Emeka Ogboh', origin: 'Nigeria', medium: ['sound', 'installation'], style: ['conceptual', 'immersive'], themes: ['urban', 'migration', 'memory'], era: 'Contemporary' },
  { name: 'Peju Alatise', origin: 'Nigeria', medium: ['sculpture', 'painting'], style: ['figurative', 'symbolic'], themes: ['women', 'mythology', 'society'], era: 'Contemporary' },
  { name: 'Victor Ehikhamenor', origin: 'Nigeria', medium: ['painting', 'installation'], style: ['pattern', 'symbolic'], themes: ['spirituality', 'identity', 'history'], era: 'Contemporary' },
  { name: 'Ndidi Emefiele', origin: 'Nigeria', medium: ['painting'], style: ['figurative', 'expressive'], themes: ['women', 'identity', 'beauty'], era: 'Contemporary' },
  { name: 'Nnenna Okore', origin: 'Nigeria/USA', medium: ['sculpture', 'installation'], style: ['organic', 'textural'], themes: ['environment', 'transformation', 'material'], era: 'Contemporary' },

  // Kenyan Artists
  { name: 'Wangechi Mutu', origin: 'Kenya/USA', medium: ['collage', 'sculpture'], style: ['surreal', 'hybrid'], themes: ['body', 'feminism', 'afrofuturism'], era: 'Contemporary' },
  { name: 'Michael Armitage', origin: 'Kenya/UK', medium: ['painting'], style: ['figurative', 'layered'], themes: ['politics', 'mythology', 'landscape'], era: 'Contemporary' },
  { name: 'Cyrus Kabiru', origin: 'Kenya', medium: ['sculpture', 'found objects'], style: ['afrofuturist', 'assemblage'], themes: ['recycling', 'vision', 'futurism'], era: 'Contemporary' },
  { name: 'Peterson Kamwathi', origin: 'Kenya', medium: ['drawing', 'printmaking'], style: ['figurative', 'political'], themes: ['history', 'memory', 'identity'], era: 'Contemporary' },

  // South African Artists
  { name: 'William Kentridge', origin: 'South Africa', medium: ['animation', 'drawing'], style: ['expressionist', 'narrative'], themes: ['apartheid', 'memory', 'time'], era: 'Contemporary' },
  { name: 'Zanele Muholi', origin: 'South Africa', medium: ['photography'], style: ['portrait', 'documentary'], themes: ['LGBTQ', 'identity', 'visibility'], era: 'Contemporary' },
  { name: 'Mary Sibande', origin: 'South Africa', medium: ['sculpture', 'photography'], style: ['figurative', 'theatrical'], themes: ['domestic', 'fantasy', 'history'], era: 'Contemporary' },
  { name: 'Mohau Modisakeng', origin: 'South Africa', medium: ['photography', 'video'], style: ['surreal', 'symbolic'], themes: ['history', 'trauma', 'healing'], era: 'Contemporary' },
  { name: 'Billie Zangewa', origin: 'South Africa/Malawi', medium: ['textile', 'collage'], style: ['figurative', 'intimate'], themes: ['domestic', 'motherhood', 'self'], era: 'Contemporary' },
  { name: 'Nicholas Hlobo', origin: 'South Africa', medium: ['sculpture', 'installation'], style: ['organic', 'textural'], themes: ['identity', 'Xhosa culture', 'sexuality'], era: 'Contemporary' },
  { name: 'Marlene Dumas', origin: 'South Africa/Netherlands', medium: ['painting'], style: ['expressionist', 'figurative'], themes: ['body', 'emotion', 'politics'], era: 'Contemporary' },

  // Ghanaian Artists
  { name: 'El Anatsui', origin: 'Ghana', medium: ['sculpture', 'installation'], style: ['monumental', 'textural'], themes: ['consumption', 'transformation', 'history'], era: 'Contemporary' },
  { name: 'Ibrahim Mahama', origin: 'Ghana', medium: ['installation'], style: ['monumental', 'material'], themes: ['labor', 'trade', 'migration'], era: 'Contemporary' },
  { name: 'Serge Attukwei Clottey', origin: 'Ghana', medium: ['installation', 'performance'], style: ['assemblage', 'participatory'], themes: ['plastic', 'environment', 'community'], era: 'Contemporary' },
  { name: 'Zohra Opoku', origin: 'Ghana/Germany', medium: ['textile', 'photography'], style: ['layered', 'pattern'], themes: ['identity', 'history', 'fabric'], era: 'Contemporary' },

  // Ethiopian Artists
  { name: 'Julie Mehretu', origin: 'Ethiopia/USA', medium: ['painting', 'drawing'], style: ['abstract', 'layered'], themes: ['mapping', 'history', 'movement'], era: 'Contemporary' },
  { name: 'Elias Sime', origin: 'Ethiopia', medium: ['assemblage', 'painting'], style: ['abstract', 'textural'], themes: ['technology', 'nature', 'connection'], era: 'Contemporary' },
  { name: 'Aida Muluneh', origin: 'Ethiopia', medium: ['photography'], style: ['surreal', 'colorful'], themes: ['identity', 'womanhood', 'Africa'], era: 'Contemporary' },

  // Other African Nations
  { name: 'Kudzanai Chiurai', origin: 'Zimbabwe', medium: ['painting', 'photography'], style: ['political', 'dramatic'], themes: ['power', 'politics', 'Africa'], era: 'Contemporary' },
  { name: 'Sammy Baloji', origin: 'DRC', medium: ['photography', 'video'], style: ['documentary', 'collage'], themes: ['colonialism', 'mining', 'memory'], era: 'Contemporary' },
  { name: 'Edson Chagas', origin: 'Angola', medium: ['photography'], style: ['conceptual', 'found'], themes: ['objects', 'urban', 'identity'], era: 'Contemporary' },
  { name: 'Gonçalo Mabunda', origin: 'Mozambique', medium: ['sculpture'], style: ['assemblage'], themes: ['war', 'transformation', 'weapons'], era: 'Contemporary' },
  { name: 'Abdoulaye Konaté', origin: 'Mali', medium: ['textile', 'installation'], style: ['monumental', 'colorful'], themes: ['society', 'environment', 'tradition'], era: 'Contemporary' },
  { name: 'Romuald Hazoumè', origin: 'Benin', medium: ['sculpture', 'installation'], style: ['assemblage', 'mask'], themes: ['identity', 'trade', 'history'], era: 'Contemporary' },
  { name: 'Barthélémy Toguo', origin: 'Cameroon', medium: ['painting', 'sculpture'], style: ['expressive', 'large-scale'], themes: ['migration', 'identity', 'borders'], era: 'Contemporary' },
  { name: 'Kapwani Kiwanga', origin: 'Tanzania/Canada', medium: ['installation', 'video'], style: ['research-based', 'conceptual'], themes: ['history', 'power', 'science'], era: 'Contemporary' },
  { name: 'Hassan Hajjaj', origin: 'Morocco/UK', medium: ['photography'], style: ['pop', 'colorful'], themes: ['identity', 'fashion', 'diaspora'], era: 'Contemporary' },
  { name: 'Mounir Fatmi', origin: 'Morocco', medium: ['video', 'installation'], style: ['conceptual', 'political'], themes: ['religion', 'media', 'identity'], era: 'Contemporary' },
];

// =====================================================
// BLACK DIASPORA - AMERICAS
// =====================================================
export const BLACK_DIASPORA_AMERICAS: Artist[] = [
  // USA - Contemporary
  { name: 'Kara Walker', origin: 'USA', medium: ['silhouette', 'installation'], style: ['narrative', 'provocative'], themes: ['slavery', 'race', 'history'], era: 'Contemporary' },
  { name: 'Kerry James Marshall', origin: 'USA', medium: ['painting'], style: ['figurative', 'historical'], themes: ['Black life', 'representation', 'history'], era: 'Contemporary' },
  { name: 'Theaster Gates', origin: 'USA', medium: ['sculpture', 'installation', 'social practice'], style: ['material', 'archival'], themes: ['community', 'urban', 'archives'], era: 'Contemporary' },
  { name: 'Kehinde Wiley', origin: 'USA', medium: ['painting'], style: ['figurative', 'ornate'], themes: ['power', 'representation', 'history'], era: 'Contemporary' },
  { name: 'Amy Sherald', origin: 'USA', medium: ['painting'], style: ['figurative', 'muted'], themes: ['everyday', 'dignity', 'Black life'], era: 'Contemporary' },
  { name: 'Mark Bradford', origin: 'USA', medium: ['painting', 'collage'], style: ['abstract', 'layered'], themes: ['urban', 'maps', 'community'], era: 'Contemporary' },
  { name: 'Mickalene Thomas', origin: 'USA', medium: ['painting', 'collage'], style: ['decorative', 'bold'], themes: ['beauty', 'femininity', 'desire'], era: 'Contemporary' },
  { name: 'Rashid Johnson', origin: 'USA', medium: ['painting', 'sculpture'], style: ['mixed media', 'conceptual'], themes: ['identity', 'anxiety', 'escape'], era: 'Contemporary' },
  { name: 'Hank Willis Thomas', origin: 'USA', medium: ['photography', 'sculpture'], style: ['conceptual', 'appropriation'], themes: ['race', 'advertising', 'identity'], era: 'Contemporary' },
  { name: 'Carrie Mae Weems', origin: 'USA', medium: ['photography', 'video'], style: ['narrative', 'staged'], themes: ['family', 'history', 'representation'], era: 'Contemporary' },
  { name: 'Lorna Simpson', origin: 'USA', medium: ['photography', 'video'], style: ['conceptual', 'fragmented'], themes: ['identity', 'memory', 'gender'], era: 'Contemporary' },
  { name: 'Glenn Ligon', origin: 'USA', medium: ['painting', 'neon'], style: ['text-based', 'conceptual'], themes: ['race', 'identity', 'literature'], era: 'Contemporary' },
  { name: 'Tschabalala Self', origin: 'USA', medium: ['painting', 'collage'], style: ['figurative', 'bold'], themes: ['body', 'Black femininity', 'desire'], era: 'Contemporary' },
  { name: 'Jordan Casteel', origin: 'USA', medium: ['painting'], style: ['figurative', 'intimate'], themes: ['community', 'portraiture', 'Harlem'], era: 'Contemporary' },
  { name: 'Derrick Adams', origin: 'USA', medium: ['painting', 'collage'], style: ['fragmented', 'colorful'], themes: ['leisure', 'Black joy', 'identity'], era: 'Contemporary' },
  { name: 'Sanford Biggers', origin: 'USA', medium: ['sculpture', 'video'], style: ['hybrid', 'layered'], themes: ['history', 'quilts', 'violence'], era: 'Contemporary' },
  { name: 'Jacolby Satterwhite', origin: 'USA', medium: ['video', 'digital'], style: ['surreal', 'maximalist'], themes: ['queer', 'family', 'fantasy'], era: 'Contemporary' },
  { name: 'Sondra Perry', origin: 'USA', medium: ['video', 'digital'], style: ['digital', 'avatar'], themes: ['Blackness', 'technology', 'body'], era: 'Contemporary' },
  { name: 'Kahlil Joseph', origin: 'USA', medium: ['film', 'video'], style: ['cinematic', 'poetic'], themes: ['Black life', 'music', 'memory'], era: 'Contemporary' },
  { name: 'Arthur Jafa', origin: 'USA', medium: ['video', 'film'], style: ['rhythmic', 'archival'], themes: ['Black aesthetics', 'power', 'beauty'], era: 'Contemporary' },
  { name: 'Dawoud Bey', origin: 'USA', medium: ['photography'], style: ['portrait', 'documentary'], themes: ['community', 'history', 'youth'], era: 'Contemporary' },
  { name: 'Adam Pendleton', origin: 'USA', medium: ['painting', 'video'], style: ['text', 'abstraction'], themes: ['politics', 'language', 'Blackness'], era: 'Contemporary' },
  { name: 'Simone Leigh', origin: 'USA', medium: ['sculpture', 'ceramics'], style: ['figurative', 'monumental'], themes: ['Black women', 'labor', 'care'], era: 'Contemporary' },
  { name: 'Titus Kaphar', origin: 'USA', medium: ['painting', 'sculpture'], style: ['historical', 'intervention'], themes: ['history', 'absence', 'race'], era: 'Contemporary' },
  { name: 'Nick Cave', origin: 'USA', medium: ['sculpture', 'performance'], style: ['wearable', 'fantastical'], themes: ['identity', 'ritual', 'protection'], era: 'Contemporary' },
  { name: 'Bisa Butler', origin: 'USA', medium: ['quilting', 'textile'], style: ['portrait', 'vibrant'], themes: ['ancestors', 'celebration', 'memory'], era: 'Contemporary' },
  { name: 'Henry Taylor', origin: 'USA', medium: ['painting'], style: ['figurative', 'raw'], themes: ['everyday', 'community', 'Los Angeles'], era: 'Contemporary' },
  { name: 'Xaviera Simmons', origin: 'USA', medium: ['photography', 'performance'], style: ['conceptual', 'layered'], themes: ['landscape', 'history', 'body'], era: 'Contemporary' },
  { name: 'Huma Bhabha', origin: 'Pakistan/USA', medium: ['sculpture'], style: ['figurative', 'raw'], themes: ['war', 'displacement', 'humanity'], era: 'Contemporary' },

  // Brazil
  { name: 'Rosana Paulino', origin: 'Brazil', medium: ['textile', 'collage'], style: ['layered', 'archival'], themes: ['slavery', 'Black women', 'memory'], era: 'Contemporary' },
  { name: 'Ayrson Heráclito', origin: 'Brazil', medium: ['video', 'performance'], style: ['ritual', 'spiritual'], themes: ['Candomblé', 'African heritage', 'healing'], era: 'Contemporary' },
  { name: 'Dalton Paula', origin: 'Brazil', medium: ['painting'], style: ['figurative', 'historical'], themes: ['Afro-Brazilian', 'history', 'resistance'], era: 'Contemporary' },
  { name: 'Maxwell Alexandre', origin: 'Brazil', medium: ['painting'], style: ['large-scale', 'raw'], themes: ['favela', 'Black life', 'religion'], era: 'Contemporary' },
  { name: 'Sidney Amaral', origin: 'Brazil', medium: ['painting', 'drawing'], style: ['figurative', 'expressive'], themes: ['violence', 'Black body', 'Brazil'], era: 'Contemporary' },

  // Colombia
  { name: 'Liliana Angulo', origin: 'Colombia', medium: ['photography', 'video'], style: ['conceptual', 'performative'], themes: ['Afro-Colombian', 'identity', 'hair'], era: 'Contemporary' },
];

// =====================================================
// BLACK DIASPORA - UK/EUROPE
// =====================================================
export const BLACK_DIASPORA_UK_EUROPE: Artist[] = [
  { name: 'Chris Ofili', origin: 'UK', medium: ['painting'], style: ['layered', 'ornate'], themes: ['identity', 'spirituality', 'pop'], era: 'Contemporary' },
  { name: 'Lynette Yiadom-Boakye', origin: 'UK', medium: ['painting'], style: ['figurative', 'imagined'], themes: ['portraiture', 'timelessness', 'dignity'], era: 'Contemporary' },
  { name: 'Isaac Julien', origin: 'UK', medium: ['film', 'video'], style: ['cinematic', 'poetic'], themes: ['diaspora', 'migration', 'desire'], era: 'Contemporary' },
  { name: 'Steve McQueen', origin: 'UK', medium: ['film', 'video'], style: ['cinematic', 'intense'], themes: ['history', 'race', 'endurance'], era: 'Contemporary' },
  { name: 'John Akomfrah', origin: 'UK/Ghana', medium: ['film', 'video'], style: ['essay', 'archival'], themes: ['diaspora', 'migration', 'memory'], era: 'Contemporary' },
  { name: 'Sonia Boyce', origin: 'UK', medium: ['collage', 'installation'], style: ['collaborative', 'archival'], themes: ['music', 'women', 'community'], era: 'Contemporary' },
  { name: 'Lubaina Himid', origin: 'UK/Tanzania', medium: ['painting', 'installation'], style: ['figurative', 'theatrical'], themes: ['history', 'slavery', 'visibility'], era: 'Contemporary' },
  { name: 'Hurvin Anderson', origin: 'UK', medium: ['painting'], style: ['figurative', 'atmospheric'], themes: ['memory', 'Caribbean', 'barbershop'], era: 'Contemporary' },
  { name: 'Claudette Johnson', origin: 'UK', medium: ['drawing', 'painting'], style: ['figurative', 'powerful'], themes: ['Black women', 'presence', 'body'], era: 'Contemporary' },
  { name: 'Alberta Whittle', origin: 'UK/Barbados', medium: ['video', 'installation'], style: ['immersive', 'healing'], themes: ['sea', 'history', 'healing'], era: 'Contemporary' },
  { name: 'Larry Achiampong', origin: 'UK/Ghana', medium: ['video', 'installation'], style: ['archival', 'personal'], themes: ['identity', 'family', 'empire'], era: 'Contemporary' },
  { name: 'Grada Kilomba', origin: 'Portugal', medium: ['video', 'performance'], style: ['conceptual', 'text'], themes: ['colonialism', 'memory', 'trauma'], era: 'Contemporary' },
  { name: 'Otobong Nkanga', origin: 'Nigeria/Belgium', medium: ['installation', 'drawing'], style: ['research', 'material'], themes: ['land', 'extraction', 'healing'], era: 'Contemporary' },
];

// =====================================================
// BLACK DIASPORA - CARIBBEAN
// =====================================================
export const BLACK_DIASPORA_CARIBBEAN: Artist[] = [
  { name: 'Ebony G. Patterson', origin: 'Jamaica', medium: ['tapestry', 'installation'], style: ['ornate', 'garden'], themes: ['violence', 'beauty', 'mourning'], era: 'Contemporary' },
  { name: 'Nari Ward', origin: 'Jamaica/USA', medium: ['sculpture', 'installation'], style: ['found objects', 'monumental'], themes: ['urban', 'migration', 'transformation'], era: 'Contemporary' },
  { name: 'Leasho Johnson', origin: 'Jamaica', medium: ['painting', 'drawing'], style: ['figurative', 'layered'], themes: ['masculinity', 'sexuality', 'spirituality'], era: 'Contemporary' },
  { name: 'Tomm El-Saieh', origin: 'Haiti/USA', medium: ['painting'], style: ['abstract', 'pattern'], themes: ['Haiti', 'abstraction', 'rhythm'], era: 'Contemporary' },
  { name: 'Didier William', origin: 'Haiti/USA', medium: ['painting'], style: ['figurative', 'patterned'], themes: ['diaspora', 'surveillance', 'queerness'], era: 'Contemporary' },
  { name: 'Manuel Mathieu', origin: 'Haiti/Canada', medium: ['painting'], style: ['abstract', 'expressive'], themes: ['history', 'chaos', 'memory'], era: 'Contemporary' },
  { name: 'Firelei Báez', origin: 'Dominican Republic', medium: ['painting'], style: ['figurative', 'ornate'], themes: ['diaspora', 'mythology', 'power'], era: 'Contemporary' },
  { name: 'Scherezade García', origin: 'Dominican Republic', medium: ['painting', 'installation'], style: ['figurative', 'layered'], themes: ['migration', 'identity', 'sea'], era: 'Contemporary' },
];

// =====================================================
// LATINE ARTISTS
// =====================================================
export const LATINE_ARTISTS: Artist[] = [
  // Mexico
  { name: 'Gabriel Orozco', origin: 'Mexico', medium: ['sculpture', 'photography'], style: ['conceptual', 'found'], themes: ['everyday', 'transformation', 'nature'], era: 'Contemporary' },
  { name: 'Teresa Margolles', origin: 'Mexico', medium: ['installation', 'performance'], style: ['conceptual', 'visceral'], themes: ['death', 'violence', 'border'], era: 'Contemporary' },
  { name: 'Damián Ortega', origin: 'Mexico', medium: ['sculpture', 'installation'], style: ['deconstructed', 'playful'], themes: ['systems', 'labor', 'objects'], era: 'Contemporary' },
  { name: 'Carlos Amorales', origin: 'Mexico', medium: ['animation', 'installation'], style: ['graphic', 'silhouette'], themes: ['violence', 'language', 'transformation'], era: 'Contemporary' },
  { name: 'Minerva Cuevas', origin: 'Mexico', medium: ['installation', 'intervention'], style: ['activist', 'conceptual'], themes: ['corporate', 'resistance', 'commons'], era: 'Contemporary' },
  { name: 'Betsabeé Romero', origin: 'Mexico', medium: ['sculpture', 'installation'], style: ['pattern', 'material'], themes: ['migration', 'tradition', 'tires'], era: 'Contemporary' },
  { name: 'Pedro Reyes', origin: 'Mexico', medium: ['sculpture', 'social'], style: ['participatory', 'utopian'], themes: ['weapons', 'transformation', 'community'], era: 'Contemporary' },

  // Brazil
  { name: 'Ernesto Neto', origin: 'Brazil', medium: ['sculpture', 'installation'], style: ['biomorphic', 'immersive'], themes: ['body', 'senses', 'community'], era: 'Contemporary' },
  { name: 'Adriana Varejão', origin: 'Brazil', medium: ['painting', 'sculpture'], style: ['baroque', 'visceral'], themes: ['colonialism', 'flesh', 'history'], era: 'Contemporary' },
  { name: 'Beatriz Milhazes', origin: 'Brazil', medium: ['painting', 'collage'], style: ['decorative', 'vibrant'], themes: ['pattern', 'Brazil', 'color'], era: 'Contemporary' },
  { name: 'Vik Muniz', origin: 'Brazil', medium: ['photography'], style: ['constructed', 'material'], themes: ['waste', 'labor', 'reproduction'], era: 'Contemporary' },
  { name: 'Rivane Neuenschwander', origin: 'Brazil', medium: ['installation'], style: ['poetic', 'participatory'], themes: ['time', 'nature', 'chance'], era: 'Contemporary' },
  { name: 'Cildo Meireles', origin: 'Brazil', medium: ['installation', 'sculpture'], style: ['conceptual', 'immersive'], themes: ['politics', 'economy', 'senses'], era: 'Contemporary' },

  // Argentina
  { name: 'Tomás Saraceno', origin: 'Argentina', medium: ['installation', 'sculpture'], style: ['utopian', 'floating'], themes: ['air', 'spiders', 'environment'], era: 'Contemporary' },
  { name: 'Guillermo Kuitca', origin: 'Argentina', medium: ['painting'], style: ['cartographic', 'intimate'], themes: ['maps', 'beds', 'displacement'], era: 'Contemporary' },
  { name: 'Marta Minujín', origin: 'Argentina', medium: ['installation', 'performance'], style: ['participatory', 'monumental'], themes: ['books', 'politics', 'identity'], era: 'Contemporary' },
  { name: 'Adrián Villar Rojas', origin: 'Argentina', medium: ['sculpture', 'installation'], style: ['monumental', 'decaying'], themes: ['time', 'entropy', 'futures'], era: 'Contemporary' },

  // Colombia
  { name: 'Doris Salcedo', origin: 'Colombia', medium: ['sculpture', 'installation'], style: ['material', 'memorial'], themes: ['violence', 'absence', 'mourning'], era: 'Contemporary' },
  { name: 'Oscar Murillo', origin: 'Colombia/UK', medium: ['painting', 'installation'], style: ['gestural', 'raw'], themes: ['labor', 'migration', 'materiality'], era: 'Contemporary' },
  { name: 'María Fernanda Cardoso', origin: 'Colombia', medium: ['sculpture', 'installation'], style: ['natural', 'taxonomic'], themes: ['nature', 'death', 'transformation'], era: 'Contemporary' },

  // Cuba
  { name: 'Tania Bruguera', origin: 'Cuba', medium: ['performance', 'installation'], style: ['activist', 'political'], themes: ['power', 'migration', 'behavior'], era: 'Contemporary' },
  { name: 'Carlos Garaicoa', origin: 'Cuba', medium: ['photography', 'installation'], style: ['architectural', 'utopian'], themes: ['Havana', 'utopia', 'decay'], era: 'Contemporary' },
  { name: 'Kcho', origin: 'Cuba', medium: ['sculpture', 'installation'], style: ['found', 'nautical'], themes: ['migration', 'sea', 'rafts'], era: 'Contemporary' },
  { name: 'Alexandre Arrechea', origin: 'Cuba', medium: ['sculpture', 'installation'], style: ['monumental', 'architectural'], themes: ['power', 'architecture', 'systems'], era: 'Contemporary' },

  // Chile
  { name: 'Alfredo Jaar', origin: 'Chile', medium: ['installation', 'photography'], style: ['political', 'confrontational'], themes: ['media', 'Rwanda', 'visibility'], era: 'Contemporary' },
  { name: 'Iván Navarro', origin: 'Chile', medium: ['sculpture', 'neon'], style: ['light', 'infinite'], themes: ['politics', 'torture', 'infinity'], era: 'Contemporary' },

  // Other Latin America
  { name: 'Francis Alÿs', origin: 'Belgium/Mexico', medium: ['video', 'performance'], style: ['poetic', 'absurd'], themes: ['borders', 'labor', 'walking'], era: 'Contemporary' },
  { name: 'Ximena Garrido-Lecca', origin: 'Peru', medium: ['sculpture', 'installation'], style: ['material', 'hybrid'], themes: ['colonialism', 'extraction', 'tradition'], era: 'Contemporary' },
  { name: 'Sandra Gamarra', origin: 'Peru', medium: ['painting'], style: ['appropriation', 'museum'], themes: ['colonialism', 'representation', 'museums'], era: 'Contemporary' },
  { name: 'Miguel Angel Ríos', origin: 'Argentina', medium: ['video', 'sculpture'], style: ['kinetic', 'violent'], themes: ['violence', 'Latin America', 'toys'], era: 'Contemporary' },

  // Chicano/USA Latine
  { name: 'Judy Baca', origin: 'USA/Chicana', medium: ['mural', 'painting'], style: ['mural', 'narrative'], themes: ['community', 'history', 'LA'], era: 'Contemporary' },
  { name: 'Carmen Herrera', origin: 'Cuba/USA', medium: ['painting'], style: ['geometric', 'minimalist'], themes: ['form', 'color', 'edge'], era: 'Modern/Contemporary' },
  { name: 'Pepón Osorio', origin: 'Puerto Rico/USA', medium: ['installation'], style: ['maximalist', 'domestic'], themes: ['home', 'Puerto Rico', 'community'], era: 'Contemporary' },
  { name: 'ASCO collective', origin: 'USA/Chicano', medium: ['performance', 'photography'], style: ['guerrilla', 'punk'], themes: ['identity', 'media', 'protest'], era: 'Contemporary' },
];

// =====================================================
// ASIAN & PACIFIC ARTISTS
// =====================================================
export const ASIAN_PACIFIC_ARTISTS: Artist[] = [
  // East Asian
  { name: 'Yayoi Kusama', origin: 'Japan', medium: ['sculpture', 'installation'], style: ['polka dots', 'infinity'], themes: ['infinity', 'obsession', 'cosmos'], era: 'Contemporary' },
  { name: 'Lee Ufan', origin: 'Korea', medium: ['painting', 'sculpture'], style: ['minimalist', 'relational'], themes: ['space', 'void', 'encounter'], era: 'Contemporary' },
  { name: 'Cai Guo-Qiang', origin: 'China', medium: ['installation', 'gunpowder'], style: ['explosive', 'monumental'], themes: ['destruction', 'creation', 'cosmos'], era: 'Contemporary' },
  { name: 'Xu Bing', origin: 'China', medium: ['installation', 'print'], style: ['text', 'conceptual'], themes: ['language', 'culture', 'transformation'], era: 'Contemporary' },
  { name: 'Ai Weiwei', origin: 'China', medium: ['sculpture', 'installation'], style: ['political', 'monumental'], themes: ['human rights', 'China', 'refugees'], era: 'Contemporary' },
  { name: 'Do Ho Suh', origin: 'Korea', medium: ['sculpture', 'installation'], style: ['fabric', 'translucent'], themes: ['home', 'displacement', 'memory'], era: 'Contemporary' },
  { name: 'Haegue Yang', origin: 'Korea', medium: ['installation', 'sculpture'], style: ['sensory', 'blind'], themes: ['exile', 'senses', 'abstraction'], era: 'Contemporary' },
  { name: 'Kimsooja', origin: 'Korea', medium: ['video', 'installation'], style: ['meditative', 'bottari'], themes: ['migration', 'stillness', 'fabric'], era: 'Contemporary' },
  { name: 'Takashi Murakami', origin: 'Japan', medium: ['painting', 'sculpture'], style: ['superflat', 'pop'], themes: ['otaku', 'tradition', 'commerce'], era: 'Contemporary' },
  { name: 'Chiharu Shiota', origin: 'Japan', medium: ['installation'], style: ['thread', 'web'], themes: ['memory', 'absence', 'connection'], era: 'Contemporary' },
  { name: 'Mariko Mori', origin: 'Japan', medium: ['photography', 'video'], style: ['futuristic', 'spiritual'], themes: ['technology', 'spirituality', 'Japan'], era: 'Contemporary' },
  { name: 'Rirkrit Tiravanija', origin: 'Thailand/Argentina', medium: ['installation', 'relational'], style: ['participatory', 'food'], themes: ['community', 'exchange', 'cooking'], era: 'Contemporary' },

  // South Asian
  { name: 'Anish Kapoor', origin: 'India/UK', medium: ['sculpture'], style: ['void', 'reflective'], themes: ['void', 'body', 'scale'], era: 'Contemporary' },
  { name: 'Bharti Kher', origin: 'India', medium: ['sculpture', 'painting'], style: ['bindi', 'hybrid'], themes: ['body', 'transformation', 'mythology'], era: 'Contemporary' },
  { name: 'Subodh Gupta', origin: 'India', medium: ['sculpture', 'installation'], style: ['utensils', 'monumental'], themes: ['India', 'migration', 'daily life'], era: 'Contemporary' },
  { name: 'Shilpa Gupta', origin: 'India', medium: ['installation', 'interactive'], style: ['text', 'border'], themes: ['borders', 'surveillance', 'censorship'], era: 'Contemporary' },
  { name: 'Dayanita Singh', origin: 'India', medium: ['photography'], style: ['archive', 'sequence'], themes: ['archives', 'India', 'intimacy'], era: 'Contemporary' },
  { name: 'Nalini Malani', origin: 'India', medium: ['video', 'painting'], style: ['shadow', 'layered'], themes: ['violence', 'women', 'mythology'], era: 'Contemporary' },
  { name: 'Sheela Gowda', origin: 'India', medium: ['sculpture', 'installation'], style: ['material', 'labor'], themes: ['labor', 'gender', 'ritual'], era: 'Contemporary' },
  { name: 'Raqs Media Collective', origin: 'India', medium: ['video', 'installation'], style: ['research', 'text'], themes: ['time', 'labor', 'networks'], era: 'Contemporary' },
  { name: 'Shahzia Sikander', origin: 'Pakistan', medium: ['painting', 'animation'], style: ['miniature', 'hybrid'], themes: ['identity', 'tradition', 'colonialism'], era: 'Contemporary' },
  { name: 'Imran Qureshi', origin: 'Pakistan', medium: ['painting'], style: ['miniature', 'violence'], themes: ['violence', 'tradition', 'flowers'], era: 'Contemporary' },

  // Southeast Asian
  { name: 'Dinh Q. Lê', origin: 'Vietnam', medium: ['photography', 'weaving'], style: ['woven', 'layered'], themes: ['Vietnam War', 'memory', 'trauma'], era: 'Contemporary' },
  { name: 'Heri Dono', origin: 'Indonesia', medium: ['installation', 'painting'], style: ['wayang', 'fantastical'], themes: ['mythology', 'politics', 'tradition'], era: 'Contemporary' },
  { name: 'FX Harsono', origin: 'Indonesia', medium: ['performance', 'installation'], style: ['political', 'identity'], themes: ['Chinese-Indonesian', 'identity', 'history'], era: 'Contemporary' },
  { name: 'Arahmaiani', origin: 'Indonesia', medium: ['performance', 'installation'], style: ['feminist', 'spiritual'], themes: ['Islam', 'women', 'environment'], era: 'Contemporary' },
  { name: 'Korakrit Arunanondchai', origin: 'Thailand', medium: ['video', 'painting'], style: ['digital', 'spiritual'], themes: ['technology', 'Thailand', 'denim'], era: 'Contemporary' },

  // Pacific/Filipino
  { name: 'Pacita Abad', origin: 'Philippines', medium: ['painting', 'textile'], style: ['trapunto', 'vibrant'], themes: ['migration', 'identity', 'masks'], era: 'Contemporary' },
  { name: 'David Medalla', origin: 'Philippines', medium: ['sculpture', 'performance'], style: ['kinetic', 'participatory'], themes: ['community', 'foam', 'chance'], era: 'Contemporary' },
  { name: 'Lisa Reihana', origin: 'New Zealand/Māori', medium: ['video', 'photography'], style: ['panoramic', 'historical'], themes: ['colonialism', 'Pacific', 'encounter'], era: 'Contemporary' },
  { name: 'Brett Graham', origin: 'New Zealand/Māori', medium: ['sculpture'], style: ['monumental', 'traditional'], themes: ['Māori', 'land', 'history'], era: 'Contemporary' },
  { name: 'Shane Cotton', origin: 'New Zealand/Māori', medium: ['painting'], style: ['layered', 'symbolic'], themes: ['Māori', 'colonialism', 'landscape'], era: 'Contemporary' },
];

// =====================================================
// MIDDLE EASTERN & NORTH AFRICAN (MENA) ARTISTS
// =====================================================
export const MENA_ARTISTS: Artist[] = [
  { name: 'Shirin Neshat', origin: 'Iran', medium: ['photography', 'video'], style: ['calligraphy', 'poetic'], themes: ['women', 'Islam', 'exile'], era: 'Contemporary' },
  { name: 'Mona Hatoum', origin: 'Palestine/UK', medium: ['sculpture', 'installation'], style: ['body', 'domestic'], themes: ['displacement', 'body', 'violence'], era: 'Contemporary' },
  { name: 'Emily Jacir', origin: 'Palestine', medium: ['video', 'installation'], style: ['conceptual', 'political'], themes: ['Palestine', 'borders', 'identity'], era: 'Contemporary' },
  { name: 'Wael Shawky', origin: 'Egypt', medium: ['video', 'installation'], style: ['marionette', 'epic'], themes: ['Crusades', 'history', 'religion'], era: 'Contemporary' },
  { name: 'Kader Attia', origin: 'Algeria/France', medium: ['sculpture', 'installation'], style: ['repair', 'archive'], themes: ['colonialism', 'repair', 'trauma'], era: 'Contemporary' },
  { name: 'Yto Barrada', origin: 'Morocco', medium: ['photography', 'installation'], style: ['documentary', 'archive'], themes: ['Morocco', 'migration', 'botany'], era: 'Contemporary' },
  { name: 'Bouchra Khalili', origin: 'Morocco', medium: ['video', 'installation'], style: ['mapping', 'narrative'], themes: ['migration', 'borders', 'testimony'], era: 'Contemporary' },
  { name: 'Latifa Echakhch', origin: 'Morocco/France', medium: ['installation'], style: ['material', 'poetic'], themes: ['identity', 'memory', 'absence'], era: 'Contemporary' },
  { name: 'Walid Raad', origin: 'Lebanon', medium: ['photography', 'video'], style: ['archival', 'fictional'], themes: ['Lebanon', 'war', 'archives'], era: 'Contemporary' },
  { name: 'Akram Zaatari', origin: 'Lebanon', medium: ['video', 'photography'], style: ['archival', 'excavation'], themes: ['Lebanon', 'resistance', 'archives'], era: 'Contemporary' },
  { name: 'Raeda Saadeh', origin: 'Palestine', medium: ['photography', 'video'], style: ['performative', 'surreal'], themes: ['occupation', 'identity', 'labor'], era: 'Contemporary' },
  { name: 'Larissa Sansour', origin: 'Palestine', medium: ['video', 'film'], style: ['sci-fi', 'speculative'], themes: ['Palestine', 'future', 'memory'], era: 'Contemporary' },
  { name: 'Monira Al Qadiri', origin: 'Kuwait', medium: ['video', 'sculpture'], style: ['iridescent', 'futuristic'], themes: ['oil', 'Gulf', 'mourning'], era: 'Contemporary' },
  { name: 'Ahmed Mater', origin: 'Saudi Arabia', medium: ['photography', 'installation'], style: ['documentary', 'x-ray'], themes: ['Mecca', 'Saudi Arabia', 'transformation'], era: 'Contemporary' },
  { name: 'Parviz Tanavoli', origin: 'Iran', medium: ['sculpture'], style: ['calligraphic', 'modern'], themes: ['heech', 'Persian', 'love'], era: 'Modern/Contemporary' },
  { name: 'Shirazeh Houshiary', origin: 'Iran/UK', medium: ['painting', 'sculpture'], style: ['spiritual', 'minimal'], themes: ['breath', 'void', 'spirituality'], era: 'Contemporary' },
  { name: 'Y.Z. Kami', origin: 'Iran/USA', medium: ['painting'], style: ['portrait', 'spiritual'], themes: ['faces', 'spirituality', 'presence'], era: 'Contemporary' },
  { name: 'Tala Madani', origin: 'Iran/USA', medium: ['painting', 'animation'], style: ['figurative', 'grotesque'], themes: ['masculinity', 'power', 'humor'], era: 'Contemporary' },
];

// =====================================================
// INDIGENOUS ARTISTS
// =====================================================
export const INDIGENOUS_ARTISTS: Artist[] = [
  // First Nations / Native American
  { name: 'Jeffrey Gibson', origin: 'USA/Choctaw-Cherokee', medium: ['painting', 'sculpture'], style: ['beadwork', 'geometric'], themes: ['identity', 'queer', 'pop'], era: 'Contemporary' },
  { name: 'Jaune Quick-to-See Smith', origin: 'USA/Salish-Kootenai', medium: ['painting', 'collage'], style: ['neo-expressionist', 'political'], themes: ['Native', 'land', 'identity'], era: 'Contemporary' },
  { name: 'Nicholas Galanin', origin: 'USA/Tlingit-Unangax̂', medium: ['sculpture', 'installation'], style: ['conceptual', 'hybrid'], themes: ['colonialism', 'tradition', 'erasure'], era: 'Contemporary' },
  { name: 'Cannupa Hanska Luger', origin: 'USA/Mandan-Hidatsa-Arikara', medium: ['sculpture', 'installation'], style: ['collaborative', 'monumental'], themes: ['resistance', 'water', 'community'], era: 'Contemporary' },
  { name: 'Wendy Red Star', origin: 'USA/Apsáalooke', medium: ['photography', 'installation'], style: ['staged', 'archival'], themes: ['representation', 'history', 'humor'], era: 'Contemporary' },
  { name: 'Kent Monkman', origin: 'Canada/Cree', medium: ['painting'], style: ['historical', 'queer'], themes: ['colonialism', 'two-spirit', 'history'], era: 'Contemporary' },
  { name: 'Rebecca Belmore', origin: 'Canada/Anishinaabe', medium: ['performance', 'sculpture'], style: ['political', 'embodied'], themes: ['violence', 'land', 'Indigenous women'], era: 'Contemporary' },
  { name: 'Brian Jungen', origin: 'Canada/Dane-zaa', medium: ['sculpture'], style: ['transformation', 'found'], themes: ['consumption', 'identity', 'hybridity'], era: 'Contemporary' },

  // Australian First Nations
  { name: 'Vernon Ah Kee', origin: 'Australia/Aboriginal', medium: ['drawing', 'video'], style: ['portrait', 'text'], themes: ['identity', 'racism', 'history'], era: 'Contemporary' },
  { name: 'Richard Bell', origin: 'Australia/Aboriginal', medium: ['painting', 'performance'], style: ['political', 'text'], themes: ['activism', 'appropriation', 'politics'], era: 'Contemporary' },
  { name: 'Tony Albert', origin: 'Australia/Aboriginal', medium: ['collage', 'installation'], style: ['pop', 'archival'], themes: ['Aboriginalia', 'racism', 'identity'], era: 'Contemporary' },
  { name: 'Daniel Boyd', origin: 'Australia/Aboriginal', medium: ['painting'], style: ['dots', 'historical'], themes: ['colonialism', 'history', 'perception'], era: 'Contemporary' },
  { name: 'Brook Andrew', origin: 'Australia/Wiradjuri', medium: ['installation', 'neon'], style: ['archival', 'intervention'], themes: ['archives', 'colonialism', 'objects'], era: 'Contemporary' },
  { name: 'Destiny Deacon', origin: 'Australia/Aboriginal', medium: ['photography'], style: ['staged', 'dolls'], themes: ['stereotypes', 'identity', 'humor'], era: 'Contemporary' },
  { name: 'Fiona Foley', origin: 'Australia/Badtjala', medium: ['photography', 'sculpture'], style: ['political', 'historical'], themes: ['history', 'violence', 'sexuality'], era: 'Contemporary' },

  // Latin American Indigenous
  { name: 'Pedro Lasch', origin: 'Mexico', medium: ['installation', 'video'], style: ['intervention', 'hybrid'], themes: ['borders', 'Indigenous', 'migration'], era: 'Contemporary' },
  { name: 'Benvenuto Chavajay', origin: 'Guatemala/Maya', medium: ['sculpture', 'installation'], style: ['material', 'symbolic'], themes: ['Maya', 'colonialism', 'objects'], era: 'Contemporary' },
];

// =====================================================
// DECANONIZED / NON-WESTERN CANON ARTISTS
// (Lesser-known, overlooked, or outside mainstream Western canon)
// =====================================================
export const DECANONIZED_ARTISTS: Artist[] = [
  // Women artists historically overlooked
  { name: 'Hilma af Klint', origin: 'Sweden', medium: ['painting'], style: ['abstract', 'spiritual'], themes: ['spirituality', 'abstraction', 'cosmos'], era: 'Modern' },
  { name: 'Lee Krasner', origin: 'USA', medium: ['painting'], style: ['abstract expressionist'], themes: ['gesture', 'nature', 'rhythm'], era: 'Modern' },
  { name: 'Leonora Carrington', origin: 'UK/Mexico', medium: ['painting', 'sculpture'], style: ['surrealist', 'magical'], themes: ['mythology', 'alchemy', 'feminism'], era: 'Modern' },
  { name: 'Remedios Varo', origin: 'Spain/Mexico', medium: ['painting'], style: ['surrealist', 'mystical'], themes: ['alchemy', 'science', 'feminism'], era: 'Modern' },
  { name: 'Dorothea Tanning', origin: 'USA', medium: ['painting', 'sculpture'], style: ['surrealist'], themes: ['interior', 'dreams', 'desire'], era: 'Modern' },
  { name: 'Toyen', origin: 'Czech', medium: ['painting'], style: ['surrealist', 'erotic'], themes: ['desire', 'nature', 'dreams'], era: 'Modern' },
  { name: 'Unica Zürn', origin: 'Germany', medium: ['drawing'], style: ['automatic', 'surrealist'], themes: ['madness', 'transformation', 'body'], era: 'Modern' },
  { name: 'Maruja Mallo', origin: 'Spain', medium: ['painting'], style: ['surrealist', 'cosmic'], themes: ['nature', 'cosmos', 'Spain'], era: 'Modern' },
  { name: 'Meret Oppenheim', origin: 'Switzerland', medium: ['sculpture', 'painting'], style: ['surrealist', 'object'], themes: ['femininity', 'nature', 'transformation'], era: 'Modern' },
  { name: 'Claude Cahun', origin: 'France', medium: ['photography'], style: ['surrealist', 'performative'], themes: ['identity', 'gender', 'resistance'], era: 'Modern' },

  // Eastern European avant-garde
  { name: 'Natalia Goncharova', origin: 'Russia', medium: ['painting'], style: ['cubo-futurist', 'rayonist'], themes: ['Russian', 'tradition', 'avant-garde'], era: 'Modern' },
  { name: 'Alexandra Exter', origin: 'Ukraine', medium: ['painting', 'design'], style: ['constructivist', 'theatrical'], themes: ['theater', 'color', 'dynamism'], era: 'Modern' },
  { name: 'Varvara Stepanova', origin: 'Russia', medium: ['design', 'painting'], style: ['constructivist'], themes: ['production', 'textile', 'typography'], era: 'Modern' },
  { name: 'Sonia Delaunay', origin: 'Ukraine/France', medium: ['painting', 'textile'], style: ['orphism', 'abstract'], themes: ['color', 'rhythm', 'simultaneity'], era: 'Modern' },
  { name: 'Katarzyna Kobro', origin: 'Poland', medium: ['sculpture'], style: ['constructivist', 'spatial'], themes: ['space', 'unity', 'rhythm'], era: 'Modern' },

  // Latin American Modernists
  { name: 'Tarsila do Amaral', origin: 'Brazil', medium: ['painting'], style: ['modernist', 'anthropophagic'], themes: ['Brazil', 'tropicália', 'identity'], era: 'Modern' },
  { name: 'Lygia Clark', origin: 'Brazil', medium: ['sculpture', 'installation'], style: ['neo-concrete', 'participatory'], themes: ['body', 'therapy', 'senses'], era: 'Modern/Contemporary' },
  { name: 'Lygia Pape', origin: 'Brazil', medium: ['sculpture', 'installation'], style: ['neo-concrete', 'geometric'], themes: ['collective', 'body', 'geometry'], era: 'Modern/Contemporary' },
  { name: 'Hélio Oiticica', origin: 'Brazil', medium: ['installation', 'wearable'], style: ['neo-concrete', 'participatory'], themes: ['favela', 'body', 'tropicália'], era: 'Modern/Contemporary' },
  { name: 'Gego', origin: 'Germany/Venezuela', medium: ['sculpture'], style: ['kinetic', 'linear'], themes: ['line', 'space', 'net'], era: 'Modern/Contemporary' },
  { name: 'Jesús Rafael Soto', origin: 'Venezuela', medium: ['sculpture', 'installation'], style: ['kinetic', 'optical'], themes: ['movement', 'penetrable', 'participation'], era: 'Modern/Contemporary' },
  { name: 'Carlos Cruz-Diez', origin: 'Venezuela', medium: ['installation'], style: ['kinetic', 'chromatic'], themes: ['color', 'perception', 'participation'], era: 'Modern/Contemporary' },

  // Outsider / Self-taught
  { name: 'Henry Darger', origin: 'USA', medium: ['drawing', 'collage'], style: ['outsider', 'narrative'], themes: ['fantasy', 'childhood', 'war'], era: 'Modern' },
  { name: 'Martín Ramírez', origin: 'Mexico/USA', medium: ['drawing'], style: ['outsider', 'pattern'], themes: ['trains', 'Mexico', 'repetition'], era: 'Modern' },
  { name: 'Bill Traylor', origin: 'USA', medium: ['drawing', 'painting'], style: ['self-taught', 'memory'], themes: ['slavery', 'animals', 'memory'], era: 'Modern' },
  { name: 'Thornton Dial', origin: 'USA', medium: ['assemblage'], style: ['self-taught', 'found'], themes: ['history', 'race', 'labor'], era: 'Contemporary' },
  { name: 'Purvis Young', origin: 'USA', medium: ['painting'], style: ['self-taught', 'urban'], themes: ['Miami', 'protest', 'angels'], era: 'Contemporary' },

  // Japanese avant-garde (beyond Kusama/Murakami)
  { name: 'Gutai Group', origin: 'Japan', medium: ['performance', 'painting'], style: ['action', 'material'], themes: ['body', 'destruction', 'creation'], era: 'Modern' },
  { name: 'Tatsuo Miyajima', origin: 'Japan', medium: ['installation', 'LED'], style: ['digital', 'counting'], themes: ['time', 'life', 'death'], era: 'Contemporary' },
  { name: 'Yoshitomo Nara', origin: 'Japan', medium: ['painting', 'sculpture'], style: ['pop', 'cute'], themes: ['childhood', 'rebellion', 'solitude'], era: 'Contemporary' },
  { name: 'Kishio Suga', origin: 'Japan', medium: ['sculpture', 'installation'], style: ['mono-ha', 'material'], themes: ['nature', 'material', 'situation'], era: 'Contemporary' },

  // African Modernists (pre-contemporary)
  { name: 'Ibrahim El-Salahi', origin: 'Sudan', medium: ['painting', 'drawing'], style: ['calligraphic', 'spiritual'], themes: ['Islam', 'calligraphy', 'Sudan'], era: 'Modern/Contemporary' },
  { name: 'Skunder Boghossian', origin: 'Ethiopia', medium: ['painting'], style: ['abstract', 'spiritual'], themes: ['Ethiopia', 'cosmos', 'scrolls'], era: 'Modern' },
  { name: 'Ernest Mancoba', origin: 'South Africa', medium: ['painting', 'sculpture'], style: ['abstract', 'spiritual'], themes: ['African', 'universal', 'exile'], era: 'Modern' },
  { name: 'Gerard Sekoto', origin: 'South Africa', medium: ['painting'], style: ['figurative', 'social'], themes: ['township', 'exile', 'life'], era: 'Modern' },
  { name: 'Ben Enwonwu', origin: 'Nigeria', medium: ['painting', 'sculpture'], style: ['modernist', 'Nigerian'], themes: ['Nigeria', 'identity', 'negritude'], era: 'Modern' },

  // Concrete / Hard-edge overlooked
  { name: 'Nasreen Mohamedi', origin: 'India', medium: ['drawing'], style: ['minimal', 'linear'], themes: ['line', 'void', 'geometry'], era: 'Modern/Contemporary' },
  { name: 'Zarina Hashmi', origin: 'India/USA', medium: ['printmaking'], style: ['minimal', 'geometric'], themes: ['home', 'displacement', 'maps'], era: 'Modern/Contemporary' },
];

// =====================================================
// AFROFUTURIST ARTISTS
// =====================================================
export const AFROFUTURIST_ARTISTS: Artist[] = [
  { name: 'Sun Ra', origin: 'USA', medium: ['music', 'visual'], style: ['cosmic', 'jazz'], themes: ['space', 'Egypt', 'future'], era: 'Modern' },
  { name: 'Wangechi Mutu', origin: 'Kenya', medium: ['collage', 'sculpture'], style: ['hybrid', 'surreal'], themes: ['body', 'future', 'feminism'], era: 'Contemporary' },
  { name: 'Ellen Gallagher', origin: 'USA', medium: ['painting', 'collage'], style: ['layered', 'aquatic'], themes: ['Drexciya', 'ocean', 'Black history'], era: 'Contemporary' },
  { name: 'Tabita Rezaire', origin: 'France/Guyana', medium: ['video', 'installation'], style: ['digital', 'healing'], themes: ['technology', 'spirituality', 'decolonization'], era: 'Contemporary' },
  { name: 'Cauleen Smith', origin: 'USA', medium: ['film', 'installation'], style: ['experimental', 'community'], themes: ['afrofuturism', 'utopia', 'Black radical'], era: 'Contemporary' },
  { name: 'Jenn Nkiru', origin: 'UK/Nigeria', medium: ['film', 'video'], style: ['poetic', 'archival'], themes: ['Blackness', 'diaspora', 'future'], era: 'Contemporary' },
  { name: 'Lina Iris Viktor', origin: 'UK/Liberia', medium: ['painting'], style: ['gold', 'Black'], themes: ['cosmos', 'femininity', 'power'], era: 'Contemporary' },
  { name: 'Kiluanji Kia Henda', origin: 'Angola', medium: ['photography', 'video'], style: ['speculative', 'satirical'], themes: ['colonialism', 'space', 'monuments'], era: 'Contemporary' },
  { name: 'Kapwani Kiwanga', origin: 'Tanzania/Canada', medium: ['installation', 'video'], style: ['research', 'afrofuturist'], themes: ['history', 'botany', 'power'], era: 'Contemporary' },
  { name: 'Rashaad Newsome', origin: 'USA', medium: ['video', 'performance'], style: ['vogue', 'digital'], themes: ['vogue', 'AI', 'Black excellence'], era: 'Contemporary' },
  { name: 'Terence Nance', origin: 'USA', medium: ['film', 'television'], style: ['surreal', 'musical'], themes: ['Blackness', 'random', 'dreams'], era: 'Contemporary' },
];

// =====================================================
// DIGITAL / NEW MEDIA POC ARTISTS
// =====================================================
export const DIGITAL_POC_ARTISTS: Artist[] = [
  { name: 'Sondra Perry', origin: 'USA', medium: ['video', 'digital'], style: ['avatar', 'gaming'], themes: ['Blackness', 'digital', 'body'], era: 'Contemporary' },
  { name: 'Jacolby Satterwhite', origin: 'USA', medium: ['video', '3D'], style: ['maximalist', 'queer'], themes: ['family', 'fantasy', 'voguing'], era: 'Contemporary' },
  { name: 'Hito Steyerl', origin: 'Germany', medium: ['video', 'installation'], style: ['essay', 'digital'], themes: ['images', 'capitalism', 'technology'], era: 'Contemporary' },
  { name: 'Ian Cheng', origin: 'USA', medium: ['simulation', 'AI'], style: ['generative', 'evolutionary'], themes: ['AI', 'evolution', 'narrative'], era: 'Contemporary' },
  { name: 'Lu Yang', origin: 'China', medium: ['video', 'gaming'], style: ['anime', 'digital'], themes: ['body', 'consciousness', 'religion'], era: 'Contemporary' },
  { name: 'Cao Fei', origin: 'China', medium: ['video', 'virtual'], style: ['virtual', 'documentary'], themes: ['China', 'virtual worlds', 'labor'], era: 'Contemporary' },
  { name: 'Shu Lea Cheang', origin: 'Taiwan/USA', medium: ['net art', 'installation'], style: ['cyber', 'queer'], themes: ['virus', 'sexuality', 'networks'], era: 'Contemporary' },
  { name: 'Stephanie Dinkins', origin: 'USA', medium: ['AI', 'installation'], style: ['conversational', 'community'], themes: ['AI', 'race', 'memory'], era: 'Contemporary' },
  { name: 'American Artist', origin: 'USA', medium: ['installation', 'digital'], style: ['conceptual', 'Black'], themes: ['Blackness', 'technology', 'labor'], era: 'Contemporary' },
  { name: 'Martine Syms', origin: 'USA', medium: ['video', 'installation'], style: ['narrative', 'pop'], themes: ['representation', 'Blackness', 'media'], era: 'Contemporary' },
  { name: 'Legacy Russell', origin: 'USA', medium: ['writing', 'digital'], style: ['glitch', 'feminist'], themes: ['glitch feminism', 'digital', 'body'], era: 'Contemporary' },
];

// =====================================================
// COMBINED DATABASE & RANDOMIZATION FUNCTIONS
// =====================================================

export const ALL_ARTISTS: Record<ArtistCategory, Artist[]> = {
  african_contemporary: AFRICAN_CONTEMPORARY,
  african_postcolonial: AFRICAN_CONTEMPORARY, // Same pool for now
  black_diaspora_americas: BLACK_DIASPORA_AMERICAS,
  black_diaspora_uk_europe: BLACK_DIASPORA_UK_EUROPE,
  black_diaspora_caribbean: BLACK_DIASPORA_CARIBBEAN,
  latine: LATINE_ARTISTS,
  asian_pacific: ASIAN_PACIFIC_ARTISTS,
  mena: MENA_ARTISTS,
  indigenous: INDIGENOUS_ARTISTS,
  decanonized: DECANONIZED_ARTISTS,
  afrofuturist: AFROFUTURIST_ARTISTS,
  digital_poc: DIGITAL_POC_ARTISTS,
};

// Priority weights for categories (higher = more likely to be selected)
// Prioritizes post-colonial African and Black diaspora
const CATEGORY_WEIGHTS: Record<ArtistCategory, number> = {
  african_contemporary: 25,
  african_postcolonial: 20,
  black_diaspora_americas: 15,
  black_diaspora_uk_europe: 10,
  black_diaspora_caribbean: 8,
  latine: 8,
  asian_pacific: 5,
  mena: 4,
  indigenous: 3,
  decanonized: 1,
  afrofuturist: 0.5, // Bonus category
  digital_poc: 0.5,  // Bonus category
};

/**
 * Get a random artist from a specific category
 */
export function getRandomArtistFromCategory(category: ArtistCategory): Artist {
  const artists = ALL_ARTISTS[category];
  return artists[Math.floor(Math.random() * artists.length)];
}

/**
 * Get random artists with weighted category selection
 * Prioritizes post-colonial African and Black diaspora artists
 */
export function getRandomArtists(count: number = 2, excludeNames: string[] = []): Artist[] {
  const result: Artist[] = [];
  const usedNames = new Set(excludeNames);

  // Build weighted array of categories
  const weightedCategories: ArtistCategory[] = [];
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const scaledWeight = Math.ceil(weight);
    for (let i = 0; i < scaledWeight; i++) {
      weightedCategories.push(category as ArtistCategory);
    }
  }

  let attempts = 0;
  const maxAttempts = count * 10;

  while (result.length < count && attempts < maxAttempts) {
    attempts++;

    // Pick random category (weighted)
    const category = weightedCategories[Math.floor(Math.random() * weightedCategories.length)];
    const artist = getRandomArtistFromCategory(category);

    // Avoid duplicates
    if (!usedNames.has(artist.name)) {
      result.push(artist);
      usedNames.add(artist.name);
    }
  }

  return result;
}

/**
 * Get artists matching specific criteria
 */
export function getArtistsByMedium(medium: string): Artist[] {
  const allArtists = Object.values(ALL_ARTISTS).flat();
  return allArtists.filter(a =>
    a.medium.some(m => m.toLowerCase().includes(medium.toLowerCase()))
  );
}

export function getArtistsByTheme(theme: string): Artist[] {
  const allArtists = Object.values(ALL_ARTISTS).flat();
  return allArtists.filter(a =>
    a.themes.some(t => t.toLowerCase().includes(theme.toLowerCase()))
  );
}

export function getArtistsByStyle(style: string): Artist[] {
  const allArtists = Object.values(ALL_ARTISTS).flat();
  return allArtists.filter(a =>
    a.style.some(s => s.toLowerCase().includes(style.toLowerCase()))
  );
}

/**
 * Format artist reference for prompt injection
 */
export function formatArtistReference(artist: Artist, format: 'full' | 'name' | 'style' = 'full'): string {
  switch (format) {
    case 'name':
      return artist.name;
    case 'style':
      return `in the style of ${artist.name}`;
    case 'full':
    default:
      return `${artist.name} (${artist.origin}, ${artist.medium.slice(0, 2).join('/')})`;
  }
}

/**
 * Get artist injection prompt based on variation intensity
 * Higher variation = more diverse and unexpected artist combinations
 */
export function getArtistInjectionPrompt(variationIntensity: number): string {
  if (variationIntensity < 30) {
    // Low variation - 1 artist, mainstream choice
    const artist = getRandomArtists(1)[0];
    return `Reference artist: ${formatArtistReference(artist, 'style')}`;
  } else if (variationIntensity < 60) {
    // Medium variation - 2 artists, some diversity
    const artists = getRandomArtists(2);
    return `Reference artists for style fusion: ${artists.map(a => formatArtistReference(a, 'name')).join(' meets ')}`;
  } else if (variationIntensity < 80) {
    // High variation - 2-3 artists from different traditions
    const artists = getRandomArtists(3);
    const primary = artists[0];
    const influences = artists.slice(1);
    return `DISCOVER NEW ARTISTS - Primary reference: ${formatArtistReference(primary, 'full')}, with influences from ${influences.map(a => a.name).join(' and ')}`;
  } else {
    // Maximum variation - unexpected combinations, force discovery
    const artists = getRandomArtists(4);
    const descriptions = artists.map(a =>
      `${a.name} (${a.themes.slice(0, 2).join(', ')})`
    );
    return `FORCE ARTIST DISCOVERY - Combine these unexpected influences: ${descriptions.join(' × ')}. Create something that honors their distinct visions while forging new territory.`;
  }
}

/**
 * Get the total artist count for stats
 */
export function getTotalArtistCount(): number {
  return Object.values(ALL_ARTISTS).flat().length;
}

/**
 * Get category breakdown for stats
 */
export function getCategoryBreakdown(): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const [category, artists] of Object.entries(ALL_ARTISTS)) {
    breakdown[category] = artists.length;
  }
  return breakdown;
}
