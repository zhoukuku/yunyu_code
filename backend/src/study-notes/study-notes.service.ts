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
    note.courseId = data.courseId ?? null;
    note.lessonId = data.lessonId ?? null;
    note.tags = data.tags || '';
    note.isPublic = data.isPublic || false;
    return this.studyNoteRepository.save(note);
  }

  async findAll(userId: number, filters?: {
    courseId?: number;
    lessonId?: number;
    tag?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ records: StudyNote[]; total: number; current: number; size: number; pages: number }> {
    const where: any = { userId };
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.lessonId) where.lessonId = filters.lessonId;
    if (filters?.tag) {
      const sanitizedTag = filters.tag
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      where.tags = Like(`%${sanitizedTag}%`);
    }
    if (filters?.keyword) {
      const sanitized = filters.keyword
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      where.title = Like(`%${sanitized}%`);
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const [records, total] = await this.studyNoteRepository.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      records,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number, userId?: number): Promise<StudyNote | null> {
    const where: any = { id };
    // If userId is provided, only return the note if the user owns it OR it is public
    if (userId) {
      // Use a query builder for OR condition
      return this.studyNoteRepository
        .createQueryBuilder('note')
        .where('note.id = :id', { id })
        .andWhere('(note.userId = :userId OR note.isPublic = :isPublic)', { userId, isPublic: true })
        .getOne();
    }
    // Without userId, only return public notes
    where.isPublic = true;
    return this.studyNoteRepository.findOne({ where });
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
      where: { lessonId, isPublic: true },
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
