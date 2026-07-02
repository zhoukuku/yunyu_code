import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeExecution } from '../entities/code-execution.entity';
import { CodeExecutionService } from './code-execution.service';
import { CodeExecutionController } from './code-execution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CodeExecution])],
  controllers: [CodeExecutionController],
  providers: [CodeExecutionService],
  exports: [CodeExecutionService],
})
export class CodeExecutionModule {}