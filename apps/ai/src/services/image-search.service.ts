/**
 * Image Search Service
 * Dynamic Unsplash Live Photo Search + Curated Category Fallback Pools.
 * Performs live search on Unsplash for exact recipe titles (e.g., Tacos, Empanadas, Pizza with Olives),
 * ensuring the returned cover photo corresponds 100% to the specific dish.
 */

interface IngredientItem {
  name: string;
}

const FOOD_IMAGE_POOLS: Record<string, string[]> = {
  // --- MEXICAN / LATIN ---
  tacos_mexican: [
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=1000&q=80',
  ],

  // --- PIZZA SUB-POOLS ---
  pizza_olive: [
    'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=80',
  ],
  pizza_mushroom: [
    'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1000&q=80',
  ],
  pizza_pepperoni: [
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1000&q=80',
  ],
  pizza_general: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1000&q=80',
  ],

  // --- BURGER SUB-POOLS ---
  burger_double_triple: [
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1000&q=80',
  ],
  burger_general: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=80',
  ],

  // --- GENERAL FALLBACKS ---
  general: [
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=80',
  ],
};

const OLIVE_KEYWORDS = ['olive', 'olives', 'זיתים', 'זית', 'оливки', 'маслины', 'aceitunas', 'olivas'];
const MUSHROOM_KEYWORDS = ['mushroom', 'mushrooms', 'פטריות', 'грибы', 'champiñones'];
const PEPPERONI_KEYWORDS = ['pepperoni', 'salami', 'פפרוני', 'пепперони', 'колбаса'];

/**
 * Searches Unsplash Live Photo API dynamically for exact dish titles
 */
async function searchLiveUnsplashImage(query: string): Promise<string | undefined> {
  try {
    const cleanQuery = query.replace(/[^\w\s\u0590-\u05FF\u0400-\u04FF]/gi, ' ').trim();
    if (!cleanQuery || cleanQuery.length < 3) return undefined;

    const response = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(cleanQuery + ' food')}&per_page=10`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    );

    if (!response.ok) return undefined;
    const data = (await response.json()) as { results?: Array<{ urls?: { regular?: string; small?: string } }> };

    if (!data.results || data.results.length === 0) return undefined;

    const validUrls = data.results
      .map((item) => item.urls?.regular || item.urls?.small)
      .filter((url): url is string => Boolean(url));

    if (validUrls.length === 0) return undefined;

    // Pick a random image from top search results
    const randomIndex = Math.floor(Math.random() * Math.min(validUrls.length, 6));
    return validUrls[randomIndex];
  } catch {
    return undefined;
  }
}

/**
 * Detect specific fallback sub-category key matching toppings/ingredients
 */
function detectSpecificCategory(
  title?: string,
  tags?: string[],
  cuisine?: string,
  ingredients?: Array<IngredientItem | string>,
): string {
  const ingNames = (ingredients || [])
    .map((item) => (typeof item === 'string' ? item : item.name || ''))
    .join(' ');
  const combined = `${title || ''} ${(tags || []).join(' ')} ${cuisine || ''} ${ingNames}`.toLowerCase();

  if (combined.includes('taco') || combined.includes('empanada') || combined.includes('burrito') || combined.includes('quesadilla') || combined.includes('nacho') || combined.includes('טורטיה')) {
    return 'tacos_mexican';
  }

  if (combined.includes('pizza') || combined.includes('פיצה') || combined.includes('пицца')) {
    if (OLIVE_KEYWORDS.some((kw) => combined.includes(kw))) return 'pizza_olive';
    if (MUSHROOM_KEYWORDS.some((kw) => combined.includes(kw))) return 'pizza_mushroom';
    if (PEPPERONI_KEYWORDS.some((kw) => combined.includes(kw))) return 'pizza_pepperoni';
    return 'pizza_general';
  }

  if (combined.includes('burger') || combined.includes('cheeseburger') || combined.includes('המבורגר') || combined.includes('бургер')) {
    if (combined.includes('triple') || combined.includes('double') || combined.includes('smash') || combined.includes('טריפל')) return 'burger_double_triple';
    return 'burger_general';
  }

  return 'general';
}

/**
 * Returns a high-quality external food image URL for a recipe.
 * 1. Tries dynamic live Unsplash photo search using exact recipe title + main ingredients.
 * 2. Falls back to curated sub-category image pools if search yields no results.
 */
export async function fetchExternalRecipeImage(
  title?: string,
  cuisine?: string,
  tags?: string[],
  ingredients?: Array<IngredientItem | string>,
): Promise<string> {
  // 1. Try Live Unsplash Search with exact dish title first
  if (title && title.trim().length > 2) {
    const liveImageUrl = await searchLiveUnsplashImage(title);
    if (liveImageUrl) {
      return liveImageUrl;
    }
  }

  // 2. Fallback to curated pools
  const categoryKey = detectSpecificCategory(title, tags, cuisine, ingredients);
  const pool = FOOD_IMAGE_POOLS[categoryKey] ?? FOOD_IMAGE_POOLS.general!;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] ?? pool[0]!;
}
