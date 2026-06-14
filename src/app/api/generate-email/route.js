import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// === 案例库（匹配客户行业/地区） ===
const CASES = [
  { industry: 'kitchen', market: '英国', text: '英国厨房用品分销商——50,000个不锈钢压蒜器，FOB宁波，40天交付，零质量投诉' },
  { industry: 'kitchen', market: '美国', text: '美国Amazon卖家——10,000个切菜器套装，FBA入仓，4.5星评价，3个月售罄' },
  { industry: 'pet', market: '英国', text: '英国宠物连锁店——5,000个狗咬胶玩具，CPSIA合规，45天设计到交付' },
  { industry: 'pet', market: '美国', text: '美国Amazon卖家——10,000个毛绒狗玩具，4.5星，3个月售罄' },
  { industry: 'gift', market: '美国', text: '美国德州礼品批发商——1,000个定制冰箱贴，单价$0.15，零售$3.99' },
  { industry: 'home', market: '德国', text: '德国家居零售商——20,000个靠垫套，OEKO-TEX认证，零投诉' },
  { industry: 'electronics', market: '美国', text: '美国电商卖家——5,000条USB充电线，MFi认证，30天交付' },
  { industry: 'toys', market: '英国', text: '英国玩具批发商——3,000个毛绒玩具，EN71认证，60天从设计到上架' },
  { industry: 'outdoor', market: '美国', text: '美国户外品牌——8,000张瑜伽垫，OEKO-TEX认证，客户复购率40%' },
  { industry: 'beauty', market: '德国', text: '德国美妆连锁——15,000套化妆刷，GMPC认证，季度返单' },
];

const INDUSTRY_MAP = {
  kitchen: ['厨房','厨具','小家电','压蒜器','切菜器','削皮器','锅具','烘焙','刀具','锅铲','烤盘','打蛋器','量杯','开瓶器','不锈钢','kitchen','cookware','bakeware'],
  pet: ['宠物','狗','猫','牵引绳','项圈','窝','垫子','宠物碗','宠物玩具','猫抓板','狗咬胶','pet','dog','cat'],
  gift: ['礼品','纪念品','圣诞','定制','促销品','摆件','钥匙扣','冰箱贴','相框','香薰','蜡烛','gift','souvenir'],
  home: ['家居','靠垫','花瓶','桌布','收纳','储物','熨衣板','灯具','纺织品','home','decor','furniture'],
  electronics: ['电子','数码','手机壳','数据线','充电器','充电宝','蓝牙','耳机','支架','electronic','usb','cable'],
  beauty: ['美妆','化妆','化妆刷','粉扑','美妆蛋','睫毛夹','指甲锉','洗漱','beauty','cosmetic','makeup'],
  toys: ['玩具','毛绒','拼图','桌游','积木','益智','儿童','toy','plush','puzzle'],
  sports: ['运动','瑜伽','哑铃','跑步','健身','骑行','sport','fitness','yoga'],
  outdoor: ['户外','露营','帐篷','睡袋','登山','背包','outdoor','camping'],
  stationery: ['文具','办公','笔记本','笔','文件夹','stationery','office'],
  auto: ['摩托','头盔','手套','护具','改装','auto','motorcycle'],
};

function mapIndustry(q) {
  const lower = (q || '').toLowerCase();
  for (const [key, terms] of Object.entries(INDUSTRY_MAP)) {
    if (terms.some(t => lower.includes(t) || t.includes(lower))) return key;
  }
  return 'default';
}

