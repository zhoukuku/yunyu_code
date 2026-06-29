# 云屿学习平台

编程教育桌面应用

## 项目结构

```
project01/
├── docs/                    # 文档
│   ├── README.md            # 项目说明
│   ├── FEATURES_STATUS.md   # 功能状态
│   ├── C++_SETUP_GUIDE.md  # C++配置指南
│   └── screenshots/         # 截图
├── backend/                 # NestJS 后端
├── frontend/                # React + UmiJS 前端 (旧版)
├── frontend-vite/          # React + Vite 前端 (新版)
├── electron/               # Electron 桌面应用
│   ├── output/             # 构建输出
│   │   ├── win-unpacked/   # 免安装版
│   │   └── *.exe          # 安装包
│   └── build/              # 图标资源
├── scripts/                # 工具脚本
└── logs/                   # 日志文件
```

## 快速启动

### 桌面应用 (Electron) ⭐

**免安装版 (直接运行):**
```
electron\output\win-unpacked\云屿学习平台.exe
```

**安装包:**
```
electron\output\云屿学习平台-1.0.0-Setup.exe
```

### Web 开发

1. 启动后端
```bash
cd backend
npm install
npm run seed
npm run start:dev
```

2. 启动前端
```bash
cd frontend-vite
npm install
npm run dev
```

## 测试账号

```
账号: admin
密码: admin
```

## 功能模块

| 模块 | 状态 |
|------|------|
| Scratch IDE | ✅ |
| Python 编辑器 | ✅ |
| C++ 编辑器 | ✅ |
| 课程中心 | ✅ |
| 作业考试 | ✅ |
| 用户管理 | ✅ |

## 技术栈

- 后端: NestJS + TypeORM + SQLite
- 前端: React 18 + Vite + Ant Design
- 桌面: Electron 28

## 注意事项

1. C++ 编译器需要 MinGW-w64
2. Scratch IDE 需要网络加载 Blockly 库
