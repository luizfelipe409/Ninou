export const INTERNAL_ADMIN_FAMILY_ID = 'ninou-family-luizfelipe';

function text(value) {
  return String(value || '').trim().toLowerCase();
}

export function isInternalAdminFamily(familyId, data = {}) {
  const type = text(data.familyType || data.type);
  const label = text(data.customerLabel || data.subtitle || data.title || data.name);
  return String(familyId || '').trim() === INTERNAL_ADMIN_FAMILY_ID
    || data.internalAdminFamily === true
    || data.supportOnly === true
    || text(data.accessMode) === 'support'
    || type === 'internal_admin'
    || label.includes('área técnica')
    || label.includes('area tecnica')
    || label.includes('admin interno');
}
