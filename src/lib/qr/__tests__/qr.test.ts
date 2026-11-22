import { describe, expect, it } from 'vitest';

import { byteCapacity, encodeQr, reedSolomon, toUtf8 } from '../encoder';

import { QR_VECTORS } from './vectors';

const asRows = (matrix: boolean[][]) =>
  matrix.map((row) => row.map((m) => (m ? '1' : '0')).join(''));

describe('QR encoder reproduces recorded, scan-verified matrices', () => {
  for (const [name, vector] of Object.entries(QR_VECTORS)) {
    it(`${name} (version ${vector.version})`, () => {
      expect(asRows(encodeQr(vector.text))).toEqual(vector.rows);
    });
  }
});

describe('QR encoder basics', () => {
  it('computes the published error correction codewords for version 1-M', () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    expect(reedSolomon(data, 10)).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });

  it('uses the smallest version that fits', () => {
    expect(encodeQr('A')).toHaveLength(21);
    expect(encodeQr('x'.repeat(14))).toHaveLength(21);
    expect(encodeQr('x'.repeat(15))).toHaveLength(25);
    expect(encodeQr('x'.repeat(byteCapacity(10)))).toHaveLength(57);
  });

  it('reports the standard byte capacities at level M', () => {
    expect([1, 2, 3, 4, 5].map(byteCapacity)).toEqual([14, 26, 42, 62, 84]);
    expect(byteCapacity(10)).toBe(213);
  });

  it('refuses text that does not fit', () => {
    expect(() => encodeQr('x'.repeat(byteCapacity(10) + 1))).toThrow(/too long/);
  });

  it('is deterministic and square', () => {
    const a = encodeQr('NABD:PASS:NBD-4827-1953:20261121');
    expect(asRows(a)).toEqual(asRows(encodeQr('NABD:PASS:NBD-4827-1953:20261121')));
    expect(a.every((row) => row.length === a.length)).toBe(true);
  });

  it('has the three finder patterns', () => {
    const m = encodeQr('check-in');
    const n = m.length;
    for (const [x, y] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ] as const) {
      expect(m[y]![x]).toBe(true);
      expect(m[y + 1]![x + 1]).toBe(false);
      expect(m[y + 3]![x + 3]).toBe(true);
      expect(m[y + 6]![x + 6]).toBe(true);
    }
  });

  it('encodes text as UTF-8', () => {
    expect(toUtf8('A')).toEqual([0x41]);
    expect(toUtf8('é')).toEqual([0xc3, 0xa9]);
    expect(toUtf8('نبض')).toHaveLength(6);
    expect(toUtf8('😀')).toEqual([0xf0, 0x9f, 0x98, 0x80]);
  });
});
