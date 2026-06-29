import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { StudyNote } from '../entities/study-note.entity';

@Injectable()
export class StudyNotesService {
  constructor(
    @InjectRepository(StudyNote)
    private studyNoteRepository: Repository<StudyNote>,
  ) {}

  async create(userId: number, data: {
    title: string;
    content: string;
    courseId?: number;
    lessonId?: number;
    tags?: string;
    isPublic?: boolean;
  }): Promise<StudyNote> {
    const note = new StudyNote();
    note.userId = userId;
    note.title = data.title;
    note.content = data.content;
    note.courseId = data.courseId || null;
    note.lessonId = data.lessonId || null;
    note.tags = data.tags || '';
    note.isPublic = data.isPublic || false;
    return this.studyNoteRepository.save(note);
  }

  async findAll(userId: number, filters?: {
    courseId?: number;
    lessonId?: number;
    tag?: string;
    keyword?: string;
  }): Promise<StudyNote[]> {
    const where: any = { userId };
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.lessonId) where.lessonId = filters.lessonId;
    if (filters?.tag) where.tags = Like(`%${filters.tag}%`);
    if (filters?.keyword) {
      where.title = Like(`%${filters.keyword}%`);
    }
    return this.studyNoteRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<StudyNote | null> {
    return this.studyNoteRepository.findOne({ where: { id } });
  }

  async update(id: number, userId: number, data: Partial<{
    title: string;
    content: string;
    courseId: number;
    lessonId: number;
    tags: string;
    isPublic: boolean;
  }>): Promise<StudyNote | null> {
    const note = await this.studyNoteRepository.findOne({ where: { id, userId } });
    if (!note) return null;
    Object.assign(note, data);
    return this.studyNoteRepository.save(note);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.studyNoteRepository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async findByCourse(courseId: number): Promise<StudyNote[]> {
    return this.studyNoteRepository.find({
      where: { courseId, isPublic: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findByLesson(lessonId: number): Promise<StudyNote[]> {
    return this.studyNoteRepository.find({
      where: { lessonId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getNotesByUser(userId: number): Promise<StudyNote[]> {
    return this.studyNoteRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async count(userId: number): Promise<number> {
    return this.studyNoteRepository.count({ where: { userId } });
  }
}
