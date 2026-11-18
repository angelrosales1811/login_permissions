import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestContextService {
  private userId: string | null = null;

  private ip: string | null = null;

  private applicationId: string | null = null;

  private moduleName: string | null = null;

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

  setApplicationId(applicationId: string | null): void {
    this.applicationId = applicationId;
  }

  getApplicationId(): string | null {
    return this.applicationId;
  }

  setModuleName(moduleName: string | null): void {
    this.moduleName = moduleName;
  }

  getModuleName(): string | null {
    return this.moduleName;
  }

  clear(): void {
    this.userId = null;
    this.ip = null;
    this.applicationId = null;
    this.moduleName = null;
  }
}
