import { NINOU_ADMIN_VERSION } from '../config/release';
import {
  INTERNAL_ADMIN_FAMILY_ID,
  isInternalAdminFamily as isInternalAdminFamilyCore,
} from './admin-policy-core.mjs';

export { INTERNAL_ADMIN_FAMILY_ID };
export const ADMIN_APP_VERSION = NINOU_ADMIN_VERSION;

export function isInternalAdminFamily(familyId: string, data: Record<string, unknown> = {}) {
  return isInternalAdminFamilyCore(familyId, data);
}
