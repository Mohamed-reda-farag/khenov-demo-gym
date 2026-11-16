import { useLanguage } from '.';

export interface Direction {
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  /** +1 in LTR, -1 in RTL. Multiply physical translateX values by this. */
  sign: 1 | -1;
}

/**
 * The app language decides the layout direction on every platform. The root view applies it
 * with the `direction` style, so switching language mirrors the layout instantly, no restart.
 */
export function useDirection(): Direction {
  const isRTL = useLanguage() === 'ar';
  return { isRTL, dir: isRTL ? 'rtl' : 'ltr', sign: isRTL ? -1 : 1 };
}
