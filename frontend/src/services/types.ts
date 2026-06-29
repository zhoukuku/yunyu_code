export interface ResponseStruct<T = any> {
  status: number;
  result: T;
}

export interface User {
  id: number;
  username: string;
  account: string;
  name: string;
  avatar: string;
  userType: number;
  sex?: number;
  nickname?: string;
}

export interface ClassEntity {
  id: number;
  className: string;
  teacherId?: number;
  lastCourseName: string;
  studentNum: number;
  totalCourseNum: number;
  hadCourseNum: number;
  isEnd: number;
}

export interface Hierarchy {
  id: number;
  hierarchyId: string;
  hierarchyName: string;
  standardClassifyId: string;
  standardClassifyName: string;
  themeClassifyId: string;
  themeClassifyName: string;
}

export interface Notice {
  id: number;
  noticeId: string;
  title: string;
  content: string;
  noticeType: string;
  popupType: number;
  contentType: number;
  sendTime: number;
  popupStartTime?: number;
  popupEndTime?: number;
  isRead: number;
}

export interface Course {
  id: number;
  courseName: string;
  hierarchyId: string;
  description?: string;
  coverImage?: string;
  totalLessons: number;
  completedLessons: number;
  duration: number;
  difficulty: number;
  teacher?: string;
  studentCount: number;
  price: number;
  status: number;
}

export interface Lesson {
  id: number;
  courseId: number;
  lessonName: string;
  lessonOrder: number;
  videoUrl?: string;
  content?: string;
  duration: number;
  isCompleted: number;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}