// === 各行业开发信模板 ===
const TEMPLATES = {
  kitchen: {
    painPoint: 'UK/EU kitchenware distributors often pay 40-60% markup through middlemen',
    value: 'factory-direct pricing, 40% below typical distributor cost, stainless steel, LFGB/FDA certified',
    callToAction: 'Could we send 3 free samples with your logo for quality evaluation?',
  },
  pet: {
    painPoint: 'Pet toy importers struggle with inconsistent quality and late deliveries',
    value: 'CPSIA/EN71 certified materials, 45-day design-to-delivery, zero-defect rate on last 3 orders',
    callToAction: 'Would a sample pack of our top 5 bestselling pet toys be useful?',
  },
  gift: {
    painPoint: 'Gift wholesalers need unique products at price points that allow 80%+ retail margin',
    value: 'custom designs from $0.07/pc, MOQ 100pcs, 3-7 day sample turnaround, full OEM packaging',
    callToAction: 'Could we create 3 free custom magnet samples based on your preferred themes?',
  },
  home: {
    painPoint: 'Home decor buyers are always looking for unique designs at competitive FOB prices',
    value: 'OEKO-TEX certified fabrics, 5000+ SKU designs refreshed quarterly, 30-day lead time',
    callToAction: 'Would a digital catalog of our latest collection be helpful for your next buying trip?',
  },
  electronics: {
    painPoint: 'Electronics accessories importers deal with CE/FCC certification delays and quality issues',
    value: 'pre-certified USB/Lightning cables, MFi/CE/FCC/ROHS, 0.3% defect rate on last 500K units',
    callToAction: 'Could I send our compliance test reports and 5 free samples for your lab to verify?',
  },
  beauty: {
    painPoint: 'Beauty tool distributors switch suppliers frequently due to inconsistent finishing and late shipments',
    value: 'GMPC-certified facility, 15-day sample turnaround, private label with custom packaging from 500pcs',
    callToAction: 'Shall we prepare 5 branded samples with your logo for a quality check?',
  },
  toys: {
    painPoint: 'Toy importers face increasing regulatory pressure — EN71/ASTM testing costs eat into margins',
    value: 'EN71/ASTM/CPSIA pre-certified, 60-day design-to-shelf, 0 recalls in 5 years across 2M+ units',
    callToAction: 'Would you like our compliance certification package and 3 sample designs to review?',
  },
  sports: {
    painPoint: 'Fitness brands need durable products that survive heavy use and retain customer loyalty',
    value: '500D+ reinforced stitching, 1000-hour abrasion tested, OEM with custom color/logo from 200pcs',
    callToAction: 'Could we send a durability test report and 3 samples with your branding?',
  },
  outdoor: {
    painPoint: 'Outdoor gear importers face long lead times and unpredictable quality from new suppliers',
    value: 'IPX6 waterproof, UV50+ tested, 45-day lead time, 2-year warranty on all OEM orders',
    callToAction: 'Would you be open to reviewing our test certificates and 3 sample units?',
  },
  stationery: {
    painPoint: 'Stationery importers compete on thin margins — every cent in sourcing matters',
    value: 'FSC-certified paper, soy-based ink, MOQ 500pcs, factory-direct pricing 30% below trade shows',
    callToAction: 'Could I send our price list and 5 blank sample notebooks for your evaluation?',
  },
  auto: {
    painPoint: 'Auto parts distributors need ISO-certified suppliers with consistent metallurgy and tolerances',
    value: 'ISO/TS 16949 certified, CNC-machined to ±0.01mm, 20-day lead time, PPAP Level 3 available',
    callToAction: 'Would you like our material certs and 3 sample parts for your QC team to inspect?',
  },
  default: {
    painPoint: 'sourcing costs can be reduced by working directly with factories',
    value: 'factory-direct pricing, full OEM, competitive MOQ, verified quality control',
    callToAction: 'Would you be open to a 15-minute call to explore a potential partnership?',
  },
};

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { company, industry = 'default', market = '英国', contactName = '', domain = '' } = await req.json();
  if (!company) return NextResponse.json({ error: 'Company name required' }, { status: 400 });

  const industryKey = mapIndustry(industry);
  const tpl = TEMPLATES[industryKey] || TEMPLATES.default;

  // Step 1: 客户背调（模拟）
  const research = `Company: ${company}${domain ? ' (' + domain + ')' : ''}\nIndustry: ${industry}\nTarget Market: ${market}\nLikely Product Lines: Imported consumer goods for ${market} retailers`;

  // Step 2: 匹配案例
  const matchedCases = CASES.filter(c => c.industry === industry).slice(0, 2);
  const caseText = matchedCases.length > 0
    ? matchedCases.map(c => `  ${c.text}`).join('\n')
    : '  Factory-direct sourcing partner for multiple UK/EU/US distributors';

  // Step 3: 生成开发信（带随机变化，确保"重写"有效果）
  const greetings = contactName
    ? [`Hi ${contactName},`, `Hello ${contactName},`, `Dear ${contactName},`, `Hi ${contactName}, hope this finds you well.`]
    : ['Dear Sir/Madam,', 'Hello,', 'Dear Purchasing Manager,', 'Dear Sourcing Team,'];
  const opening = greetings[Math.floor(Math.random() * greetings.length)];
  const subject = `${industry.charAt(0).toUpperCase() + industry.slice(1)} products — factory-direct sourcing for ${company}`;

  const intros = [
    `I noticed ${company}${domain ? ' at ' + domain + ' ' : ' '}operates in the ${industry} space for the ${market} market. Quick question — who handles your product sourcing?`,
    `Your work at ${company} in ${industry} caught my eye. I'm reaching out because we help ${market} distributors cut sourcing costs.`,
    `We've been working with several ${market} ${industry} distributors and I thought ${company} might benefit from our factory-direct model.`,
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const body = `${opening}

${intro}

${tpl.painPoint}. We provide ${tpl.value}.

${caseText}

${tpl.callToAction}

Best regards,
跨境蜂`;

  return NextResponse.json({
    research,
    matchedCases,
    subject,
    body,
  });
}
