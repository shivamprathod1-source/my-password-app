import zxcvbn from 'zxcvbn';
import { StrengthResult, StrengthLevel } from '../types';

export const estimateCrackTime = (password: string): string => {
  if (!password) return 'Instantly';
  const result = zxcvbn(password);
  const guesses = result.guesses;
  
  // Rate: 100 billion guesses per second
  const guessesPerSecond = 100_000_000_000;
  const seconds = guesses / guessesPerSecond;
  
  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return 'Seconds';
  if (seconds < 3600) return 'Minutes';
  if (seconds < 86400) return 'Hours';
  if (seconds < 31536000) return 'Days';
  if (seconds <= 3153600000) return 'Years'; // Up to 100 years
  return 'Centuries';
};

export const calculateStrength = (password: string, hardened: boolean = false): StrengthResult => {
  if (!password) {
    return {
      score: 0,
      label: 'Too Weak',
      color: 'bg-zinc-200',
      entropy: 0,
      suggestions: ['Start typing to analyze strength']
    };
  }

  const result = zxcvbn(password);
  const entropy = result.guesses_log10 * 3.322; // Convert log10 to log2 (bits) approx
  
  // zxcvbn score is 0-4
  // We map this to our 0-100 scale
  let score = (result.score / 4) * 100;
  
  // Apply hardening factor if needed (shift standard scores down)
  if (hardened && result.score < 4) {
    score = score * 0.7;
  }

  const labelMap: StrengthLevel[] = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  let label = labelMap[result.score];
  
  // Overwrite label if hardened mode is strict
  if (hardened && result.score === 3 && entropy < 80) {
    label = 'Fair';
  }

  const colorMap = {
    'Too Weak': 'bg-red-500',
    'Weak': 'bg-orange-500',
    'Fair': 'bg-yellow-500',
    'Strong': 'bg-blue-500',
    'Excellent': 'bg-emerald-500'
  };

  const suggestions = [...result.feedback.suggestions];
  if (result.feedback.warning) suggestions.unshift(result.feedback.warning);
  
  const minLength = hardened ? 16 : 12;
  if (password.length < minLength) suggestions.push(`Increase length to at least ${minLength} characters`);

  return { 
    score, 
    label, 
    color: colorMap[label], 
    entropy, 
    suggestions,
    crackTime: estimateCrackTime(password)
  };
};

export const calculateVisualStrength = (password: string, hardened: boolean = false) => {
  const result = calculateStrength(password, hardened);
  return {
    percentage: result.score,
    label: result.label,
    color: result.label === 'Excellent' ? '#10B981' : 
           result.label === 'Strong' ? '#3B82F6' :
           result.label === 'Fair' ? '#EAB308' :
           result.label === 'Weak' ? '#F97316' : '#EF4444'
  };
};

export const generatePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let retVal = "";
  const crypto = window.crypto;
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < length; ++i) {
    retVal += charset.charAt(values[i] % charset.length);
  }
  return retVal;
};
