import type { ImageSourcePropType } from 'react-native';

/** The fitted illustration for each wizard step (1–5). */
export const STEP_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../../../assets/images/manual recipe steps/details step 1.png'),
  2: require('../../../../assets/images/manual recipe steps/extra data step 2.png'),
  3: require('../../../../assets/images/manual recipe steps/ingredients step 3.png'),
  4: require('../../../../assets/images/manual recipe steps/preps step 4.png'),
  5: require('../../../../assets/images/manual recipe steps/validation step 5.png'),
};
