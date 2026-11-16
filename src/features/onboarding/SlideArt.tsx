import type { LucideIcon } from '@/components/ui/icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

const SIZE = 280;
const C = SIZE / 2;

/** Small satellites around the ring; angle in degrees differs per slide. */
export function SlideArt({ icon, orbit }: { icon: LucideIcon; orbit: readonly number[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} aria-hidden>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={C} cy={C} r={130} stroke={colors.border} strokeWidth={1.5} fill="none" />
        <Circle
          cx={C}
          cy={C}
          r={98}
          stroke={colors.accent}
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeDasharray="3 9"
          fill="none"
        />
        <Circle cx={C} cy={C} r={68} fill={colors.accentSoft} />
        {orbit.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <Circle
              key={angle}
              cx={C + 130 * Math.cos(rad)}
              cy={C + 130 * Math.sin(rad)}
              r={i === 0 ? 9 : 6}
              fill={i === 0 ? colors.accent : colors.surfaceAlt}
              stroke={colors.border}
              strokeWidth={i === 0 ? 0 : 1.5}
            />
          );
        })}
      </Svg>
      <Icon icon={icon} size={64} color="accentText" strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
});
