export type StrengthLevel = 'Too Weak' | 'Weak' | 'Fair' | 'Strong' | 'Excellent';

export interface PasswordCriteria {
  label: string;
  met: boolean;
  description: string;
}

export interface StrengthResult {
  score: number; // 0 to 100
  label: StrengthLevel;
  color: string;
  entropy: number;
  suggestions: string[];
  crackTime?: string;
}

export interface HistoryItem {
  id: string;
  password: string;
  bits: number;
  strength: StrengthLevel;
  timestamp: string;
}

export interface UserPreferences {
  autoCheck: boolean;
  darkMode: boolean;
  notifications: boolean;
  hardenedMode: boolean;
  lastSynced: string | null;
}
