# MoveLicense

一个自动整理 Electron 应用许可证文件的 npm 包。

## 安装

```bash
npm install movelicense --save-dev
```

安装后会自动配置您的 Electron 项目，无需额外操作！

## 使用方法

### 自动配置（推荐）

安装后包会自动：
1. 检测是否为 Electron 项目
2. 在 `package.json` 中添加 `afterPack` 钩子
3. 复制 `moveLicense.js` 到项目根目录

### 手动配置

```bash
# 在项目根目录运行
npx movelicense

# 强制重新配置
npx movelicense --force

# 清理配置
npx movelicense --clean
```

### 效果

打包前:
```
app/
├── LICENSE.electron.txt
├── LICENSES.chromium.html
├── your-app.exe
└── other-files...
```

打包后:
```
app/
├── license/
│   ├── LICENSE.electron.txt
│   ├── LICENSES.chromium.html
│   └── [custom license files]
├── your-app.exe
└── other-files...
```

---

# For English Users

## MoveLicense

An npm package that automatically organizes LICENSE files for Electron applications.

## Installation

```bash
npm install movelicense --save-dev
```

The package will automatically configure your Electron project after installation!

## Usage

### Automatic Configuration (Recommended)

After installation, the package will automatically:
1. Detect if it's an Electron project
2. Add `afterPack` hook to `package.json`
3. Copy `moveLicense.js` to project root

### Manual Configuration

```bash
# Run in project root
npx movelicense

# Force reconfiguration
npx movelicense --force

# Clean up configuration  
npx movelicense --clean
```
