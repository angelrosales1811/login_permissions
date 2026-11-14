export interface AuditContext {
  userId: string | null;

  ip: string | null;

  now: Date;
}
