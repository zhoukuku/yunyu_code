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
  }): Promise<{ notes: StudyNote[]; total: number }> {
    const query = this.studyNoteRepository.createQueryBuilder('note')
      .where('note.userId = :userId', { userId });

    if (filters?.courseId) query.andWhere('note.courseId = :courseId', { courseId: filters.courseId });
    if (filters?.lessonId) query.andWhere('note.lessonId = :lessonId', { lessonId: filters.lessonId });
    if (filters?.tag) {
      // Sanitize LIKE special characters to prevent wildcard injection
      const sanitizedTag = filters.tag
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('note.tags LIKE :tag', { tag: `%${sanitizedTag}%` });
    }
    if (filters?.keyword) {
      // Sanitize LIKE special characters to prevent wildcard injection
      const sanitized = filters.keyword
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('note.title LIKE :keyword', { keyword: `%${sanitized}%` });
    }

    query.orderBy('note.updatedAt', 'DESC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [notes, total] = await query.getManyAndCount();
    return { notes, total };
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
