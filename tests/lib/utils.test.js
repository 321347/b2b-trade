import { describe, it, expect } from 'vitest';
import { maskEmail, sanitizeRedirect, getUserName } from '@/lib/utils';

describe('maskEmail', () => {
  it('masks email local part except first char', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('handles short local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });

  it('returns original if no @ sign', () => {
    expect(maskEmail('invalid')).toBe('invalid');
  });
});

describe('sanitizeRedirect', () => {
  it('returns / for null/undefined', () => {
    expect(sanitizeRedirect(null)).toBe('/');
    expect(sanitizeRedirect(undefined)).toBe('/');
    expect(sanitizeRedirect('')).toBe('/');
  });

  it('returns path as-is if starts with /', () => {
    expect(sanitizeRedirect('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirect('/')).toBe('/');
  });

  it('returns / for external URLs (anti open-redirect)', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/');
    expect(sanitizeRedirect('//evil.com')).toBe('/');
  });
});

describe('getUserName', () => {
  it('returns name field first', () => {
    expect(getUserName({ name: '张三', email: 'zhang@test.com' })).toBe('张三');
  });

  it('falls back to user_metadata.name', () => {
    expect(getUserName({ user_metadata: { name: '李四' }, email: 'li@test.com' })).toBe('李四');
  });

  it('falls back to email prefix', () => {
    expect(getUserName({ email: 'wang@test.com' })).toBe('wang');
  });

  it('returns empty for null', () => {
    expect(getUserName(null)).toBe('');
  });
});
