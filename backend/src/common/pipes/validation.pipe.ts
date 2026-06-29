import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((err) => {
        const constraints = err.constraints;
        if (constraints) {
          return Object.values(constraints).join(', ');
        }
        return 'Validation error';
      });

      throw new BadRequestException({
        message: messages,
        errorCode: 'VALIDATION_ERROR',
        errors: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
          value: err.value,
        })),
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}