import type { ImageSourcePropType } from 'react-native';

/**
 * The bundled recipe-book cover illustrations. Books persist a `coverKey`
 * (e.g. "rbc3"); the app resolves it to a local asset here. (User-uploaded
 * covers via Firebase are a later addition that would set `coverImageUrl`.)
 */
export const COVER_IMAGES: Record<string, ImageSourcePropType> = {
  rbc1: require('../../assets/images/recipe book covers/rbc1.png'),
  rbc2: require('../../assets/images/recipe book covers/rbc2.png'),
  rbc3: require('../../assets/images/recipe book covers/rbc3.png'),
  rbc4: require('../../assets/images/recipe book covers/rbc4.png'),
  rbc6: require('../../assets/images/recipe book covers/rbc6.png'),
  rbc7: require('../../assets/images/recipe book covers/rbc7.png'),
  rbc8: require('../../assets/images/recipe book covers/rbc8.png'),
  rbc9: require('../../assets/images/recipe book covers/rbc9.png'),
  rbc10: require('../../assets/images/recipe book covers/rbc10.png'),
};

/** Ordered keys for the cover picker grid. */
export const COVER_KEYS = Object.keys(COVER_IMAGES);

export function coverSource(coverKey?: string): ImageSourcePropType | undefined {
  return coverKey ? COVER_IMAGES[coverKey] : undefined;
}
