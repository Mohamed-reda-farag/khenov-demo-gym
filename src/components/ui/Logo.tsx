import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

/** The Nabd pulse mark, drawn from the same points as the app icon. */
export function Logo({ size = 96 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" aria-label="Nabd">
      <Path
        d="M190 560 L380 560 L450 370 L560 730 L650 470 L710 560 L834 560"
        stroke={colors.accent}
        strokeWidth={76}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={190} cy={560} r={38} fill={colors.accent} />
      <Circle cx={834} cy={560} r={38} fill={colors.accent} />
    </Svg>
  );
}
