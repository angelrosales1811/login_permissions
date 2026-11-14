export interface AuditableEntity {
  created_by?: string | null;

  created_at?: Date | null;

  updated_by?: string | null;

  updated_at?: Date | null;

  ip_creation?: string | null;

  ip_update?: string | null;
}
