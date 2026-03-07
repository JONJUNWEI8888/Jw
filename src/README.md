# 88888888.win - 预测市场平台

一个类似 Polymarket 的预测市场平台原型，使用 React + TypeScript + Tailwind CSS + Supabase 构建。

## 功能特性

### ✨ 核心功能
- 🎯 **多类别市场**: 政治、体育、加密货币、科技、娱乐等
- 📊 **实时数据**: 市场赔率、交易量、参与人数统计
- 💰 **真实投注系统**: 完整的下注、结算、盈亏计算
- 👤 **用户认证**: Supabase Auth 支持的注册和登录
- 💳 **钱包系统**: 余额管理、充值、交易历史
- 📈 **持仓管理**: 查看当前持仓和盈亏情况
- 💵 **USDT 充值**: 支持加密货币充值，二维码收款
- 🔍 **搜索过滤**: 快速查找感兴趣的市场
- 📱 **响应式设计**: 完美适配桌面和移动设备

### 🔐 用户系统
- 用户注册自动获得 1000 USDT 初始资金
- 基于 JWT 的安全认证
- 会话管理和自动登录

### 📊 市场功能
- 实时市场数据从后端加载
- 按分类和关键词筛选市场
- 详细的市场统计信息（交易量、参与者、截止时间等）
- 赔率实时显示

### 💼 钱包功能
- 查看账户余额
- 支持信用卡/借记卡充值（模拟）
- 支持 USDT (TRC-20) 加密货币充值
- 交易历史记录
- 当前持仓和盈亏统计

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **UI 组件**: Radix UI
- **图标**: Lucide React
- **二维码**: qrcode.react
- **通知**: Sonner
- **状态管理**: React Hooks

### 后端技术栈
- **运行环境**: Deno (Supabase Edge Functions)
- **Web 框架**: Hono
- **数据库**: Supabase KV Store (键值存储)
- **认证**: Supabase Auth
- **API 架构**: RESTful API

### 后端 API 端点

#### 认证相关
- `POST /auth/signup` - 用户注册
- `POST /auth/login` - 用户登录（前端通过 Supabase Client）
- `GET /auth/me` - 获取当前用户信息

#### 市场相关
- `GET /markets` - 获取市场列表（支持分类和搜索筛选）
- `GET /markets/:id` - 获取单个市场详情

#### 投注相关
- `POST /bets/place` - 下注（需要认证）
- `GET /bets/history` - 获取投注历史（需要认证）

#### 钱包相关
- `GET /wallet/balance` - 获取钱包余额（需要认证）
- `POST /wallet/deposit` - 充值（需要认证）
- `GET /wallet/transactions` - 获取交易历史（需要认证）

#### 用户相关
- `GET /user/positions` - 获取用户持仓（需要认证）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## Vercel 部署

### 方式 1: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

### 方式 2: 通过 Vercel 网页

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New" → "Project"
3. 导入你的 Git 仓库
4. **重要配置**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (或留空让 Vercel 自动检测)
   - Output Directory: `dist`
   - Install Command: `npm install`
5. 点击 "Deploy"

### 常见部署错误及解决方案

#### 错误 1: "No Output Directory named 'dist' found"

**原因**: 构建过程失败，没有生成 dist 目录

**解决方案**:
1. 查看 Vercel 构建日志，找到具体错误
2. 确保 `package.json` 中的 build 命令是 `"build": "vite build"`
3. 检查 TypeScript 错误（如果有）
4. 在本地运行 `npm run build` 测试是否能成功构建

#### 错误 2: 构建时内存不足

**解决方案**: 在 Vercel 项目设置中增加 Node.js 内存限制
```json
// package.json
"scripts": {
  "build": "NODE_OPTIONS='--max_old_space_size=4096' vite build"
}
```

#### 错误 3: 依赖安装失败

**解决方案**:
1. 删除本地 `node_modules` 和 `package-lock.json`
2. 运行 `npm install` 重新生成
3. 提交新的 `package-lock.json`

### 本地测试构建

在部署到 Vercel 前，先在本地测试：

```bash
# 清理旧构建
rm -rf dist

# 安装依赖
npm install

# 构建
npm run build

# 检查 dist 目录是否生成
ls -la dist

# 预览构建结果
npm run preview
```

## 项目结构

```
/
├── components/          # React 组件
│   ├── Header.tsx
│   ├── CategoryTabs.tsx
│   ├── MarketCard.tsx
│   ├── MarketDialog.tsx
│   ├── WalletDialog.tsx
│   └── ui/             # UI 组件库
├── data/               # 模拟数据
├── styles/             # 样式文件
├── App.tsx             # 主应用
├── main.tsx            # 入口文件
└── index.html          # HTML 模板
```

## License

MIT