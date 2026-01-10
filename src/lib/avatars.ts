/**
 * NoirNote — Avatar System
 *
 * Defines available avatars for user profile
 */

export type AvatarOption = {
  id: string;
  emoji: string;
  label: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "detective1", emoji: "🔍", label: "Dedektif" },
  { id: "detective2", emoji: "🕵️", label: "Dedektif" },
  { id: "detective3", emoji: "🕵️‍♂️", label: "Dedektif" },
  { id: "detective4", emoji: "🕵️‍♀️", label: "Dedektif" },
  { id: "person1", emoji: "👤", label: "Kişi" },
  { id: "person2", emoji: "👨", label: "Erkek" },
  { id: "person3", emoji: "👩", label: "Kadın" },
  { id: "person4", emoji: "🧑", label: "Kişi" },
  { id: "mask1", emoji: "🎭", label: "Maske" },
  { id: "mask2", emoji: "🦹", label: "Süper Kötü" },
  { id: "mask3", emoji: "🦸", label: "Süper Kahraman" },
  { id: "hat1", emoji: "🎩", label: "Şapka" },
  { id: "hat2", emoji: "🧢", label: "Şapka" },
  { id: "glasses1", emoji: "🥽", label: "Gözlük" },
  { id: "glasses2", emoji: "👓", label: "Gözlük" },
];

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0];

/**
 * Get avatar by ID, returns default if not found
 */
export function getAvatarById(id: string | null | undefined): AvatarOption {
  if (!id) return DEFAULT_AVATAR;
  return AVATAR_OPTIONS.find((a) => a.id === id) || DEFAULT_AVATAR;
}

/**
 * Get avatar emoji by ID, returns default emoji if not found
 */
export function getAvatarEmoji(id: string | null | undefined): string {
  return getAvatarById(id).emoji;
}
