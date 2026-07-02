import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role, RoleLabels } from '../../auth/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      const roleNames = requiredRoles
        .map((r) => RoleLabels[r] || `Role[${r}]`)
        .join('、');
      throw new ForbiddenException(`没有权限访问此接口，需要以下角色之一: ${roleNames}`);
    }

    return true;
  }
}
