import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SuggestKeywordInput {
  title: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string }>;
}

export async function generateRecipeKeyword(recipe: SuggestKeywordInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return recipe.title;
  }

  const prompt = `
    You are a food photography and culinary expert. Analyze the recipe details below (including title, description, and ingredients) to infer the exact food type, shape, or main cooking method. Generate a precise 2-3 word English search query for photo lookup.

    Title: ${recipe.title}
    Description: ${recipe.description ?? 'N/A'}
    Cuisine: ${recipe.cuisine ?? 'N/A'}
    Ingredients: ${recipe.ingredients?.map((i) => i.name).slice(0, 8).join(', ') ?? 'N/A'}

    Rules:
    - Output ONLY a 2-3 word English query specifying the exact physical style, shape, or main ingredient of the finished dish.
    - Do NOT add marketing words ("delicious", "gourmet", "tasty") or process/raw words ("mixing", "batter", "chopping").
    - No punctuation, quotes, markdown, or explanation.

    Translating & Inferring Categories (Analyze Ingredients + Description + Title):

    1. CAKES & DESSERTS:
    * Simple baked cakes (flour, oil, eggs, cocoa, no gelatin/whipped cream) -> "Chocolate loaf cake" / "Vanilla pound cake"
    * Chilled / Gelatin / Whipped cream -> "Chocolate mousse cake" / "Layered cake"
    * Ring pan / Rolled -> "Bundt cake" / "Swiss roll"
    * Cookies / Bars -> "Chocolate chip cookies" / "Oat energy bars"

    2. MEAT, POULTRY & FISH:
    * Ground meat / fish / veggies -> "Beef meatballs" / "Fish cakes" / "Veggie patties"
    * Breaded & fried -> "Chicken schnitzel" / "Crispy chicken"
    * Slow cooked in liquid -> "Beef stew" / "Pot roast"
    * Whole fillet / Pan fried -> "Grilled chicken breast" / "Baked salmon fillet"

    3. PASTA, NOODLES & GRAINS:
    * Baked with sauce/cheese -> "Baked pasta" / "Lasagna"
    * Stir-fried with vegetables/soy -> "Chicken stir fry" / "Vegetable noodles"
    * Rice / Legumes -> "Rice pilaf" / "Lentil rice"

    4. SOUPS & SALADS:
    * Pureed / Thick -> "Creamy tomato soup" / "Pumpkin soup"
    * Clear / Chunky broth -> "Vegetable noodle soup"
    * Plated salads -> "Greek salad" / "Caesar salad"

    Examples:
    - Title: "עוגת שוקולד קלה", Ingredients: "קמח, שמן, קקאו, ביצים" -> Chocolate loaf cake
    - Title: "עוגת שוקולד ליום הולדת", Ingredients: "שמנת מתוקה, ג'לטין, שוקולד" -> Chocolate mousse cake
    - Title: "קציצות בקר ברוטב עגבניות", Ingredients: "בשר טחון, בצל, עגבניות" -> Beef meatballs tomato
    - Title: "חזה עוף במחבת", Ingredients: "חזה עוף, שמן זית, תבלינים" -> Pan seared chicken
    - Title: "מרק עדשים כתומות", Ingredients: "עדשים כתומות, גזר, בצל" -> Red lentil soup
    - Title: "סלט חסה עם אגוזים", Ingredients: "חסה, אגוזי מלך, ויניגרט" -> Walnut green salad
    `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/["'`.#]/g, '').trim();

    return cleaned || recipe.title;
  } catch {
    return recipe.title;
  }
}