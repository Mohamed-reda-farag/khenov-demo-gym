import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { encodeQr } from '@/lib/qr/encoder';
import { qr } from '@/theme';

const QUIET_ZONE = 4;

interface QrCodeProps {
  value: string;
  size: number;
  /** Spoken description. The code itself means nothing to a screen reader. */
  label: string;
}

/**
 * One path for the whole code: each horizontal run of dark modules is a single rectangle. Rows
 * overlap by a hair so no seam shows between them when the code is scaled.
 */
function pathOf(matrix: boolean[][]): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end += 1;
      parts.push(`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${end - x}v1.02h-${end - x}z`);
      x = end;
    }
  });
  return parts.join('');
}

/** Drawn dark on white in every theme and never mirrored, so it scans the same in Arabic. */
export function QrCode({ value, size, label }: QrCodeProps) {
  const { d, total } = useMemo(() => {
    const matrix = encodeQr(value);
    return { d: pathOf(matrix), total: matrix.length + QUIET_ZONE * 2 };
  }, [value]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.box, { width: size, height: size }]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} aria-hidden>
        <Path d={d} fill={qr.dark} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: qr.light, direction: 'ltr' },
});
