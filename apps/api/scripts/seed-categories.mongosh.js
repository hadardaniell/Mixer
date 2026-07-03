// Seed the `categories` collection with the initial food-type chips.
//
// Idempotent: keyed by `slug` (which has a unique index), so re-running updates
// existing docs instead of duplicating them. New slugs are inserted.
//
// Run against your Mixer database, e.g.:
//   mongosh "<MONGO_URL>/<DB_NAME>" apps/api/scripts/seed-categories.mongosh.js
//
// `accent` values are design-system color-token names (see apps/mobile theme).

const categories = [
  { slug: 'pasta',      label: { he: 'פסטה',        en: 'Pasta' },      accent: 'accentPeach',    order: 1 },
  { slug: 'soups',      label: { he: 'מרקים',       en: 'Soups' },      accent: 'accentOrange',   order: 2 },
  { slug: 'salads',     label: { he: 'סלטים',       en: 'Salads' },     accent: 'accentGreen',    order: 3 },
  { slug: 'desserts',   label: { he: 'קינוחים',     en: 'Desserts' },   accent: 'accentPink',     order: 4 },
  { slug: 'baked',      label: { he: 'מאפים',       en: 'Baked goods' },accent: 'accentBrown',    order: 5 },
  { slug: 'meat',       label: { he: 'בשרים',       en: 'Meat' },       accent: 'accentCoral',    order: 6 },
  { slug: 'chicken',    label: { he: 'עוף',         en: 'Chicken' },    accent: 'accentYellow',   order: 7 },
  { slug: 'fish',       label: { he: 'דגים',        en: 'Fish' },       accent: 'accentSeafoam',  order: 8 },
  { slug: 'vegetarian', label: { he: 'צמחוני',      en: 'Vegetarian' }, accent: 'accentMint',     order: 9 },
  { slug: 'vegan',      label: { he: 'טבעוני',      en: 'Vegan' },      accent: 'accentLime',     order: 10 },
  { slug: 'breakfast',  label: { he: 'ארוחת בוקר',  en: 'Breakfast' },  accent: 'accentLavender', order: 11 },
  { slug: 'drinks',     label: { he: 'משקאות',      en: 'Drinks' },     accent: 'accentTeal',     order: 12 },
];

let upserted = 0;
let modified = 0;
for (const c of categories) {
  const res = db.categories.updateOne(
    { slug: c.slug },
    { $set: { label: c.label, accent: c.accent, order: c.order, isActive: true } },
    { upsert: true },
  );
  if (res.upsertedCount) upserted += 1;
  else if (res.modifiedCount) modified += 1;
}

print(`categories seeded — inserted: ${upserted}, updated: ${modified}, total: ${db.categories.countDocuments()}`);
