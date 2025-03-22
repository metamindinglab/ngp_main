export const GENRES = [
  'Role-Playing',
  'Fighting',
  'First-Person Shooter',
  'Strategy',
  'Adventure',
  'Simulation',
  'Sports',
  'Racing',
  'Other'
] as const;

export type Genre = typeof GENRES[number]; 