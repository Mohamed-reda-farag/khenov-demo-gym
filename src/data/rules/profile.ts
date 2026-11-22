import type { Language, Localized, Member, ProfileDraft } from '../types';

export type ProfileErrorCode = 'invalid_name_ar' | 'invalid_name_en' | 'invalid_initials';

export class ProfileError extends Error {
  readonly code: ProfileErrorCode;

  constructor(code: ProfileErrorCode) {
    super(code);
    this.name = 'ProfileError';
    this.code = code;
  }
}

const NAME_MIN = 2;
const NAME_MAX = 40;
const FORBIDDEN_IN_NAME = /[0-9٠-٩۰-۹<>{}[\]\\/@#$%^*=+|~_]/;

const squash = (text: string) => text.trim().replace(/\s+/g, ' ');
const length = (text: string) => [...text].length;

function validName(name: string): boolean {
  return length(name) >= NAME_MIN && length(name) <= NAME_MAX && !FORBIDDEN_IN_NAME.test(name);
}

/** Cleans the form. Empty initials mean "make them from the name". */
export function validateProfile(draft: ProfileDraft): {
  name: Localized;
  initials: string | undefined;
} {
  const ar = squash(draft.nameAr);
  const en = squash(draft.nameEn);
  if (!validName(ar)) throw new ProfileError('invalid_name_ar');
  if (!validName(en)) throw new ProfileError('invalid_name_en');
  const initials = draft.initials.trim();
  if (initials !== '' && (length(initials) > 2 || /[\s0-9٠-٩۰-۹]/.test(initials))) {
    throw new ProfileError('invalid_initials');
  }
  return { name: { ar, en }, initials: initials === '' ? undefined : initials };
}

export function autoInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => [...part][0] ?? '')
    .join('');
}

export function initialsOf(member: Pick<Member, 'name' | 'initials'>, language: Language): string {
  return member.initials ?? autoInitials(member.name[language]);
}
