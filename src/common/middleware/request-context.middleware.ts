import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

import { RequestContextService } from '../context/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    this.requestContextService.clear();

    const forwarded = request.headers['x-forwarded-for'];

    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : (request.ip ?? request.socket.remoteAddress ?? null);

    this.requestContextService.setIp(ip);

    next();
  }
}
