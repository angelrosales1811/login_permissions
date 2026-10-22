export interface RefreshTokenPayload {
  sub: string;
  uid: string;
  email: string;
  sessionId: string;
  familyId: string;
  type: 'refresh';
}
