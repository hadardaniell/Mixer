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
import { Image } from 'react-native';
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
  /** Cover photos of the book's first recipes. With two or more, they become the
   *  cover and the chosen color narrows to an edge stripe. */
  images?: string[];
}

/** Width of the color stripe along the inner edge, as a share of the cover. */
const EDGE_RATIO = 0.033;
const MIN_MOSAIC_IMAGES = 2;

/**
 * Renders a book cover. What a cover says depends on what the book has:
 *
 * - **With photos** — a mosaic of up to four recipe images, and the chosen color
 *   as a stripe along the inner edge. The cover shows what's *in* the book, and
 *   the color stays as the thread back to the book's own page.
 * - **Without photos** — the composed cover: the chosen color as a field with the
 *   chosen glyph. New books and text-only imports live here, so it isn't a
 *   degraded state — for many books it's the only state.
 *
 * The glyph is drawn `weight="fill"`: at these sizes a line glyph reads as a
 * faint scratch rather than as a mark.
 */
export function BookCoverArt({ coverKey, size, radius = 0, images }: BookCoverArtProps) {
  const { color, icon: Icon } = decodeCover(coverKey);
  const glyph = size * 0.46;
  const photos = (images ?? []).filter(Boolean).slice(0, 4);

  if (photos.length >= MIN_MOSAIC_IMAGES) {
    return (
      <View width="100%" height="100%" borderRadius={radius} overflow="hidden">
        <View flex={1} flexDirection="row" flexWrap="wrap">
          {photos.map((uri, i) => (
            <View
              key={`${uri}-${i}`}
              // Two across, two down. An odd third photo takes the full bottom row
              // rather than leaving a hole.
              width={photos.length === 3 && i === 2 ? '100%' : '50%'}
              height={photos.length <= 2 ? '100%' : '50%'}
            >
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ))}
        </View>
        {/* `end`: the stripe hugs the edge that meets the text, and flips with RTL. */}
        <View
          position="absolute"
          top={0}
          bottom={0}
          end={0}
          width={Math.max(3, size * EDGE_RATIO)}
          backgroundColor={color.deep}
        />
      </View>
    );
  }

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
      <Icon size={glyph} color={color.deep} weight="fill" />
    </View>
  );
}
