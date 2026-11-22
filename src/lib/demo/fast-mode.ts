import { hasDemoFlag } from './flags';

/** Skips simulated delays (`?demo=fast`). Read once at startup. */
export const FAST_MODE: boolean = hasDemoFlag('fast');
