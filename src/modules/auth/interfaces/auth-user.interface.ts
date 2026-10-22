export interface AuthUser {
  id: string;
  uid: string;
  email: string;
  sessionId: string;

  roles: string[];
}
