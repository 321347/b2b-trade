const S = typeof window === 'undefined' ? null : window.localStorage;

export const MARKETS = ['英国', '美国', '德国', '法国', '意大利', '西班牙', '荷兰', '澳大利亚', '阿联酋', '日本', '韩国', '加拿大', '巴西', '印度', '全球'];

export function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return name[0] + '***@' + domain;
}

export function loadHistory() {
  if (!S) return [];
  try { return JSON.parse(S.getItem('searchHistory') || '[]'); }
  catch { return []; }
}

export function saveHistory(term) {
  if (!S) return;
  const h = loadHistory().filter(t => t !== term);
  h.unshift(term);
  S.setItem('searchHistory', JSON.stringify(h.slice(0, 8)));
}

export function getSmtp() {
  if (!S) return null;
  try { return JSON.parse(S.getItem('smtpConfig') || 'null'); } catch { return null; }
}

export function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (S) {
    const token = S.getItem('token');
    if (token) h['Authorization'] = 'Bearer ' + token;
  }
  return h;
}

export function sanitizeRedirect(url) {
  if (!url || url.startsWith('/')) return url;
  return '/';
}
