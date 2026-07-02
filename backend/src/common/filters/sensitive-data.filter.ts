import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => this.removeSensitiveData(data))
    );
  }

  private removeSensitiveData<T>(obj: T): T {
    return this._removeSensitiveData(obj) as T;
  }

  private _removeSensitiveData(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // If it's an array, process each element
    if (Array.isArray(obj)) {
      return obj.map((item) => this._removeSensitiveData(item));
    }

    // If it's a plain object, remove sensitive fields
    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const sensitiveFields = [
        'password',
        'passwordHash',
        'resetPasswordToken',
        'resetPasswordExpires',
        'emailVerifyToken',
        'emailVerifyExpires',
        '__v',
      ];

      const result: Record<string, unknown> = {};
      const objAsRecord = obj as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (sensitiveFields.includes(key)) {
          continue; // Skip sensitive fields
        }
        result[key] = this._removeSensitiveData(objAsRecord[key]);
      }
      return result;
    }

    return obj;
  }
}