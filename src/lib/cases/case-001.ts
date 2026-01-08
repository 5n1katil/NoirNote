/**
 * NoirNote — Case 001: Müze Soygunu
 *
 * Detailed case content definition for case-001
 */

import type { Case } from "@/types/game";

export const case001: Case = {
  id: "case-001",
  titleKey: "cases.case001.title",
  difficulty: "easy",
  briefingKey: "cases.case001.briefing",
  suspects: [
    {
      id: "suspect-001",
      nameKey: "suspects.suspect001",
      iconKey: "suspects.icon001",
      bioKey: "suspects.bio001",
    },
    {
      id: "suspect-002",
      nameKey: "suspects.suspect002",
      iconKey: "suspects.icon002",
      bioKey: "suspects.bio002",
    },
    {
      id: "suspect-003",
      nameKey: "suspects.suspect003",
      iconKey: "suspects.icon003",
      bioKey: "suspects.bio003",
    },
  ],
  locations: [
    {
      id: "location-001",
      nameKey: "locations.location001",
      iconKey: "locations.icon001",
      descriptionKey: "locations.desc001",
    },
    {
      id: "location-002",
      nameKey: "locations.location002",
      iconKey: "locations.icon002",
      descriptionKey: "locations.desc002",
    },
    {
      id: "location-003",
      nameKey: "locations.location003",
      iconKey: "locations.icon003",
      descriptionKey: "locations.desc003",
    },
  ],
  weapons: [
    {
      id: "weapon-001",
      nameKey: "weapons.weapon001",
      iconKey: "weapons.icon001",
      descriptionKey: "weapons.desc001",
    },
    {
      id: "weapon-002",
      nameKey: "weapons.weapon002",
      iconKey: "weapons.icon002",
      descriptionKey: "weapons.desc002",
    },
    {
      id: "weapon-003",
      nameKey: "weapons.weapon003",
      iconKey: "weapons.icon003",
      descriptionKey: "weapons.desc003",
    },
  ],
  clues: [
    "cases.case001.clues.clue1",
    "cases.case001.clues.clue2",
    "cases.case001.clues.clue3",
    "cases.case001.clues.clue4",
    "cases.case001.clues.clue5",
  ],
  solution: {
    suspectId: "suspect-003", // Cem Aras
    locationId: "location-001", // Ana Galeri
    weaponId: "weapon-001", // Cam Kesici
  },
};

