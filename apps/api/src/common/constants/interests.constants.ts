export const INTERESTS = [
  'Sports',
  'Music',
  'Travel',
  'Reading',
  'Cooking',
  'Gaming',
  'Photography',
  'Fitness',
  'Art',
  'Technology',
  'Movies',
  'Nature',
  'Fashion',
  'Writing',
  'Science',
  'History',
  'Languages',
  'Pets',
  'Meditation',
  'Cars',
] as const;

export type Interest = (typeof INTERESTS)[number];
