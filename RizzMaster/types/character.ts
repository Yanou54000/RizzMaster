export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type CharacterProfile = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  avatarKey: string;      // key for the character avatar asset

  personality: {
    archetype: string;    // e.g. "romantic_funny"
    shortBio: string;     // short description for UI + LLM
    tone: string;         // e.g. "playful, teasing, warm"
  };

  flags: {
    green: string[];      // strong positive behaviours
    red: string[];        // negative behaviours
    hardNo: string[];     // deal-breakers (can almost end the date)
  };

  difficulty: {
    level: DifficultyLevel;
    toleranceRed: number;         // max red flags tolerated
    minGreenForSecondDate: number; // min green flags for "Second Date"
  };
};
