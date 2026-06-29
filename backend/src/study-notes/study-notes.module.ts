import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyNote } from '../entities/study-note.entity';
import { StudyNotesService } from './study-notes.service';
import { StudyNotesController } from './study-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudyNote])],
  controllers: [StudyNotesController],
  providers: [StudyNotesService],
  exports: [StudyNotesService],
})
export class StudyNotesModule {}
