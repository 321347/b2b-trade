import { NextResponse } from 'next/server';
import { decrementQuota, getUserQuota } from '@/lib/quota';
import { checkRateLimit } from '@/lib/rate-limit';

// 硬编码兜底数据库（Supabase不可用时使用）
const COMPANY_DB = [
  { company:'EPE International',domain:'epeinternational.com',market:'英国',emails:['tracey@epeinternational.com','kal@epeinternational.com'],keywords:'kitchen,houseware,beko,russell hobbs,tefal,厨房,家居,小家电,锅具,电器,厨具,烘焙,刀具,餐具,压蒜器,削皮器,切菜器' },
  { company:'Burton McCall',domain:'burton-mccall.com',market:'英国',emails:['georgia.ryman@burton-mccall.com','nik.aveyard@burton-mccall.com'],keywords:'kitchen,victorinox,peugeot,fissler,厨房,刀具,厨具,瑞士军刀,不锈钢,切菜器,削皮刀,剪刀' },
  { company:'Brabantia',domain:'brabantia.com',market:'英国',emails:['maarten.staes@brabantia.com','laura.krupa@brabantia.com'],keywords:'kitchen,home,bin,laundry,drying,storage,熨衣板,清洁,生活用品,收纳' },
  { company:'What More UK',domain:'whatmoreuk.com',market:'英国',emails:['j.makin@whatmoreuk.com'],keywords:'kitchen,houseware,bakeware,storage,塑料制品,家居,花园,储物盒,烤盘,烘焙工具' },
  { company:'KitchenCraft',domain:'creative-tops.com',market:'英国',emails:['Katrina.Lawton@creative-tops.com'],keywords:'kitchen,masterclass,barcraft,artesa,chefn,厨房小工具,蛋糕模,打蛋器,量杯,锅铲,开瓶器' },
  { company:'Bradshaw Home',domain:'bradshawhome.com',market:'美国',emails:['julie.grande@bradshawhome.com','tim.young@bradshawhome.com'],keywords:'kitchen,goodcook,betty crocker,oneida,家居用品,炊具,餐具,量勺,削皮器,厨房小工具' },
  { company:'Wasserstrom',domain:'wasserstrom.com',market:'美国',emails:['allisonkrepop@wasserstrom.com'],keywords:'kitchen,restaurant,foodservice,商用厨房,不锈钢,酒店用品,后厨设备,厨具' },
  { company:'Joe Davies',domain:'joedavies.co.uk',market:'英国',emails:['collette.whitehurst@joedavies.co.uk','sam.jones@joedavies.co.uk'],keywords:'gift,novelty,plush,家居装饰,毛绒玩具,圣诞,纪念品,摆件,收藏品' },
  { company:'Jones Wholesale',domain:'joneswholesale.co.uk',market:'英国',emails:['simonallitt@joneswholesale.co.uk'],keywords:'cookware,tableware,pet,cleaning,bedding,gift,toy,五金,日用百货,厨具,餐具,宠物用品,床上用品' },
  { company:'Pedigree Wholesale',domain:'petproducts.co.uk',market:'英国',emails:['quintene@petproducts.co.uk','julian.grindey@petproducts.co.uk'],keywords:'pet,dog,cat,toy,accessory,bowl,鸟,鱼,小动物,宠物用品,狗狗玩具,猫抓板,猫玩具,宠物食盆' },
  { company:'Trust Pet Products',domain:'trustpet.co.uk',market:'英国',emails:['richard@trustpet.co.uk','mick@trustpet.co.uk'],keywords:'pet,dog,cat,toy,美容,梳子,指甲剪,牵引绳,项圈,狗链,猫玩具' },
  { company:'Petlife International',domain:'petlifeonline.co.uk',market:'英国',emails:['sales@petlifeonline.co.uk'],keywords:'pet,vetbed,van ness,dog,cat,窝垫,宠物床,垫子,毛毯,宠物用品,猫窝,狗窝' },
  { company:'Tavo Pets',domain:'tavopets.com',market:'全球',emails:['praveen.jangbahadoer@tavopets.com','kimberly.dibke@tavopets.com'],keywords:'pet,dog,carrier,travel,bowl,car seat cover,车载,安全座椅,出行,宠物背包,车载食盆' },
  { company:'A.B. Gee',domain:'abgee.co.uk',market:'英国',emails:['anna.vaughan@abgee.co.uk','steve.tress@abgee.co.uk'],keywords:'toy,game,hasbro,mattel,funko,spin master,plush,collectible,儿童,小孩,益智,桌游,积木,拼图,娃娃' },
  { company:'Reydon Sports',domain:'reydonsports.com',market:'英国',emails:['peter@reydonsports.com','aron@reydonsports.com'],keywords:'toy,sport,outdoor,nerf,franklin,football,户外运动,球类,飞镖,休闲,足球,篮球' },
  { company:'Brainstorm',domain:'brainstormltd.co.uk',market:'英国',emails:['nsaunders@brainstormltd.co.uk'],keywords:'toy,STEM,educational,creative,科学,儿童,学习,实验,手工,编程,机器人,智力玩具' },
  { company:'One For Fun',domain:'oneforfun.com',market:'英国',emails:['steven.fuller@oneforfun.com','claire.bates@oneforfun.com'],keywords:'toy,game,gadget,HGL,tobar,ozbozz,小玩意,新奇品,儿童玩具,零花钱,小玩具,派对用品' },
  { company:'Basic Fun',domain:'basicfun.com',market:'美国',emails:['christine.brent@basicfun.com'],keywords:'toy,care bears,lite brite,madballs,收藏品,授权,儿童,卡通,公仔,手办,动漫周边' },
  { company:'Second Chance',domain:'secondchance.co.uk',market:'英国',emails:['charlotte@secondchance.co.uk','richard@secondchance.co.uk'],keywords:'sport,fitness,golf,cycling,football,tennis,钓鱼,户外,可穿戴,瑜伽,哑铃,跑步,健身器材' },
  { company:'Exped',domain:'exped.com',market:'全球',emails:['johannes@exped.com','domenic@exped.com'],keywords:'outdoor,camping,tent,sleeping bag,backpack,徒步,旅行,探险,登山,野餐,折叠椅,露营灯' },
  { company:'Puckator',domain:'puckator.co.uk',market:'英国',emails:['buying@puckator.co.uk'],keywords:'gift,souvenir,collectible,homeware,seasonal,圣诞,新奇品,装饰,冰箱贴,钥匙扣,相框,蜡烛,礼品' },
  { company:'Booker Promotions',domain:'bookerpromo.com',market:'美国',emails:['scott@bookerpromo.com','elle@bookerpromo.com'],keywords:'promo,promotional,corporate gift,branded,merchandise,赠品,logo定制,广告礼品,展会礼品,企业定制,促销品' },
  { company:'Globe West',domain:'globewest.com.au',market:'澳大利亚',emails:['briony.miles@globewest.com.au'],keywords:'home,furniture,decor,accessory,interior,灯具,纺织品,靠垫,摆件,花瓶,相框,桌布' },
  { company:'NF Homewares',domain:'nf.com.au',market:'澳大利亚',emails:['sales@nf.com.au','wayne@nf.com.au'],keywords:'home,gift,decor,kitchen,gadget,季节性,摆件,花瓶,收纳,桌布,厨房小工具' },
  { company:'Prime Wholesale',domain:'primewholesale.co.uk',market:'英国',emails:['sales@primewholesale.co.uk'],keywords:'beauty,cosmetic,makeup,personal care,skincare,护发,洗漱,化妆刷,粉扑,美妆蛋,睫毛夹,指甲锉' },
  { company:'Exertis',domain:'exertis.co.uk',market:'英国',emails:['simon.woodman@exertis.co.uk','dinesh.joshi@exertis.co.uk'],keywords:'electronic,tech,IT,mobile,accessory,charger,cable,数码,充电宝,耳机,蓝牙,手机壳,支架,数据线,充电器' },
  { company:'JGBM Ltd',domain:'jgbm.co.uk',market:'英国',emails:['simon.sanders@jgbm.co.uk'],keywords:'tech,office,printer,toner,supplies,electronic,电脑,文具,办公用品,打印机配件,墨粉,硒鼓' },
  { company:'Combined Book Services',domain:'combook.co.uk',market:'英国',emails:['keith.neale@combook.co.uk','sarah.hancock@combook.co.uk'],keywords:'book,stationery,notebook,office,publishing,print,reading' },
  { company:'Bickers Powersports',domain:'bickerspowersports.co.uk',market:'英国',emails:['neil.fullerton@bickerspowersports.co.uk'],keywords:'motorcycle,bike,powersport,accessory,工具,零件,头盔,骑行,改装,手套,护具,车载支架,手机架' },
];

