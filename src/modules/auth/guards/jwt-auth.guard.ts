import { ExecutionContext, Injectable } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { RequestContextService } from '../../../common/context/request-context.service';

import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly requestContextService: RequestContextService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
    }>();

    const user = request.user;

    if (user) {
      this.requestContextService.setUserId(user.id);
    }

    return result;
  }
}
