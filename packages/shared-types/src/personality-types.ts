/**
 * Personality types for agent configuration
 * Shared across client, admin, and API
 */

export const PERSONALITY_TYPES = [
  'Analytical',
  'Creative',
  'Practical',
  'Empathetic',
  'Adventurous',
  'Cautious',
  'Optimistic',
  'Realistic',
  'Introverted',
  'Extroverted',
  'Assertive',
  'Reserved',
  'Humorous',
  'Serious',
  'Spontaneous',
  'Planned',
] as const;

export type PersonalityType = (typeof PERSONALITY_TYPES)[number];
