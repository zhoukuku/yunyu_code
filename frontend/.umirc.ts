import { defineConfig } from '@umijs/max';

export default defineConfig({
  routes: [
    {
      path: '/',
      component: '@/layouts/index',
      routes: [
        { path: '/', component: 'home/index' },
        { path: '/login', component: 'login/index' },
        { path: '/class', component: 'class/index' },
        { path: '/courses', component: 'courses/index' },
        { path: '/courses/:id', component: 'course-detail/index' },
        { path: '/admin', component: 'admin/index' },
        { path: '/ide/:id?', component: 'ide/index' },
      ],
    },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
});