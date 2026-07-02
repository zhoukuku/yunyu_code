import axios from 'axios';
import { history } from '@umijs/max';
import type { ResponseStruct } from './types';

// --- Safe localStorage helpers (inline to avoid cross-project dependency) ---
const memStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return memStore[key] ?? null;
  }
}

function safeRemoveItem(key: string): void {
  delete memStore[key];
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Swallow
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  try {
    const token = safeGetItem('accessToken');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
  } catch (e) {
    // Proceed without auth header
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    // Normalize response shape
    const data = response.data;
    if (data && typeof data === 'object' && 'status' in data) {
      return data;
    }
    return { status: response.status, result: data };
  },
  (error) => {
    if (error.response?.status === 401) {
      safeRemoveItem('accessToken');
      safeRemoveItem('user');
      history.push('/login');
    }
    return Promise.reject(error);
  }
);

export async function login(account: string, password: string) {
  return request<ResponseStruct>('/account/login', {
    method: 'POST',
    data: { account, password },
  });
}

export async function getUserDetail() {
  return request<ResponseStruct>('/user/detail');
}

export async function getClasses() {
  return request<ResponseStruct>('/teacher/class');
}

export async function getHierarchy() {
  return request<ResponseStruct>('/dict/hierarchy');
}

export async function getNotices() {
  return request<ResponseStruct>('/notice');
}

export async function getNoticePopup() {
  return request<ResponseStruct>('/notice/popup');
}

export async function getCourseDetail(id: number) {
  return request<ResponseStruct>(`/courses/${id}`);
}

export async function getCourseLessons(courseId: number) {
  return request<ResponseStruct>(`/courses/${courseId}/lessons`);
}