export enum Role {
  ADMIN = 1,
  TEACHER = 2,
  STUDENT = 3,
  PARENT = 4,
}

export const RoleLabels: Record<Role, string> = {
  [Role.ADMIN]: '管理员',
  [Role.TEACHER]: '教师',
  [Role.STUDENT]: '学生',
  [Role.PARENT]: '家长',
};