const CATEGORY_MAP = {
  '厨房':['EPE International','Burton McCall','Brabantia','What More UK','KitchenCraft','Bradshaw Home','Wasserstrom'],
  '厨具':['EPE International','Burton McCall','KitchenCraft','Bradshaw Home','Wasserstrom'],
  '宠物':['Pedigree Wholesale','Trust Pet Products','Petlife International','Tavo Pets','Jones Wholesale'],
  '玩具':['A.B. Gee','Reydon Sports','Brainstorm','One For Fun','Basic Fun','Joe Davies'],
  '运动':['Second Chance','Reydon Sports'],
  '户外':['Exped','Second Chance'],
  '礼品':['Puckator','Booker Promotions','Joe Davies'],
  '家居':['Globe West','NF Homewares','Brabantia','Puckator'],
  '电子':['Exertis','JGBM Ltd'],
  '数码':['Exertis'],
  '办公':['JGBM Ltd','Combined Book Services'],
  '文具':['Combined Book Services'],
  '五金':['Bickers Powersports'],
  '摩托':['Bickers Powersports'],
  '骑行':['Bickers Powersports'],
  '美妆':['Prime Wholesale'],
  '化妆':['Prime Wholesale'],
  '宠物用品':['Pedigree Wholesale','Trust Pet Products','Petlife International','Tavo Pets'],
  '小家电':['EPE International'],
  '压蒜器':['EPE International','Burton McCall','KitchenCraft','Bradshaw Home','Jones Wholesale'],
  '切菜器':['EPE International','Burton McCall','KitchenCraft','Bradshaw Home'],
  '削皮器':['EPE International','KitchenCraft','Bradshaw Home'],
  '锅具':['EPE International','Bradshaw Home','Jones Wholesale'],
  '烘焙':['KitchenCraft','What More UK','Bradshaw Home'],
  '刀具':['Burton McCall','EPE International'],
  '锅铲':['KitchenCraft','Bradshaw Home'],
  '收纳':['Brabantia','What More UK'],
  '清洁':['Brabantia','Jones Wholesale'],
  '烤盘':['What More UK','KitchenCraft'],
  '储物':['Brabantia','What More UK'],
  '狗':['Pedigree Wholesale','Trust Pet Products','Tavo Pets','Jones Wholesale'],
  '猫':['Pedigree Wholesale','Trust Pet Products'],
  '牵引绳':['Trust Pet Products'],
  '项圈':['Trust Pet Products'],
  '窝':['Petlife International'],
  '垫子':['Petlife International'],
  '宠物碗':['Pedigree Wholesale'],
  '宠物玩具':['Pedigree Wholesale','Trust Pet Products'],
  '毛绒玩具':['Joe Davies','A.B. Gee'],
  '益智':['Brainstorm','A.B. Gee'],
  '拼图':['Brainstorm','A.B. Gee'],
  '智能手机':['Exertis','JGBM Ltd'],
  '手机壳':['Exertis'],
  '数据线':['Exertis'],
  '充电器':['Exertis'],
  '充电宝':['Exertis'],
  '蓝牙':['Exertis'],
  '耳机':['Exertis'],
  '瑜伽':['Second Chance'],
  '健身':['Second Chance'],
  '哑铃':['Second Chance'],
  '跑步':['Second Chance'],
  '露营':['Exped'],
  '帐篷':['Exped'],
  '睡袋':['Exped'],
  '背包':['Exped'],
  '登山':['Exped'],
  '香薰':['Puckator'],
  '蜡烛':['Puckator'],
  '相框':['Globe West','Puckator'],
  '抱枕':['Globe West'],
  '花瓶':['Globe West','NF Homewares'],
  '桌布':['Globe West','NF Homewares'],
  '靠垫':['Globe West'],
  '化妆刷':['Prime Wholesale'],
  '粉扑':['Prime Wholesale'],
  '美妆蛋':['Prime Wholesale'],
  '睫毛夹':['Prime Wholesale'],
  '打印机':['JGBM Ltd'],
  '墨盒':['JGBM Ltd'],
  '硒鼓':['JGBM Ltd'],
  '笔记本':['Combined Book Services'],
  '摩托车':['Bickers Powersports'],
  '头盔':['Bickers Powersports'],
  '手套':['Bickers Powersports'],
  '手机支架':['Bickers Powersports','Exertis'],
  '保温杯':['EPE International'],
};

