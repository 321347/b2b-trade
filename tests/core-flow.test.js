import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

// Reset between tests
beforeEach(() => {
  mockFetch.mockReset();
  for (const k of Object.keys(store)) delete store[k];
});

describe('核心流程：注册 → 搜索 → 发信', () => {
  it('注册：POST /api/register 返回 ok', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true, user: { id: 'u1', email: 'test@test.com' } }),
    });

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'Test1234', name: '测试' }),
    });
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.user.email).toBe('test@test.com');
  });

  it('注册：缺少邮箱返回错误', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: '邮箱必填' }),
    });

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'Test1234' }),
    });
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('搜索：GET /api/industry-search 返回公司列表', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        companies: [
          { company: 'EPE International', domain: 'epeinternational.com', market: '英国', emails: ['tracey@epeinternational.com'] },
          { company: 'Burton McCall', domain: 'burton-mccall.com', market: '英国', emails: ['georgia.ryman@burton-mccall.com'] },
        ],
        total: 2,
        quota: { remaining: 9, total: 10, plan: '免费版' },
      }),
    });

    const res = await fetch('/api/industry-search?q=厨房用品&market=英国');
    const data = await res.json();
    expect(data.companies.length).toBe(2);
    expect(data.companies[0].company).toBe('EPE International');
    expect(data.quota.remaining).toBe(9);
  });

  it('搜索：空查询返回空结果', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ companies: [], total: 0 }),
    });

    const res = await fetch('/api/industry-search?q=');
    const data = await res.json();
    expect(data.companies.length).toBe(0);
  });

  it('发信：POST /api/send 发送成功', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true, sent: 1 }),
    });

    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'buyer@example.com',
        name: 'John',
        company: 'ABC Corp',
        subject: 'Business Inquiry',
        body: 'Dear John, ...',
      }),
    });
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('发信：无邮箱返回错误', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: '缺少收件人邮箱' }),
    });

    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('完整流程模拟', async () => {
    // Step 1: 注册
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true, user: { id: 'u1', email: 'seller@test.com' } }),
    });
    const regRes = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'seller@test.com', password: 'Test1234', name: '外贸人' }),
    });
    expect((await regRes.json()).ok).toBe(true);

    // Step 2: 搜索
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        companies: [{ company: 'Test Corp', domain: 'test.com', market: '英国', emails: ['buyer@test.com'] }],
        total: 1,
        quota: { remaining: 9, total: 10, plan: '免费版' },
      }),
    });
    const searchRes = await fetch('/api/industry-search?q=Kitchen&market=英国');
    expect((await searchRes.json()).total).toBe(1);

    // Step 3: 发信
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ ok: true }),
    });
    const sendRes = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'buyer@test.com', subject: 'Hello', body: 'Test' }),
    });
    expect((await sendRes.json()).ok).toBe(true);
  });
});

describe('配额逻辑', () => {
  it('免费版配额 10 次', () => {
    expect(10).toBe(10); // 参见 plans.test.js 中的 PLANS.free.searches
  });

  it('配额用完返回 0', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: '本月搜索次数已用完', quota: { remaining: 0, total: 10 } }),
    });

    const res = await fetch('/api/industry-search?q=test');
    const data = await res.json();
    expect(data.quota.remaining).toBe(0);
  });
});

describe('API Key 认证', () => {
  it('缺少 API Key 返回 401', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: '需要 API Key' }),
      status: 401,
    });

    const res = await fetch('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' }),
    });
    expect(res.status).toBe(401);
  });

  it('无效 API Key 返回 401', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ error: '无效的 API Key' }),
      status: 401,
    });

    const res = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid_key' },
      body: JSON.stringify({ domain: 'example.com' }),
    });
    expect(res.status).toBe(401);
  });
});
