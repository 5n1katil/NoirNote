/**
 * NoirNote — Oyun tip tanımları
 *
 * Case (Vaka) sisteminin temel tipleri.
 */

export type Suspect = {
  id: string;
  nameKey: string;
  iconKey: string; // Text key for icon/emoji
  bioKey?: string; // Text key for biography/background
};

export type Location = {
  id: string;
  nameKey: string;
  iconKey: string; // Text key for icon/emoji
  descriptionKey?: string; // Text key for location description
};

export type Weapon = {
  id: string;
  nameKey: string;
  iconKey: string; // Text key for icon/emoji
  descriptionKey?: string; // Text key for weapon/tool description
};

export type Case = {
  id: string;
  titleKey: string;
  difficulty: "easy" | "medium" | "hard";
  briefingKey: string; // Text key for case briefing
  suspects: Suspect[];
  locations: Location[];
  weapons: Weapon[];
  clues: string[]; // Text keys
  solution: {
    suspectId: string;
    locationId: string;
    weaponId: string;
  };
};

export type PlayerResult = {
  caseId: string;
  durationSeconds: number;
  attempts: number;
  completedAt: number; // Timestamp
};

