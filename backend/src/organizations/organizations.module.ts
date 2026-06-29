import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Organization } from '../entities/organization.entity';
import { OrganizationClass } from '../entities/organization-class.entity';
import { Student } from '../entities/student.entity';
import { ClassEntity } from '../entities/class.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationClass, Student, ClassEntity]),
    AuthModule,
  ],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}