// 尝试从 Supabase 查询
async function querySupabase(q, queryTerms) {
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();

    const term = queryTerms.join(' ');
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`keywords.ilike.%${term}%,company.ilike.%${q}%,domain.ilike.%${q}%`)
      .limit(50);

    if (error || !data || data.length === 0) return null;

    return data.map(c => ({
      company: c.company,
      domain: c.domain,
      market: c.market,
      emails: c.emails || [],
      keywords: c.keywords || '',
    }));
  } catch {
    return null;
  }
}

function matchLocal(q, queryTerms) {
  let categoryMatches = [];
  for (const [cat, names] of Object.entries(CATEGORY_MAP)) {
    if (queryTerms.some(qt => cat.includes(qt) || qt.includes(cat))) {
      categoryMatches = COMPANY_DB.filter(c => names.includes(c.company)).map(c => c.company);
    }
  }

  return COMPANY_DB.filter(c => {
    if (categoryMatches.includes(c.company)) return true;
    const kwList = c.keywords.split(',').map(k => k.trim());
    return kwList.some(kw => queryTerms.some(qt => kw.includes(qt) || qt.includes(kw)))
      || c.company.toLowerCase().includes(q) || c.domain.includes(q);
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const market = (searchParams.get('market') || '');

  if (!q) return NextResponse.json({ companies: [], total: 0 });

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit('search', ip);
  if (!rl.allowed) return NextResponse.json({ error: '搜索太频繁，请稍后再试' }, { status: 429 });

  // 未登录用户：IP 每日搜索上限 10 次
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    const ipDaily = await checkRateLimit('anonSearch', ip);
    if (!ipDaily.allowed) return NextResponse.json({ error: '免费搜索次数已用完，请注册获取 10 次搜索', needLogin: true }, { status: 429 });
  }

  const queryTerms = q.split(/[\s,，]+/).filter(t => t.length > 0);

  // 1️⃣ 先查 Supabase
  let results = await querySupabase(q, queryTerms);

  // 2️⃣ Supabase 没有则用本地硬编码兜底
  if (!results) {
    results = matchLocal(q, queryTerms);
  }

  // 按市场过滤（全球的始终保留）
  if (market && results.length > 0) {
    results = results.filter(c => !c.market || c.market === '全球' || c.market === market);
  }

  // 零结果时推荐有覆盖的产品词，同时记录日志
  let suggestions = [];
  if (results.length === 0 && q.length > 0) {
    console.log('[ZERO_RESULT]', JSON.stringify({ q, ip, time: new Date().toISOString() }));
    const allTerms = Object.keys(CATEGORY_MAP);
    suggestions = allTerms
      .filter(t => queryTerms.some(qt => t.includes(qt) || qt.includes(t)))
      .slice(0, 8);
    if (suggestions.length < 5) {
      const hot = ['厨房','宠物','玩具','运动','户外','礼品','家居','电子','美妆','文具','五金','压蒜器','宠物玩具','化妆刷','充电器','瑜伽垫','冰箱贴','毛绒玩具'];
      for (const h of hot) {
        if (!suggestions.includes(h)) suggestions.push(h);
        if (suggestions.length >= 8) break;
      }
    }
  }

  // 有结果时消耗配额
  let quota = { remaining: -1, total: 25 };
  if (results.length > 0) {
    const qr = await decrementQuota(req);
    if (qr) quota = qr;
  } else {
    const qr = await getUserQuota(req);
    if (qr) quota = qr;
  }

  return NextResponse.json({ companies: results, total: results.length, query: q, suggestions, quota });
}
