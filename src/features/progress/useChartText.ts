import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { summarize } from './chartMath';

export interface ChartText {
  trend: string;
  summary: string;
  /** Everything together, for screen readers. */
  label: string;
}

/** Words that describe a chart without seeing it: trend, latest, lowest, highest. */
export function useChartText() {
  const { t } = useTranslation();
  return useCallback(
    (title: string, values: number[], format: (value: number) => string): ChartText | null => {
      const s = summarize(values);
      if (!s) return null;
      const trend =
        s.trend === 'flat'
          ? t('progress.chart.trendFlat')
          : t(s.trend === 'up' ? 'progress.chart.trendUp' : 'progress.chart.trendDown', {
              delta: format(Math.abs(s.delta)),
            });
      const summary = t('progress.chart.summary', {
        latest: format(s.latest),
        min: format(s.min),
        max: format(s.max),
      });
      return { trend, summary, label: t('progress.chart.a11y', { title, trend, summary }) };
    },
    [t],
  );
}
