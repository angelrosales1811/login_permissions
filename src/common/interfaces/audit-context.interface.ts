export interface AuditContext {
  userId: string | null;

  ip: string | null;

  applicationId: string | null;

  now: Date;
}
