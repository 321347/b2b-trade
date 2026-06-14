const S = typeof window === 'undefined' ? null : window.localStorage;

export const MARKETS = ['英国', '美国', '德国', '法国', '意大利', '西班牙', '荷兰', '澳大利亚', '阿联酋', '日本', '韩国', '加拿大', '巴西', '印度', '全球'];

export const INDUSTRY_GROUPS = [
  { emoji: '🍳', label: '厨房用品', key: 'kitchen', products: ['压蒜器', '切菜器', '削皮器', '锅具', '烘焙用具', '刀具', '锅铲', '烤盘', '打蛋器', '量杯', '开瓶器', '不锈钢厨具'] },
  { emoji: '🐾', label: '宠物用品', key: 'pet', products: ['宠物玩具', '猫抓板', '狗咬胶', '牵引绳', '项圈', '宠物窝垫', '宠物碗', '宠物背包', '猫砂盆'] },
  { emoji: '🧸', label: '玩具游戏', key: 'toys', products: ['毛绒玩具', '拼图', '桌游', '积木', '益智玩具', '科学实验', '小玩具', '派对用品'] },
  { emoji: '⚽', label: '运动户外', key: 'sports', products: ['瑜伽垫', '哑铃', '跑步机', '露营装备', '帐篷', '睡袋', '登山背包', '骑行配件', '足球'] },
  { emoji: '🎁', label: '礼品工艺', key: 'gift', products: ['冰箱贴', '钥匙扣', '相框', '蜡烛', '香薰', '摆件', '纪念品', '圣诞装饰', '定制促销品'] },
  { emoji: '🏠', label: '家居园艺', key: 'home', products: ['靠垫套', '花瓶', '桌布', '收纳盒', '储物罐', '熨衣板', '灯具', '纺织品'] },
  { emoji: '📱', label: '电子配件', key: 'electronics', products: ['手机壳', '数据线', '充电器', '充电宝', '蓝牙耳机', '手机支架', '屏幕保护膜'] },
  { emoji: '💄', label: '美妆个护', key: 'beauty', products: ['化妆刷', '粉扑', '美妆蛋', '睫毛夹', '指甲锉', '化妆包', '洗漱用品'] },
  { emoji: '✏️', label: '文具办公', key: 'stationery', products: ['笔记本', '打印机配件', '墨盒', '硒鼓', '桌面收纳', '笔', '文件夹'] },
  { emoji: '🏍️', label: '汽摩配件', key: 'auto', products: ['摩托车配件', '头盔', '手套', '护具', '车载支架', '改装件'] },
];

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
