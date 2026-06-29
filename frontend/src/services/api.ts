import axios from 'axios';
import { history } from '@umijs/max';
import type { ResponseStruct } from './types';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
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