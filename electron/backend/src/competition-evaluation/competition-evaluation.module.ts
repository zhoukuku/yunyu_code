import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionEvaluation, CompetitionSubmission } from '../entities/competition-evaluation.entity';
import { Problem } from '../entities/problem.entity';
import { CompetitionEvaluationService } from './competition-evaluation.service';
import { CompetitionEvaluationController } from './competition-evaluation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompetitionEvaluation, CompetitionSubmission, Problem])],
  providers: [CompetitionEvaluationService],
  controllers: [CompetitionEvaluationController],
  exports: [CompetitionEvaluationService],
})
export class CompetitionEvaluationModule {}