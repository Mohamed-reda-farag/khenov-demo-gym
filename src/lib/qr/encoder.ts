/**
 * Small QR Code encoder: byte mode, error correction level M, versions 1 to 10 (up to 213 bytes),
 * no dependencies. Follows ISO/IEC 18004: Reed-Solomon over GF(256), the eight masks and the
 * four penalty rules to pick the best one. The tests compare it with an independent encoder.
 */
export type QrMatrix = boolean[][];

interface VersionInfo {
  totalCodewords: number;
  ecPerBlock: number;
  /** [number of blocks, data codewords per block] for the short and the long block group. */
  groups: [[number, number], [number, number]];
  alignment: number[];
}

/** Level M, versions 1 to 10. */
const VERSIONS: Record<number, VersionInfo> = {
  1: {
    totalCodewords: 26,
    ecPerBlock: 10,
    groups: [
      [1, 16],
      [0, 0],
    ],
    alignment: [],
  },
  2: {
    totalCodewords: 44,
    ecPerBlock: 16,
    groups: [
      [1, 28],
      [0, 0],
    ],
    alignment: [6, 18],
  },
  3: {
    totalCodewords: 70,
    ecPerBlock: 26,
    groups: [
      [1, 44],
      [0, 0],
    ],
    alignment: [6, 22],
  },
  4: {
    totalCodewords: 100,
    ecPerBlock: 18,
    groups: [
      [2, 32],
      [0, 0],
    ],
    alignment: [6, 26],
  },
  5: {
    totalCodewords: 134,
    ecPerBlock: 24,
    groups: [
      [2, 43],
      [0, 0],
    ],
    alignment: [6, 30],
  },
  6: {
    totalCodewords: 172,
    ecPerBlock: 16,
    groups: [
      [4, 27],
      [0, 0],
    ],
    alignment: [6, 34],
  },
  7: {
    totalCodewords: 196,
    ecPerBlock: 18,
    groups: [
      [4, 31],
      [0, 0],
    ],
    alignment: [6, 22, 38],
  },
  8: {
    totalCodewords: 242,
    ecPerBlock: 22,
    groups: [
      [2, 38],
      [2, 39],
    ],
    alignment: [6, 24, 42],
  },
  9: {
    totalCodewords: 292,
    ecPerBlock: 22,
    groups: [
      [3, 36],
      [2, 37],
    ],
    alignment: [6, 26, 46],
  },
  10: {
    totalCodewords: 346,
    ecPerBlock: 26,
    groups: [
      [4, 43],
      [1, 44],
    ],
    alignment: [6, 28, 50],
  },
};

const MAX_VERSION = 10;

function dataCodewords(info: VersionInfo): number {
  const [[a, aData], [b, bData]] = info.groups;
  return a * aData + b * bData;
}

/** How many bytes fit at level M in the given version. */
export function byteCapacity(version: number): number {
  const info = VERSIONS[version];
  if (!info) return 0;
  const countBits = version < 10 ? 8 : 16;
  return Math.floor((dataCodewords(info) * 8 - 4 - countBits) / 8);
}

export function toUtf8(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
    }
  }
  return bytes;
}

// ---- Reed-Solomon over GF(256), polynomial 0x11D ----

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** Error correction codewords for `data`, as used in each block. */
export function reedSolomon(data: number[], degree: number): number[] {
  return remainder(data, divisor(degree));
}

function divisor(degree: number): number[] {
  const result: number[] = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j] ?? 0, root);
      if (j + 1 < degree) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function remainder(data: number[], div: number[]): number[] {
  const result: number[] = new Array<number>(div.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    div.forEach((coef, i) => {
      result[i] = (result[i] ?? 0) ^ gfMultiply(coef, factor);
    });
  }
  return result;
}

// ---- Codewords ----

function dataBits(bytes: number[], version: number, capacityCw: number): number[] {
  const bits: number[] = [];
  const push = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, capacityCw * 8 - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacityCw * 8; pad ^= 0xec ^ 0x11) push(pad, 8);
  return bits;
}

function toBytes(bits: number[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  return bytes;
}

/** Splits into blocks, adds error correction to each and interleaves them. */
function interleave(data: number[], info: VersionInfo): number[] {
  const div = divisor(info.ecPerBlock);
  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  for (const [count, size] of info.groups) {
    for (let i = 0; i < count; i += 1) {
      const chunk = data.slice(offset, offset + size);
      offset += size;
      blocks.push({ data: chunk, ec: remainder(chunk, div) });
    }
  }
  const out: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < longest; i += 1) {
    blocks.forEach((b) => {
      if (i < b.data.length) out.push(b.data[i] ?? 0);
    });
  }
  for (let i = 0; i < info.ecPerBlock; i += 1) blocks.forEach((b) => out.push(b.ec[i] ?? 0));
  return out;
}

// ---- Matrix ----

class Grid {
  readonly size: number;
  readonly modules: boolean[][];
  readonly reserved: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }

  setFunction(x: number, y: number, dark: boolean): void {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    (this.modules[y] as boolean[])[x] = dark;
    (this.reserved[y] as boolean[])[x] = true;
  }

  dark(x: number, y: number): boolean {
    return this.modules[y]?.[x] ?? false;
  }
}

