// guesser.js - 邮箱模式猜测 + 域名验证
import dns from 'node:dns/promises';

// 常见邮箱模式模板
const PATTERNS = [
  (f, l) => `${f}.${l}`,
  (f, l) => `${f}${l}`,
  (f, l) => `${f[0]}${l}`,
  (f, l) => `${f}${l[0]}`,
  (f, l) => `${f[0]}.${l}`,
  (f, l) => `${f}_${l}`,
  (f, l) => `${f[0]}_${l}`,
  (f, l) => `${f}`,
  (f, l) => `${l}`,
  (f, l) => `${f}-${l}`,
];

// 通用角色邮箱
const ROLE_EMAILS = [
  'info', 'sales', 'contact', 'hello', 'support',
  'enquiries', 'enquiry', 'orders', 'buying', 'purchasing',
  'wholesale', 'trade', 'business', 'marketing', 'admin',
];

// 生成所有可能的邮箱
export function generateCandidates(firstName, lastName, domain) {
  if (!domain) return [];
  const f = (firstName || '').toLowerCase().replace(/[^a-z]/g, '');
  const l = (lastName || '').toLowerCase().replace(/[^a-z]/g, '');
  const candidates = [];
  const seen = new Set();

  if (f && l) {
    for (const pattern of PATTERNS) {
      const local = pattern(f, l);
      const email = `${local}@${domain}`;
      if (!seen.has(email)) {
        seen.add(email);
        candidates.push({ email, type: 'personal', pattern: local });
      }
    }
  }

  for (const role of ROLE_EMAILS) {
    const email = `${role}@${domain}`;
    if (!seen.has(email)) {
      seen.add(email);
      candidates.push({ email, type: 'role' });
    }
  }

  return candidates;
}

// 检查域名 MX 记录
export async function checkDomainMX(domain) {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: 'No MX records' };
    }
    const sorted = [...mxRecords].sort((a, b) => a.priority - b.priority);
    return {
      valid: true,
      mx: sorted[0].exchange,
      allMx: sorted.map((r) => r.exchange),
    };
  } catch (e) {
    return { valid: false, reason: e.code || e.message };
  }
}

export { PATTERNS, ROLE_EMAILS };
