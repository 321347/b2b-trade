import { describe, it, expect } from 'vitest';
import { PLANS, getPlan } from '@/lib/plans';

describe('PLANS', () => {
  it('free plan has expected limits', () => {
    expect(PLANS.free.searches).toBe(10);
    expect(PLANS.free.sendsPerDay).toBe(1);
    expect(PLANS.free.price).toBe(0);
  });

  it('enterprise plan has unlimited sends', () => {
    expect(PLANS.enterprise.sendsPerDay).toBe(Infinity);
    expect(PLANS.enterprise.searches).toBe(2000);
  });

  it('basic plan has email unmasked and verify enabled', () => {
    expect(PLANS.basic.emailMasked).toBe(false);
    expect(PLANS.basic.verify).toBe(true);
  });

  it('starter plan has masked emails', () => {
    expect(PLANS.starter.emailMasked).toBe(true);
  });

  it('all paid plans have price > 0', () => {
    expect(PLANS.starter.price).toBe(49);
    expect(PLANS.basic.price).toBe(99);
    expect(PLANS.pro.price).toBe(199);
    expect(PLANS.enterprise.price).toBe(399);
  });
});

describe('getPlan', () => {
  it('returns free plan for null user', () => {
    const plan = getPlan(null);
    expect(plan.key).toBe('free');
    expect(plan.searches).toBe(10);
  });

  it('returns free plan for empty user', () => {
    const plan = getPlan({});
    expect(plan.key).toBe('free');
  });

  it('reads plan from user_metadata', () => {
    const plan = getPlan({ user_metadata: { plan: 'pro' } });
    expect(plan.key).toBe('pro');
    expect(plan.searches).toBe(800);
    expect(plan.price).toBe(199);
  });

  it('falls back to free for invalid plan key', () => {
    const plan = getPlan({ user_metadata: { plan: 'nonexistent' } });
    expect(plan.key).toBe('nonexistent');
    expect(plan.searches).toBe(10);
  });
});
