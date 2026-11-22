import { describe, expect, it } from 'vitest';

import { ProfileError, autoInitials, initialsOf, validateProfile } from '../profile';

const ok = { nameAr: 'نور مصطفى', nameEn: 'Nour Mostafa', initials: '' };
const codeOf = (fn: () => unknown) => {
  try {
    fn();
    return 'ok';
  } catch (e) {
    return e instanceof ProfileError ? e.code : 'other';
  }
};

describe('editing the profile', () => {
  it('accepts both names, cleans spaces and leaves empty initials automatic', () => {
    expect(
      validateProfile({ nameAr: '  نور   مصطفى ', nameEn: ' Nour  Mostafa ', initials: '  ' }),
    ).toEqual({
      name: { ar: 'نور مصطفى', en: 'Nour Mostafa' },
      initials: undefined,
    });
  });

  it('accepts one or two characters as initials', () => {
    expect(validateProfile({ ...ok, initials: 'NM' }).initials).toBe('NM');
    expect(validateProfile({ ...ok, initials: 'ن' }).initials).toBe('ن');
  });

  it('rejects names that are too short, too long or contain digits and symbols', () => {
    expect(codeOf(() => validateProfile({ ...ok, nameEn: 'N' }))).toBe('invalid_name_en');
    expect(codeOf(() => validateProfile({ ...ok, nameEn: '   ' }))).toBe('invalid_name_en');
    expect(codeOf(() => validateProfile({ ...ok, nameEn: 'N'.repeat(41) }))).toBe(
      'invalid_name_en',
    );
    expect(codeOf(() => validateProfile({ ...ok, nameEn: 'Nour 2' }))).toBe('invalid_name_en');
    expect(codeOf(() => validateProfile({ ...ok, nameAr: 'نور <b>' }))).toBe('invalid_name_ar');
    expect(codeOf(() => validateProfile({ ...ok, nameAr: 'نور ٣' }))).toBe('invalid_name_ar');
  });

  it('rejects initials that are too long or contain digits or spaces', () => {
    expect(codeOf(() => validateProfile({ ...ok, initials: 'NMX' }))).toBe('invalid_initials');
    expect(codeOf(() => validateProfile({ ...ok, initials: 'N1' }))).toBe('invalid_initials');
    expect(codeOf(() => validateProfile({ ...ok, initials: 'N M' }))).toBe('invalid_initials');
  });
});

describe('initials', () => {
  it('come from the first two words unless the member set them', () => {
    expect(autoInitials('Nour Mostafa Ali')).toBe('NM');
    expect(autoInitials('نور مصطفى')).toBe('نم');
    expect(autoInitials('Nour')).toBe('N');
    const member = { name: { ar: 'نور مصطفى', en: 'Nour Mostafa' } };
    expect(initialsOf(member, 'en')).toBe('NM');
    expect(initialsOf({ ...member, initials: 'X' }, 'ar')).toBe('X');
  });
});
