export type UnitType =
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'bag'
  | 'stick'
  | 'leaf'
  | 'large'
  | 'medium'
  | 'small'
  | 'white'
  | 'yolk'
  | 'cube'
  | 'ml'
  | 'g'
  | 'kg';

export interface IngredientData {
  aliases: string[];
  units: Partial<Record<UnitType, number>>;
}

export const INGREDIENTS_DATA: IngredientData[] = [
  {
    aliases: ['קמח מלא'],
    units: { cup: 125, tbsp: 8 },
  },
  {
    aliases: ['קמח', 'קמח לבן', 'קמח תופח', 'קמח רגיל'],
    units: { cup: 140, tbsp: 10 },
  },
  {
    aliases: ['סוכר לבן', 'סוכר'],
    units: { cup: 200, tbsp: 12, tsp: 5 },
  },
  {
    aliases: ['סוכר חום דחוס', 'סוכר חום'],
    units: { cup: 240, tbsp: 15, tsp: 7 },
  },
  {
    aliases: ['אבקת אפייה'],
    units: { bag: 10, tbsp: 8, tsp: 3 },
  },
  {
    aliases: ['אבקת סוכר'],
    units: { cup: 120, tbsp: 8, tsp: 3 },
  },
  {
    aliases: ['אגוזים קצוצים', 'שקדים קצוצים'],
    units: { cup: 100, tbsp: 6 },
  },
  {
    aliases: ['קמח שקדים', 'שקדים טחונים', 'אגוזים טחונים', 'שקדים טחונים לאבקה', 'אגוזים'],
    units: { cup: 100 },
  },
  {
    aliases: ['אורז קצר', 'אורז עגול', 'אורז לסושי'],
    units: { cup: 210 },
  },
  {
    aliases: ['אורז', 'אורז ארוך', 'אורז בסמטי', 'אורז פרסי'],
    units: { cup: 200 },
  },
  {
    aliases: ['מלח'],
    units: { cup: 250, tbsp: 20, tsp: 6 },
  },
  {
    aliases: ['סודה לשתייה'],
    units: { bag: 10, tbsp: 8, tsp: 3 },
  },
  {
    aliases: ['סוכר וניל'],
    units: { cup: 140, tbsp: 10, tsp: 3 },
  },
  {
    aliases: ['פירורי לחם', 'פירורי לחם יבשים'],
    units: { cup: 125, tbsp: 10 },
  },
  {
    aliases: ['פירות יבשים', 'פירות יבשים קצוצים'],
    units: { cup: 150 },
  },
  {
    aliases: ['פירורי עוגיות', 'פירורי ביסקוויטים', 'ביסקוויטים טחונים'],
    units: { cup: 110 },
  },
  {
    aliases: ['פרג', 'פרג טחון'],
    units: { cup: 70 },
  },
  {
    aliases: ['קוקוס', 'קוקוס טחון'],
    units: { cup: 100, tbsp: 12, tsp: 5 },
  },
  {
    aliases: ['קורנפלור'],
    units: { tbsp: 10 },
  },
  {
    aliases: ['חמאה'],
    units: { cup: 240, tbsp: 15, stick: 113 },
  },
  {
    aliases: ['שמן', 'שמן קנולה', 'שמן זית', 'שמן חמניות'],
    units: { cup: 200, ml: 0.9 }, // 100 ml = 90g
  },
  {
    aliases: ['מים', 'מיץ לימון', 'מיץ תפוזים', 'חלב', 'שמנת מתוקה', 'חומץ'],
    units: { cup: 240, tbsp: 15, ml: 1 },
  },
  {
    aliases: ['דבש', 'סילאן', 'מייפל'],
    units: { cup: 360, tbsp: 22, tsp: 10 },
  },
  {
    aliases: ['ריבה', 'קונפיטורה'],
    units: { cup: 330, tbsp: 20, tsp: 10 },
  },
  {
    aliases: ["ג'לטין", 'ג׳לטין', 'גלטין'],
    units: { bag: 14, tbsp: 10, leaf: 4 },
  },
  {
    aliases: ['ביצה', 'ביצים'],
    units: { large: 65, medium: 58, small: 50, white: 40, yolk: 20 },
  },
  {
    aliases: ['קקאו', 'אבקת קקאו'],
    units: { cup: 140, tbsp: 10 },
  },
  {
    aliases: ['שמרים יבשים'],
    units: { tbsp: 10 },
  },
  {
    aliases: ['שמרים טריים', 'שמרית', 'קוביית שמרים'],
    units: { cube: 50, bag: 50 },
  },
];

export const GENERAL_VOLUMES: Record<string, number> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
};

export const HEBREW_UNIT_MAP: Record<string, UnitType> = {
  'כוס': 'cup',
  'כוסות': 'cup',
  'כף': 'tbsp',
  'כפות': 'tbsp',
  'כפית': 'tsp',
  'כפיות': 'tsp',
  'שקית': 'bag',
  'שקיות': 'bag',
  'מ"ל': 'ml',
  'מל': 'ml',
  'מ״ל': 'ml',
  'גרם': 'g',
  'ג': 'g',
  'גר': 'g',
  'ק"ג': 'kg',
  'קג': 'kg',
  'קילוגרם': 'kg',
  'עלה': 'leaf',
  'עלים': 'leaf',
  'חלבון': 'white',
  'חלבונים': 'white',
  'חלמון': 'yolk',
  'חלמונים': 'yolk',
  'קובייה': 'cube',
  'קוביות': 'cube',
  'l': 'large',
  'm': 'medium',
  's': 'small',
  'מקל': 'stick',
};