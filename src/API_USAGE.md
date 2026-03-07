# API 使用指南

## 概述

88888888.win 平台使用 Supabase Edge Functions 提供的 RESTful API。所有 API 端点都以 `/make-server-3f0c09a6` 为前缀。

**基础 URL**: `https://{projectId}.supabase.co/functions/v1/make-server-3f0c09a6`

## 认证

### 公开端点
某些端点不需要认证，使用 Supabase 的公开匿名密钥（public anon key）：

```javascript
headers: {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json'
}
```

### 受保护端点
需要用户登录的端点需要在请求头中包含用户的访问令牌（access token）：

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

## API 端点详情

### 1. 用户认证

#### 注册新用户
```http
POST /auth/signup
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "张三"
}
```

**响应**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三"
  },
  "message": "Account created successfully! You have been credited with 1000 USDT."
}
```

#### 登录
登录通过 Supabase Client 在前端处理：

```javascript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password',
});

// 保存 access_token
const accessToken = data.session.access_token;
```

#### 获取当前用户信息
```http
GET /auth/me
```

**需要认证**: ✅

**响应**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "张三",
  "wallet": {
    "userId": "uuid",
    "balance": 1000,
    "currency": "USDT",
    "createdAt": "2024-03-07T10:00:00.000Z"
  }
}
```

### 2. 市场数据

#### 获取市场列表
```http
GET /markets?category={category}&search={query}
```

**需要认证**: ❌

**查询参数**:
- `category` (可选): 市场分类（政治、体育、加密货币、科技、娱乐）
- `search` (可选): 搜索关键词

**响应**:
```json
{
  "markets": [
    {
      "id": "1",
      "title": "2024年美国总统大选：民主党候选人获胜？",
      "description": "...",
      "category": "政治",
      "yesPrice": 0.52,
      "noPrice": 0.48,
      "volume": "$2.3M",
      "endDate": "2024年11月5日",
      "participants": 12547,
      "image": "https://...",
      "trending": "up"
    }
  ]
}
```

#### 获取单个市场详情
```http
GET /markets/:id
```

**需要认证**: ❌

**响应**:
```json
{
  "market": {
    "id": "1",
    "title": "...",
    "description": "...",
    // ... 其他市场数据
  }
}
```

### 3. 投注操作

#### 下注
```http
POST /bets/place
```

**需要认证**: ✅

**请求体**:
```json
{
  "marketId": "1",
  "outcome": "yes",
  "amount": 50
}
```

**响应**:
```json
{
  "success": true,
  "bet": {
    "id": "bet:uuid:timestamp",
    "userId": "uuid",
    "marketId": "1",
    "outcome": "yes",
    "amount": 50,
    "shares": 96.15,
    "price": 0.52,
    "createdAt": "2024-03-07T10:00:00.000Z",
    "status": "active"
  },
  "newBalance": 950,
  "message": "Successfully placed 50 USDT bet on YES"
}
```

#### 获取投注历史
```http
GET /bets/history
```

**需要认证**: ✅

**响应**:
```json
{
  "bets": [
    {
      "id": "bet:uuid:timestamp",
      "userId": "uuid",
      "marketId": "1",
      "outcome": "yes",
      "amount": 50,
      "shares": 96.15,
      "price": 0.52,
      "createdAt": "2024-03-07T10:00:00.000Z",
      "status": "active"
    }
  ]
}
```

### 4. 钱包操作

#### 获取钱包余额
```http
GET /wallet/balance
```

**需要认证**: ✅

**响应**:
```json
{
  "wallet": {
    "userId": "uuid",
    "balance": 950,
    "currency": "USDT",
    "createdAt": "2024-03-07T10:00:00.000Z"
  }
}
```

#### 充值
```http
POST /wallet/deposit
```

**需要认证**: ✅

**请求体**:
```json
{
  "amount": 100
}
```

**响应**:
```json
{
  "success": true,
  "newBalance": 1050,
  "message": "Successfully deposited 100 USDT"
}
```

#### 获取交易历史
```http
GET /wallet/transactions
```

**需要认证**: ✅

**响应**:
```json
{
  "transactions": [
    {
      "id": "deposit:timestamp",
      "type": "deposit",
      "amount": 100,
      "timestamp": "2024-03-07T10:00:00.000Z"
    },
    {
      "id": "bet:uuid:timestamp",
      "type": "bet",
      "marketTitle": "2024年美国总统大选：民主党候选人获胜？",
      "outcome": "yes",
      "amount": -50,
      "shares": 96.15,
      "price": 0.52,
      "timestamp": "2024-03-07T09:00:00.000Z"
    }
  ]
}
```

### 5. 用户持仓

#### 获取用户持仓
```http
GET /user/positions
```

**需要认证**: ✅

**响应**:
```json
{
  "positions": [
    {
      "marketId": "1",
      "marketTitle": "2024年美国总统大选：民主党候选人获胜？",
      "outcome": "yes",
      "shares": 96.15,
      "totalInvested": 50,
      "avgPrice": 0.52,
      "currentPrice": 0.54
    }
  ]
}
```

## 错误处理

所有 API 端点在发生错误时会返回以下格式：

```json
{
  "error": "Error message description"
}
```

常见的 HTTP 状态码：
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权（需要登录）
- `404` - 资源未找到
- `500` - 服务器内部错误

## 前端使用示例

项目中已经封装了 API 客户端（`/lib/api.ts`），可以直接使用：

```javascript
import { marketApi, bettingApi, walletApi, userApi } from './lib/api';

// 获取市场列表
const { markets } = await marketApi.getMarkets('政治', '美国');

// 下注
const result = await bettingApi.placeBet('1', 'yes', 50);

// 获取钱包余额
const { wallet } = await walletApi.getBalance();

// 充值
const result = await walletApi.deposit(100);

// 获取持仓
const { positions } = await userApi.getPositions();
```

## 数据存储

后端使用 Supabase KV Store 存储所有数据，键值规则：

- `market:{id}` - 市场数据
- `wallet:{userId}` - 用户钱包
- `positions:{userId}` - 用户持仓
- `transactions:{userId}` - 交易历史
- `bet:{userId}:{timestamp}` - 投注记录

## 安全性

- 所有敏感操作都需要用户认证
- 使用 Supabase Auth 进行用户身份验证
- SUPABASE_SERVICE_ROLE_KEY 仅在服务器端使用，不会暴露给前端
- 所有 API 请求都通过 CORS 保护

## 注意事项

1. 这是一个原型项目，用于演示和学习目的
2. 真实的生产环境应该：
   - 使用真实的支付网关进行充值
   - 实现更复杂的市场定价算法
   - 添加 KYC（了解你的客户）验证
   - 实现更严格的风控措施
   - 使用专业的数据库而不是 KV Store
   - 添加实时 WebSocket 连接以推送价格更新
