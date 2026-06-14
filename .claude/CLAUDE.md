# 鱼获科技（b2b-trade）项目规则

## 技术栈
- Next.js 14 App Router（部署 Vercel）
- Supabase Auth（用户认证 + 配额管理）
- nodemailer SMTP 发信
- 纯 CSS inline styles，无 CSS 框架

## 构建纪律
- 攒够一组修改再跑 `npm run build`，每次会话不超过 3 次构建
- 构建前确保 `@/` 路径别名为 `src/*`（jsconfig.json 已配）
- 生产构建：`npm run build`，本地 dev：`npm run dev`

## 项目特殊规则
- 所有页面默认 'use client'（无 SSR 需求）
- API route 用 `@/lib/auth.js` 的 `requireAuth` 做认证
- 速率限制用 `@/lib/rate-limit.js`
- 用户配额用 `@/lib/quota.js`
- Supabase 客户端统一用 `@/lib/supabase.js` 的 `getSupabase()`
- 工具函数放 `@/lib/utils.js`
- 市场选项从 `@/lib/utils.js` 的 `MARKETS` 常量取

## 文件结构
```
src/
├── app/
│   ├── layout.js        ← 服务端组件（metadata/viewport/icon）
│   ├── Nav.js           ← 客户端组件（导航栏）
│   ├── SearchPage.js    ← 公共搜索组件（page.js + search/page.js 共用）
│   ├── page.js          ← 首页
│   ├── api/             ← API 路由
│   └── [pages]/         ← 各页面
└── lib/
    ├── auth.js          ← 认证
    ├── cache.js         ← 内存缓存（API provider 配额）
    ├── guesser.js       ← 邮箱猜测 + MX 验证
    ├── industries.js    ← 行业数据
    ├── providers.js     ← 邮箱 API providers 配置
    ├── quota.js         ← 用户搜索配额
    ├── rate-limit.js    ← 内存限流
    ├── supabase.js      ← Supabase 客户端
    └── utils.js         ← 工具函数 + MARKETS 常量
```

## 环境变量
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_SITE_URL` — 站点 URL（用于密码重置链接）

## 禁止事项
- 禁止在代码里硬编码 Supabase service_role key
- 禁止在客户端组件导出 metadata
- 禁止用 fs 模块写文件（Vercel 只读）
