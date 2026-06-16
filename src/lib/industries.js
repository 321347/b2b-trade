// 行业数据 - 用于品类着陆页
export const INDUSTRIES = {
  kitchen: {
    zh: '厨房小工具', slug: 'kitchen',
    keywords: ['压蒜器', '切菜器', '削皮器', '刨丝器', '厨房秤'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2340 },
      { flag: '🇬🇧', name: '英国', count: 1560 },
      { flag: '🇩🇪', name: '德国', count: 1120 },
      { flag: '🇦🇺', name: '澳大利亚', count: 780 },
      { flag: '🇳🇱', name: '荷兰', count: 540 },
      { flag: '🇨🇦', name: '加拿大', count: 480 },
    ],
    pains: [
      '展会上拿到的名片大多是同行，真正采购商太少',
      '阿里国际站竞争激烈，同行压价利润薄',
      'Google 搜索半天找不到对口的批发商和进口商',
      '发了几百封开发信，退信率高，回复率更低',
    ],
    related: ['home', 'beauty', 'party'],
  },
  pet: {
    zh: '宠物用品', slug: 'pet',
    keywords: ['宠物玩具', '狗窝', '猫抓板', '宠物碗', '美容工具'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2100 },
      { flag: '🇬🇧', name: '英国', count: 1380 },
      { flag: '🇩🇪', name: '德国', count: 980 },
      { flag: '🇦🇺', name: '澳大利亚', count: 720 },
      { flag: '🇨🇦', name: '加拿大', count: 540 },
      { flag: '🇫🇷', name: '法国', count: 410 },
    ],
    pains: [
      '宠物用品海外市场大，但找不到精准的分销商',
      '展会成本越来越高，ROI 难以衡量',
      'B2B平台询盘质量低，很多不是真实买家',
      '开发信发了没人回，不知道采购决策人是谁',
    ],
    related: ['home', 'toys', 'beauty'],
  },
  gift: {
    zh: '礼品纪念品', slug: 'gift',
    keywords: ['冰箱贴', '钥匙扣', '马克杯', '相框', '蜡烛'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1680 },
      { flag: '🇬🇧', name: '英国', count: 1120 },
      { flag: '🇦🇪', name: '阿联酋', count: 890 },
      { flag: '🇦🇺', name: '澳大利亚', count: 640 },
      { flag: '🇫🇷', name: '法国', count: 520 },
      { flag: '🇩🇪', name: '德国', count: 460 },
    ],
    pains: [
      '礼品行业季节性强，找不到持续采购的海外客户',
      '定制类产品需要沟通，但找不到决策人联系方式',
      '广交会后跟进效率低，很多客户流失',
      '同行太多价格战，需要开发更多直客',
    ],
    related: ['home', 'party', 'stationery'],
  },
  home: {
    zh: '家居园艺', slug: 'home',
    keywords: ['靠垫套', '休闲毯', '墙饰', '花瓶', '花盆'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2860 },
      { flag: '🇬🇧', name: '英国', count: 1740 },
      { flag: '🇩🇪', name: '德国', count: 1380 },
      { flag: '🇦🇺', name: '澳大利亚', count: 890 },
      { flag: '🇳🇱', name: '荷兰', count: 620 },
      { flag: '🇨🇦', name: '加拿大', count: 540 },
    ],
    pains: [
      '家居品类大但细分多，找不到对口买家',
      '海外客户分散在各种小B端，效率低',
      '传统外贸渠道获客成本越来越高',
      '不知道哪些公司在从中国进口家居产品',
    ],
    related: ['kitchen', 'furniture', 'lighting'],
  },
  beauty: {
    zh: '美妆个护', slug: 'beauty',
    keywords: ['化妆刷', '化妆包', '发饰', '美妆蛋'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2480 },
      { flag: '🇬🇧', name: '英国', count: 1520 },
      { flag: '🇩🇪', name: '德国', count: 1180 },
      { flag: '🇫🇷', name: '法国', count: 860 },
      { flag: '🇦🇺', name: '澳大利亚', count: 640 },
      { flag: '🇯🇵', name: '日本', count: 520 },
    ],
    pains: [
      '美妆行业品牌多，找不到愿意尝试新供应商的买家',
      '产品认证要求复杂，不知道客户具体需求',
      '开发信回复率低，找不到关键决策人',
      '社交媒体获客耗时，需要更高效的渠道',
    ],
    related: ['kitchen', 'health', 'stationery'],
  },
  stationery: {
    zh: '文具办公', slug: 'stationery',
    keywords: ['笔记本', '笔', '便利贴', '桌面收纳', '文件夹'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1380 },
      { flag: '🇬🇧', name: '英国', count: 920 },
      { flag: '🇩🇪', name: '德国', count: 680 },
      { flag: '🇦🇺', name: '澳大利亚', count: 460 },
      { flag: '🇯🇵', name: '日本', count: 380 },
      { flag: '🇰🇷', name: '韩国', count: 290 },
    ],
    pains: [
      '文具产品单价低，需要找大批量采购商才有利润',
      '开学季采购集中，平时难找客户',
      'B2B平台上的询价大多是比价不是真实需求',
      '老客户流失后补充新客户效率低',
    ],
    related: ['gift', 'toys', 'bag'],
  },
  toys: {
    zh: '玩具游戏', slug: 'toys',
    keywords: ['毛绒玩具', '拼图游戏', '解压玩具', '桌游', '益智玩具'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2060 },
      { flag: '🇬🇧', name: '英国', count: 1280 },
      { flag: '🇩🇪', name: '德国', count: 940 },
      { flag: '🇦🇺', name: '澳大利亚', count: 620 },
      { flag: '🇨🇦', name: '加拿大', count: 480 },
      { flag: '🇫🇷', name: '法国', count: 360 },
    ],
    pains: [
      '玩具行业安全标准严格，不知道哪些进口商有资质',
      '圣诞/复活节等节日采购窗口短，找客户要快',
      'IP授权类产品多，难找愿意做OEM的客户',
      '竞争对手价格低，需要开发高质量客户',
    ],
    related: ['baby', 'pet', 'gift'],
  },
  outdoor: {
    zh: '户外运动', slug: 'outdoor',
    keywords: ['瑜伽垫', '水瓶', '露营装备', '健身包', '骑行配件'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2280 },
      { flag: '🇩🇪', name: '德国', count: 1420 },
      { flag: '🇬🇧', name: '英国', count: 1080 },
      { flag: '🇦🇺', name: '澳大利亚', count: 740 },
      { flag: '🇨🇦', name: '加拿大', count: 560 },
      { flag: '🇯🇵', name: '日本', count: 420 },
    ],
    pains: [
      '户外产品季节性强，需要提前找到采购客户',
      '专业户外品牌供应商固定，难打入供应链',
      '不知道哪些经销商在扩展产品线',
      '展会获客成本高，需要线上补充',
    ],
    related: ['health', 'toys', 'bag'],
  },
  electronics: {
    zh: '电子配件', slug: 'electronics',
    keywords: ['手机壳', '充电器', '充电宝', '数据线', '蓝牙音箱'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 3420 },
      { flag: '🇩🇪', name: '德国', count: 2180 },
      { flag: '🇬🇧', name: '英国', count: 1560 },
      { flag: '🇦🇪', name: '阿联酋', count: 980 },
      { flag: '🇦🇺', name: '澳大利亚', count: 760 },
      { flag: '🇯🇵', name: '日本', count: 620 },
    ],
    pains: [
      '电子配件市场竞争白热化，需要找到差异化客户',
      '认证要求多（CE/FCC），不知道客户具体要求',
      '更新换代快，需要快速找到新品采购需求',
      '大客户供应商固定，中小分销商更难找',
    ],
    related: ['home', 'outdoor', 'car'],
  },
  fashion: {
    zh: '服饰鞋包', slug: 'fashion',
    keywords: ['女装连衣裙', '男士夹克', '运动鞋', '手袋', '围巾'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2860 },
      { flag: '🇬🇧', name: '英国', count: 1780 },
      { flag: '🇩🇪', name: '德国', count: 1240 },
      { flag: '🇫🇷', name: '法国', count: 980 },
      { flag: '🇦🇺', name: '澳大利亚', count: 680 },
      { flag: '🇯🇵', name: '日本', count: 520 },
    ],
    pains: [
      '服装行业流行趋势变化快，找客户要跟上节奏',
      '品牌客户供应商稳定，新供应商难进入',
      '快时尚采购量大但利润薄，要找中高端客户',
      '面辅料采购分散，找不到一站式供应需求',
    ],
    related: ['bag', 'beauty', 'textile'],
  },
  baby: {
    zh: '母婴用品', slug: 'baby',
    keywords: ['婴儿推车', '婴儿服装', '妈咪包', '婴儿玩具', '奶瓶'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1780 },
      { flag: '🇬🇧', name: '英国', count: 1120 },
      { flag: '🇩🇪', name: '德国', count: 860 },
      { flag: '🇦🇺', name: '澳大利亚', count: 540 },
      { flag: '🇨🇦', name: '加拿大', count: 420 },
      { flag: '🇯🇵', name: '日本', count: 340 },
    ],
    pains: [
      '母婴产品安全标准严格，不知道进口商具体认证要求',
      '品牌意识强，新供应商难获得信任',
      '采购决策链长，找不到关键联系人',
      '季节性采购（如开学季）窗口短',
    ],
    related: ['toys', 'fashion', 'health'],
  },
  car: {
    zh: '汽车配件', slug: 'car',
    keywords: ['刹车片', '机油滤清器', '车灯', '悬挂零件', '汽车电子'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 3120 },
      { flag: '🇩🇪', name: '德国', count: 2240 },
      { flag: '🇬🇧', name: '英国', count: 1460 },
      { flag: '🇯🇵', name: '日本', count: 880 },
      { flag: '🇦🇺', name: '澳大利亚', count: 640 },
      { flag: '🇧🇷', name: '巴西', count: 480 },
    ],
    pains: [
      '汽配行业SKU多，找对口客户需要精准匹配',
      'OEM/Aftermarket 客户需求不同，难区分',
      '认证门槛高（IATF 16949），不是所有客户都能做',
      '竞争对手多，价格战严重',
    ],
    related: ['hardware', 'electronics', 'outdoor'],
  },
  hardware: {
    zh: '五金工具', slug: 'hardware',
    keywords: ['手动工具', '电动工具', '紧固件', '扳手', '钻头'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2460 },
      { flag: '🇩🇪', name: '德国', count: 1680 },
      { flag: '🇬🇧', name: '英国', count: 1120 },
      { flag: '🇦🇺', name: '澳大利亚', count: 720 },
      { flag: '🇨🇦', name: '加拿大', count: 540 },
      { flag: '🇧🇷', name: '巴西', count: 380 },
    ],
    pains: [
      '五金工具品类多且杂，找精准客户效率低',
      '海外客户分散在各种小五金店和连锁建材店',
      '产品同质化严重，价格竞争激烈',
      '传统展会获客越来越难，需要线上补充',
    ],
    related: ['car', 'home', 'kitchen'],
  },
  party: {
    zh: '派对节庆', slug: 'party',
    keywords: ['气球', '派对帽', '彩纸屑', '横幅', '圣诞装饰'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1680 },
      { flag: '🇬🇧', name: '英国', count: 1040 },
      { flag: '🇦🇺', name: '澳大利亚', count: 680 },
      { flag: '🇩🇪', name: '德国', count: 520 },
      { flag: '🇫🇷', name: '法国', count: 420 },
      { flag: '🇨🇦', name: '加拿大', count: 340 },
    ],
    pains: [
      '派对用品季节性极强（圣诞/万圣节），找客户要提前',
      '一次性用品利润低，需要找大批量客户',
      '创意类产品迭代快，客户需要持续开发新品',
      'B2B平台上价格战严重',
    ],
    related: ['gift', 'home', 'toys'],
  },
  health: {
    zh: '健康护理', slug: 'health',
    keywords: ['按摩枪', '健身追踪器', '急救包', '药盒', '温度计'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2120 },
      { flag: '🇩🇪', name: '德国', count: 1340 },
      { flag: '🇬🇧', name: '英国', count: 980 },
      { flag: '🇯🇵', name: '日本', count: 640 },
      { flag: '🇦🇺', name: '澳大利亚', count: 480 },
      { flag: '🇨🇦', name: '加拿大', count: 380 },
    ],
    pains: [
      '医疗器械认证门槛高（FDA/CE），不知道客户具体要求',
      '疫情后需求变化大，难判断哪些产品还有市场',
      '客户对质量和安全要求极高，信任建立周期长',
      '竞争对手多集中在低端市场',
    ],
    related: ['beauty', 'outdoor', 'baby'],
  },
  lighting: {
    zh: '灯具照明', slug: 'lighting',
    keywords: ['LED灯泡', '智能灯', '户外灯', '吊灯', '太阳能灯'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1860 },
      { flag: '🇩🇪', name: '德国', count: 1240 },
      { flag: '🇬🇧', name: '英国', count: 860 },
      { flag: '🇦🇺', name: '澳大利亚', count: 540 },
      { flag: '🇳🇱', name: '荷兰', count: 420 },
      { flag: '🇦🇪', name: '阿联酋', count: 360 },
    ],
    pains: [
      'LED灯具市场成熟，客户供应商关系稳定',
      '不同国家电压/认证标准不同，找对口客户难',
      '智能照明是新趋势，不知道哪些客户在布局',
      '工程款产品决策链长，找不到项目采购负责人',
    ],
    related: ['home', 'electronics', 'outdoor'],
  },
  textile: {
    zh: '家纺面料', slug: 'textile',
    keywords: ['棉布', '涤纶', '床单', '毛巾', '窗帘'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1920 },
      { flag: '🇬🇧', name: '英国', count: 1180 },
      { flag: '🇩🇪', name: '德国', count: 860 },
      { flag: '🇫🇷', name: '法国', count: 640 },
      { flag: '🇮🇹', name: '意大利', count: 520 },
      { flag: '🇯🇵', name: '日本', count: 380 },
    ],
    pains: [
      '纺织行业客户供应商关系牢固，新供应商难进入',
      '环保/有机认证要求越来越多',
      '快时尚品牌采购周期短，跟不上节奏',
      '面料品类太杂，精准匹配客户需求效率低',
    ],
    related: ['fashion', 'home', 'baby'],
  },
  furniture: {
    zh: '家具家装', slug: 'furniture',
    keywords: ['办公椅', '餐桌', '货架', '沙发', '储物柜'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 2680 },
      { flag: '🇬🇧', name: '英国', count: 1520 },
      { flag: '🇩🇪', name: '德国', count: 1240 },
      { flag: '🇦🇺', name: '澳大利亚', count: 780 },
      { flag: '🇨🇦', name: '加拿大', count: 560 },
      { flag: '🇳🇱', name: '荷兰', count: 420 },
    ],
    pains: [
      '家具体积大运费高，客户更倾向本地或近邻采购',
      '定制家具沟通周期长，找不到有定制需求的客户',
      '线上展示困难，客户看不到实物不放心',
      '工程项目类采购信息不透明',
    ],
    related: ['home', 'lighting', 'kitchen'],
  },
  bag: {
    zh: '箱包旅行', slug: 'bag',
    keywords: ['背包', '旅行包', '电脑包', '托特包', '行李箱'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1720 },
      { flag: '🇬🇧', name: '英国', count: 1060 },
      { flag: '🇩🇪', name: '德国', count: 780 },
      { flag: '🇫🇷', name: '法国', count: 540 },
      { flag: '🇯🇵', name: '日本', count: 440 },
      { flag: '🇦🇺', name: '澳大利亚', count: 380 },
    ],
    pains: [
      '箱包行业品牌意识强，新供应商难打入',
      '旅行箱类产品认证要求多',
      '时尚类箱包趋势变化快，跟不上客户需求',
      'ODM客户难找，大多是OEM比价',
    ],
    related: ['fashion', 'outdoor', 'stationery'],
  },
  watches: {
    zh: '手表眼镜', slug: 'watches',
    keywords: ['智能手表', '时尚手表', '太阳镜', '老花镜', '表带'],
    
    hotCountries: [
      { flag: '🇺🇸', name: '美国', count: 1580 },
      { flag: '🇬🇧', name: '英国', count: 920 },
      { flag: '🇩🇪', name: '德国', count: 680 },
      { flag: '🇯🇵', name: '日本', count: 540 },
      { flag: '🇫🇷', name: '法国', count: 420 },
      { flag: '🇦🇪', name: '阿联酋', count: 360 },
    ],
    pains: [
      '手表眼镜品牌集中度高，中小品牌客户难找',
      '智能手表技术门槛高，不是所有客户能做',
      '时尚配饰类客户更看重设计能力',
      '中东市场有需求但信息不透明',
    ],
    related: ['electronics', 'fashion', 'gift'],
  },
};

export function getIndustryBySlug(slug) {
  return INDUSTRIES[slug] || null;
}

export function getAllIndustries() {
  return Object.entries(INDUSTRIES).map(([slug, data]) => ({ slug, ...data }));
}
