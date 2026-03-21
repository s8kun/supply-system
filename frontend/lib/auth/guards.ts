import { DASHBOARD_BY_ROLE } from "@/lib/auth/roles";
import type { Role } from "@/types/api";

export function hasAnyRole(currentRole: Role | null, allowedRoles: Role[]) {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}

export function getRoleHome(role: Role | null) {
  if (!role) return "/login";
  return DASHBOARD_BY_ROLE[role] ?? "/";
}

export function isPublicPath(pathname: string) {
  return ["/login", "/register"].includes(pathname);
}
