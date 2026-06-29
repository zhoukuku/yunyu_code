# 云屿学习平台 Electron 问题修复记录

## 常见错误及解决方案

---

## 1. 后端未启动

### 症状
- 前端显示空白
- API 请求失败

### 原因
生产模式下后端服务未启动

### 错误代码
```javascript
// 错误：只在开发模式启动后端
if (getIsDev()) {
  await startBackend();
}
```

### 正确代码
```javascript
// 正确：生产模式也需要启动后端
await startBackend();
```

---

## 2. 静态服务器返回 404

### 症状
- 前端页面空白
- http://localhost:5175 返回 404

### 原因
Windows 路径和 URL 路径解析问题

### 错误代码
```javascript
// 错误：Windows 路径问题
const urlPath = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
let filePath = path.join(distPath, urlPath);
```

### 正确代码
```javascript
// 正确：统一使用正斜杠
let urlPath = req.url.split('?')[0].split('#')[0];
if (urlPath === '/') urlPath = '/index.html';
const safePath = urlPath.replace(/^\//, '').replace(/\//g, path.sep);
let filePath = path.join(distPath, safePath);
```

### 安全检查
```javascript
const normalizedDistPath = path.normalize(distPath);
const normalizedFilePath = path.normalize(filePath);
if (!normalizedFilePath.startsWith(normalizedDistPath)) {
  res.writeHead(403);
  res.end('Forbidden');
  return;
}
```

---

## 3. API URL 配置错误

### 症状
- 登录失败
- 请求发送到错误的 URL

### 原因
Electron 打包后使用 `file://` 协议，无法使用相对路径

### 正确代码
```javascript
// 检测 Electron 环境
const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';

// Electron 模式使用完整 URL
const API_BASE_URL = isElectron
  ? 'http://localhost:3000/api'
  : '/api';
```

---

## 4. 文件打包路径问题

### 症状
- 资源文件未打包
- main.js 版本过旧

### 检查清单
构建后必须验证：
```bash
# 1. main.js 时间戳
ls -la dist-electron/win-unpacked/resources/app/main.js

# 2. index.html 标题
grep "<title>" dist-electron/win-unpacked/resources/app/dist/index.html

# 3. API URL
grep "localhost:3000" dist-electron/win-unpacked/resources/app/dist/assets/index-*.js

# 4. backend node_modules
du -sh dist-electron/win-unpacked/resources/app/backend/node_modules
```

---

## 5. main.js 中路径变量

### distPath 路径
```javascript
// 正确
const distPath = path.join(__dirname, 'dist');

// 不要用这些
const distPath = path.join(__dirname, '..', 'dist');
const distPath = path.join(process.resourcesPath, 'app', 'dist');
```

---

## 6. 端口占用

### 默认端口
- 后端 API: 3000
- 前端静态服务器: 5175
- Vite 开发服务器: 5173/5174

---

## 7. 验证流程

### 构建前必须执行
```bash
# 1. 更新前端
cd frontend-vite && npm run build

# 2. 更新 electron/dist
cd electron
cp ../frontend-vite/dist/* dist/
cp main.js dist/

# 3. 重新构建
npm run build:win

# 4. 复制 node_modules
cp -r backend/node_modules dist-electron/win-unpacked/resources/app/backend/
```

### 验证检查点
```bash
# 必须全部通过
grep "startStaticServer" dist-electron/win-unpacked/resources/app/main.js  # 有静态服务器
grep "localhost:3000" dist-electron/win-unpacked/resources/app/dist/assets/index-*.js  # 有 API URL
grep "<title>云屿学习平台" dist-electron/win-unpacked/resources/app/dist/index.html  # 标题正确
du -sh dist-electron/win-unpacked/resources/app/backend/node_modules  # 有依赖
```

---

## 8. 测试清单

### 启动测试
- [ ] 应用启动无报错
- [ ] 后端 API 正常 (curl localhost:3000/api/courses)
- [ ] 前端页面加载
- [ ] 登录功能正常
- [ ] 课程列表显示

### 命令
```bash
# 后端测试
curl http://localhost:3000/api/courses

# 前端静态服务器测试
curl http://localhost:5175/

# 登录测试
curl -X POST http://localhost:3000/api/account/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"admin"}'
```

---

## 9. 进程清理

构建前必须关闭所有 Electron 进程：
```bash
taskkill /F /IM "云屿学习平台.exe"
taskkill /F /IM "electron.exe"
taskkill /F /IM "node.exe"
```
