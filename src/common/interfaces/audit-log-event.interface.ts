import { AUDIT_ACTIONS } from '../constants/audit-actions.constant';

export interface AuditLogEvent {
  action: (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

  moduleName: string;

  entityName?: string;

  recordId?: string;

  applicationId?: string;

  userId?: string;

  oldValues?: Record<string, unknown> | Record<string, unknown>[];

  newValues?: Record<string, unknown> | Record<string, unknown>[];

  success?: boolean;
}
