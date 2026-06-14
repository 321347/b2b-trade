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

  const tpl = TEMPLATES[industry] || TEMPLATES.default;

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
鱼获科技`;

  return NextResponse.json({
    research,
    matchedCases,
    subject,
    body,
  });
}
