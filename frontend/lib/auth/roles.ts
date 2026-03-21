import type { Role } from "@/types/api";

export const ROLES: Record<string, Role> = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  CUSTOMER: "customer",
} as const;

export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  admin: "/customers",
  supervisor: "/products",
  customer: "/",
};