const bit = (value: number, index: number): boolean => ((value >>> index) & 1) !== 0;

function drawFunctionPatterns(grid: Grid, version: number, info: VersionInfo): void {
  const { size } = grid;
  for (let i = 0; i < size; i += 1) {
    grid.setFunction(6, i, i % 2 === 0);
    grid.setFunction(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        grid.setFunction(cx + dx, cy + dy, dist !== 2 && dist !== 4);
      }
    }
  }
  const last = info.alignment.length - 1;
  info.alignment.forEach((cy, i) => {
    info.alignment.forEach((cx, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          grid.setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });
  drawFormat(grid, 0);
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      grid.setFunction(a, b, bit(bits, i));
      grid.setFunction(b, a, bit(bits, i));
    }
  }
}

/** Level M has format bits 00, so the 5 data bits are just the mask number. */
function drawFormat(grid: Grid, mask: number): void {
  const { size } = grid;
  let rem = mask;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((mask << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i += 1) grid.setFunction(8, i, bit(bits, i));
  grid.setFunction(8, 7, bit(bits, 6));
  grid.setFunction(8, 8, bit(bits, 7));
  grid.setFunction(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i += 1) grid.setFunction(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i += 1) grid.setFunction(size - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i += 1) grid.setFunction(8, size - 15 + i, bit(bits, i));
  grid.setFunction(8, size - 8, true);
}

function placeData(grid: Grid, codewords: number[]): void {
  const { size } = grid;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!(grid.reserved[y]?.[x] ?? true) && index < codewords.length * 8) {
          (grid.modules[y] as boolean[])[x] = bit(codewords[index >>> 3] ?? 0, 7 - (index & 7));
          index += 1;
        }
      }
    }
  }
}

function maskApplies(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(grid: Grid, mask: number): void {
  for (let y = 0; y < grid.size; y += 1) {
    for (let x = 0; x < grid.size; x += 1) {
      if (!(grid.reserved[y]?.[x] ?? true) && maskApplies(mask, x, y)) {
        (grid.modules[y] as boolean[])[x] = !grid.dark(x, y);
      }
    }
  }
}

// ---- Penalty (the four rules of the standard) ----

function finderPatterns(history: number[]): number {
  const n = history[1] ?? 0;
  const core =
    n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
  const first = core && (history[0] ?? 0) >= n * 4 && (history[6] ?? 0) >= n ? 1 : 0;
  const second = core && (history[6] ?? 0) >= n * 4 && (history[0] ?? 0) >= n ? 1 : 0;
  return first + second;
}

function addHistory(run: number, history: number[], size: number): void {
  const length = (history[0] ?? 0) === 0 ? run + size : run;
  history.pop();
  history.unshift(length);
}

function linePenalty(read: (i: number) => boolean, size: number): number {
  let result = 0;
  let color = false;
  let run = 0;
  const history = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < size; i += 1) {
    if (read(i) === color) {
      run += 1;
      if (run === 5) result += 3;
      else if (run > 5) result += 1;
    } else {
      addHistory(run, history, size);
      if (!color) result += finderPatterns(history) * 40;
      color = read(i);
      run = 1;
    }
  }
  if (color) {
    addHistory(run, history, size);
    run = 0;
  }
  run += size;
  addHistory(run, history, size);
  return result + finderPatterns(history) * 40;
}

function penalty(grid: Grid): number {
  const { size } = grid;
  let result = 0;
  for (let i = 0; i < size; i += 1) {
    result += linePenalty((x) => grid.dark(x, i), size);
    result += linePenalty((y) => grid.dark(i, y), size);
  }
  let dark = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const color = grid.dark(x, y);
      if (color) dark += 1;
      if (
        x < size - 1 &&
        y < size - 1 &&
        color === grid.dark(x + 1, y) &&
        color === grid.dark(x, y + 1) &&
        color === grid.dark(x + 1, y + 1)
      ) {
        result += 3;
      }
    }
  }
  const total = size * size;
  result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return result;
}

/** Encodes text as a QR Code matrix (`true` is a dark module). Throws when it does not fit. */
export function encodeQr(text: string): QrMatrix {
  const bytes = toUtf8(text);
  let version = 1;
  while (version <= MAX_VERSION && byteCapacity(version) < bytes.length) version += 1;
  const info = VERSIONS[version];
  if (!info) throw new Error(`QR text too long: ${bytes.length} bytes`);

  const codewords = interleave(toBytes(dataBits(bytes, version, dataCodewords(info))), info);
  const grid = new Grid(version * 4 + 17);
  drawFunctionPatterns(grid, version, info);
  placeData(grid, codewords);

  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(grid, mask);
    drawFormat(grid, mask);
    const score = penalty(grid);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    applyMask(grid, mask);
  }
  applyMask(grid, best);
  drawFormat(grid, best);
  return grid.modules.map((row) => [...row]);
}
