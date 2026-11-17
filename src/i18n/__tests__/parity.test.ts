import { describe, expect, it } from 'vitest';

import ar from '../ar.json';
import en from '../en.json';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function keys(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix.replace(PLURAL_SUFFIX, '')];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('translations', () => {
  it('have the same keys in Arabic and English (plural forms aside)', () => {
    const arKeys = [...new Set(keys(ar))].sort();
    const enKeys = [...new Set(keys(en))].sort();
    expect(enKeys).toEqual(arKeys);
  });

  it('Arabic defines every plural category wherever it defines one', () => {
    const flat = keys(ar, '');
    expect(flat.length).toBeGreaterThan(0);
    const raw = JSON.stringify(ar);
    for (const base of raw.match(/"(\w+)_one"/g) ?? []) {
      const name = base.slice(1, -5);
      for (const form of ['zero', 'two', 'few', 'many', 'other']) {
        expect(raw).toContain(`"${name}_${form}"`);
      }
    }
  });
});
