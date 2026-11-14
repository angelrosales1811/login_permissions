import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestContextService {
  private userId: string | null = null;

  private ip: string | null = null;

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  setIp(ip: string | null): void {
    this.ip = ip;
  }

  getIp(): string | null {
    return this.ip;
  }

  clear(): void {
    this.userId = null;

    this.ip = null;
  }
}
