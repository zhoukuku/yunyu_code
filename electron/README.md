# 云屿学习平台 - Electron 桌面应用

## 构建说明

### 前置要求
- Node.js 18+
- Windows 10+ (64位)

### 一键构建

使用快捷脚本完成所有步骤（安装依赖、构建前后端、打包 Electron）：

```bash
cd electron
scripts/build.bat
```

### 分步构建

#### 1. 安装 Electron 依赖

```bash
cd electron
npm install
```

#### 2. 构建后端

```bash
cd ../backend
npm install
npm run build
cd ../electron
```

#### 3. 构建前端

```bash
cd ../frontend-vite
npm install
npm run build
cd ../electron
```

#### 4. 准备 Electron 资源

后端 `dist/` 输出和 `node_modules` 会被复制到 `electron/backend/`，前端 `dist/` 输出会被复制到 `electron/dist/`。这些目录由 `electron-builder.json` 的 `files` 字段引用，打包时直接打入安装包。

```bash
# 清理并重建 dist（前端）
rm -rf dist
cp -r ../frontend-vite/dist dist/

# 清理并重建 backend
rm -rf backend
mkdir -p backend/dist backend/node_modules
cp -r ../backend/dist backend/
cp ../backend/package.json backend/
cp -r ../backend/node_modules backend/
```

#### 5. 打包 Electron

```bash
npm run build:win
```

### 输出

- 安装包: `dist-electron/云屿学习平台-1.0.0-Setup.exe`
- 免安装版: `dist-electron/win-unpacked/`

## 开发模式

```bash
npm run start
```

实际执行的命令是 `node run-electron.js .`，直接加载本地 Electron 主进程，无需打包即可运行。
