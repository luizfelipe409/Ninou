export type FamilyRole = 'owner' | 'admin' | 'caregiver' | 'viewer';

export const GLOBAL_APP_ADMIN_EMAIL = 'luizfelipe.dasilva@gmail.com';

export function isGlobalAppAdminEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase() === GLOBAL_APP_ADMIN_EMAIL;
}

const roleAliases: Record<string, FamilyRole> = {
  owner: 'owner',
  proprietario: 'owner',
  'proprietário': 'owner',
  titular: 'owner',
  responsavel_principal: 'owner',
  'responsável_principal': 'owner',
  admin: 'admin',
  global_admin: 'admin',
  admin_global: 'admin',
  admin_familiar: 'admin',
  administrador_familiar: 'admin',
  responsavel: 'admin',
  'responsável': 'admin',
  familiar_admin: 'admin',
  pai: 'admin',
  mae: 'admin',
  'mãe': 'admin',
  caregiver: 'caregiver',
  cuidador: 'caregiver',
  leitura: 'viewer',
  viewer: 'viewer',
  visualizador: 'viewer',
  visualizacao: 'viewer',
  'visualização': 'viewer',
  somente_leitura: 'viewer',
  read_only: 'viewer',
};

export function normalizeFamilyRole(value?: string | null): FamilyRole {
  const normalized = String(value || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  return roleAliases[normalized] || 'viewer';
}

export function canManageFamily(role?: string | null) {
  return ['owner', 'admin'].includes(normalizeFamilyRole(role));
}

export function canEditFamilyProfile(role?: string | null) {
  return canManageFamily(role);
}

export function canExportFamilyReports(role?: string | null) {
  return ['owner', 'admin', 'caregiver'].includes(normalizeFamilyRole(role));
}

export function familyRoleLabel(role?: string | null) {
  const normalized = normalizeFamilyRole(role);
  if (normalized === 'owner') return 'Responsável principal';
  if (normalized === 'admin') return 'Administrador familiar';
  if (normalized === 'caregiver') return 'Cuidador familiar';
  return 'Visualizador familiar';
}

export function normalizeInviteRole(role?: string | null) {
  return normalizeFamilyRole(role) === 'admin' ? 'admin_familiar' : 'cuidador';
}
