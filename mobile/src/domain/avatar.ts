export const avatarIds = [
  'avatar-01', 'avatar-02', 'avatar-03', 'avatar-04',
  'avatar-05', 'avatar-06', 'avatar-07', 'avatar-08',
  'avatar-09', 'avatar-10', 'avatar-11', 'avatar-12',
] as const;

export type AvatarId = typeof avatarIds[number];

export const avatarLabels: Record<AvatarId, string> = {
  'avatar-01': 'Bebê clássico',
  'avatar-02': 'Castanho',
  'avatar-03': 'Laço',
  'avatar-04': 'Cacheado',
  'avatar-05': 'Ondulado',
  'avatar-06': 'Loirinha',
  'avatar-07': 'Cacheadinho',
  'avatar-08': 'Ruivinho',
  'avatar-09': 'Touca',
  'avatar-10': 'Tiara',
  'avatar-11': 'Raspadinho',
  'avatar-12': 'Cabelo preto',
};

export function normalizeAvatarId(value: unknown): AvatarId {
  return avatarIds.includes(value as AvatarId) ? value as AvatarId : 'avatar-01';
}
