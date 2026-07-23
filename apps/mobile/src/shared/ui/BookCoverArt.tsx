import {
  BowlFoodIcon,
  BreadIcon,
  CakeIcon,
  CarrotIcon,
  ChefHatIcon,
  CoffeeIcon,
  CookieIcon,
  CookingPotIcon,
  FishIcon,
  ForkKnifeIcon,
  type Icon,
  PizzaIcon,
  WineIcon,
} from 'phosphor-react-native';
import { View } from 'tamagui';

/**
 * Book covers are composed, not uploaded: the user picks a color and an icon,
 * and the cover is rendered from them (a soft tint field, a colored blob, and a
 * line glyph). Infinite covers from a small set, in the same language as the
 * rest of the app — and zero image assets.
 *
 * The choice persists in the book's free-form `coverKey` string, encoded as
 * `"colorId.iconId"` (e.g. `"lavender.chef"`). No contract or DB change: the
 * field already exists. Legacy `rbc*` keys simply fall back to the default.
 *
 * These swatches are the one sanctioned block of literal hex outside
 * `palette.ts`: they are user-facing *content* colors (the palette a person
 * paints their book with), not system chrome, so they live with the feature.
 */

interface CoverColor {
  id: string;
  tint: string; // cover background
  deep: string; // blob + icon stroke
}

export const COVER_COLORS: CoverColor[] = [
  { id: 'lavender', tint: '#E8EDFF', deep: '#6C8EFF' },
  { id: 'rose', tint: '#FFECEF', deep: '#E06C9A' },
  { id: 'mint', tint: '#E6F7F1', deep: '#2E9B78' },
  { id: 'peach', tint: '#FFF2E6', deep: '#D98A3F' },
  { id: 'lilac', tint: '#F3E8FF', deep: '#9A6CD9' },
  { id: 'sky', tint: '#E9F1FF', deep: '#4A7AD0' },
  { id: 'clay', tint: '#FDECE0', deep: '#C86A3A' },
  { id: 'sage', tint: '#EAF6E9', deep: '#5F9B4A' },
];

export const COVER_ICONS: { id: string; Icon: Icon }[] = [
  { id: 'chef', Icon: ChefHatIcon },
  { id: 'pot', Icon: CookingPotIcon },
  { id: 'fork', Icon: ForkKnifeIcon },
  { id: 'bowl', Icon: BowlFoodIcon },
  { id: 'cake', Icon: CakeIcon },
  { id: 'coffee', Icon: CoffeeIcon },
  { id: 'wine', Icon: WineIcon },
  { id: 'bread', Icon: BreadIcon },
  { id: 'pizza', Icon: PizzaIcon },
  { id: 'carrot', Icon: CarrotIcon },
  { id: 'cookie', Icon: CookieIcon },
  { id: 'fish', Icon: FishIcon },
];

const DEFAULT_COLOR = COVER_COLORS[0]!;
const DEFAULT_ICON = COVER_ICONS[0]!;

export function encodeCover(colorId: string, iconId: string): string {
  return `${colorId}.${iconId}`;
}

/** Parse a `coverKey` into a color + icon, defaulting for legacy/empty keys. */
export function decodeCover(coverKey?: string): { color: CoverColor; icon: Icon } {
  const [colorId, iconId] = (coverKey ?? '').split('.');
  const color = COVER_COLORS.find((c) => c.id === colorId) ?? DEFAULT_COLOR;
  const icon = COVER_ICONS.find((i) => i.id === iconId)?.Icon ?? DEFAULT_ICON.Icon;
  return { color, icon };
}

export const DEFAULT_COVER_KEY = encodeCover(DEFAULT_COLOR.id, DEFAULT_ICON.id);

interface BookCoverArtProps {
  coverKey?: string;
  /** Reference size (usually the box's smaller edge) that scales the blob and
   *  glyph. The View itself fills its parent, so the parent sets the box. */
  size: number;
  radius?: number;
}

/**
 * Renders a book cover from its `coverKey`: a solid tint field filling the
 * parent with the line icon centered in the color's deeper tone. No blob, no
 * white — one flat color panel, which is what reads cleanest both as the feed
 * card's top and as the list row's leading panel.
 */
export function BookCoverArt({ coverKey, size, radius = 0 }: BookCoverArtProps) {
  const { color, icon: Icon } = decodeCover(coverKey);
  const glyph = size * 0.46;

  return (
    <View
      width="100%"
      height="100%"
      borderRadius={radius}
      backgroundColor={color.tint}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Icon size={glyph} color={color.deep} weight="regular" />
    </View>
  );
}
