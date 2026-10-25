export interface JwtPayload {
  sub: string;
  uid: string;
  email: string;
  sessionId: string;

  roles?: string[];

  permissions?: Record<string, Record<string, string[]>>;
}
