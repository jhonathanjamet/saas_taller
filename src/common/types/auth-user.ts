export type AuthUser = {
  id: string;
  tenantId?: string | null;
  roleId: string;
  email: string;
};
