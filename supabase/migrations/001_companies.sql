-- 公司数据库表：客户每次搜索时先查这里，搜不到再调外站API
-- 在 Supabase SQL Editor 中运行此文件：https://supabase.com/dashboard/project/fyfwtcdasglawebgcwwg/sql

CREATE TABLE IF NOT EXISTS public.companies (
  id SERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  domain TEXT NOT NULL,
  market TEXT DEFAULT 'UK',
  emails TEXT[] DEFAULT '{}',
  keywords TEXT DEFAULT '',
  category TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',  -- manual / hunter / apollo
  search_count INT DEFAULT 0,    -- 被搜索命中次数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_keywords ON public.companies USING GIN(to_tsvector('simple', keywords));
CREATE INDEX IF NOT EXISTS idx_companies_search_count ON public.companies(search_count DESC);

-- RLS：所有人可读，仅认证用户可写入
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert companies" ON public.companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update companies" ON public.companies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 种子数据（现有28家公司）
INSERT INTO public.companies (company, domain, market, emails, keywords, category) VALUES
('EPE International','epeinternational.com','英国','{"tracey@epeinternational.com","kal@epeinternational.com"}','kitchen,houseware,beko,russell hobbs,tefal,厨房,家居,小家电,锅具,电器,厨具,烘焙,刀具,餐具,压蒜器,削皮器,切菜器','厨房'),
('Burton McCall','burton-mccall.com','英国','{"georgia.ryman@burton-mccall.com","nik.aveyard@burton-mccall.com"}','kitchen,victorinox,peugeot,fissler,厨房,刀具,厨具,瑞士军刀,不锈钢,切菜器,削皮刀,剪刀','厨房'),
('Brabantia','brabantia.com','英国','{"maarten.staes@brabantia.com","laura.krupa@brabantia.com"}','kitchen,home,bin,laundry,drying,storage,熨衣板,清洁,生活用品,收纳','家居'),
('What More UK','whatmoreuk.com','英国','{"j.makin@whatmoreuk.com"}','kitchen,houseware,bakeware,storage,塑料制品,家居,花园,储物盒,烤盘,烘焙工具','厨房'),
('KitchenCraft','creative-tops.com','英国','{"Katrina.Lawton@creative-tops.com"}','kitchen,masterclass,barcraft,artesa,chefn,厨房小工具,蛋糕模,打蛋器,量杯,锅铲,开瓶器','厨房'),
('Bradshaw Home','bradshawhome.com','美国','{"julie.grande@bradshawhome.com","tim.young@bradshawhome.com"}','kitchen,goodcook,betty crocker,oneida,家居用品,炊具,餐具,量勺,削皮器,厨房小工具','厨房'),
('Wasserstrom','wasserstrom.com','美国','{"allisonkrepop@wasserstrom.com"}','kitchen,restaurant,foodservice,商用厨房,不锈钢,酒店用品,后厨设备,厨具','厨房'),
('Joe Davies','joedavies.co.uk','英国','{"collette.whitehurst@joedavies.co.uk","sam.jones@joedavies.co.uk"}','gift,novelty,plush,家居装饰,毛绒玩具,圣诞,纪念品,摆件,收藏品','礼品'),
('Jones Wholesale','joneswholesale.co.uk','英国','{"simonallitt@joneswholesale.co.uk"}','cookware,tableware,pet,cleaning,bedding,gift,toy,五金,日用百货,厨具,餐具,宠物用品,床上用品','厨房'),
('Pedigree Wholesale','petproducts.co.uk','英国','{"quintene@petproducts.co.uk","julian.grindey@petproducts.co.uk"}','pet,dog,cat,toy,accessory,bowl,鸟,鱼,小动物,宠物用品,狗狗玩具,猫抓板,猫玩具,宠物食盆','宠物'),
('Trust Pet Products','trustpet.co.uk','英国','{"richard@trustpet.co.uk","mick@trustpet.co.uk"}','pet,dog,cat,toy,美容,梳子,指甲剪,牵引绳,项圈,狗链,猫玩具','宠物'),
('Petlife International','petlifeonline.co.uk','英国','{"sales@petlifeonline.co.uk"}','pet,vetbed,van ness,dog,cat,窝垫,宠物床,垫子,毛毯,宠物用品,猫窝,狗窝','宠物'),
('Tavo Pets','tavopets.com','全球','{"praveen.jangbahadoer@tavopets.com","kimberly.dibke@tavopets.com"}','pet,dog,carrier,travel,bowl,car seat cover,车载,安全座椅,出行,宠物背包,车载食盆','宠物'),
('A.B. Gee','abgee.co.uk','英国','{"anna.vaughan@abgee.co.uk","steve.tress@abgee.co.uk"}','toy,game,hasbro,mattel,funko,spin master,plush,collectible,儿童,小孩,益智,桌游,积木,拼图,娃娃','玩具'),
('Reydon Sports','reydonsports.com','英国','{"peter@reydonsports.com","aron@reydonsports.com"}','toy,sport,outdoor,nerf,franklin,football,户外运动,球类,飞镖,休闲,足球,篮球','运动'),
('Brainstorm','brainstormltd.co.uk','英国','{"nsaunders@brainstormltd.co.uk"}','toy,STEM,educational,creative,科学,儿童,学习,实验,手工,编程,机器人,智力玩具','玩具'),
('One For Fun','oneforfun.com','英国','{"steven.fuller@oneforfun.com","claire.bates@oneforfun.com"}','toy,game,gadget,HGL,tobar,ozbozz,小玩意,新奇品,儿童玩具,零花钱,小玩具,派对用品','玩具'),
('Basic Fun','basicfun.com','美国','{"christine.brent@basicfun.com"}','toy,care bears,lite brite,madballs,收藏品,授权,儿童,卡通,公仔,手办,动漫周边','玩具'),
('Second Chance','secondchance.co.uk','英国','{"charlotte@secondchance.co.uk","richard@secondchance.co.uk"}','sport,fitness,golf,cycling,football,tennis,钓鱼,户外,可穿戴,瑜伽,哑铃,跑步,健身器材','运动'),
('Exped','exped.com','全球','{"johannes@exped.com","domenic@exped.com"}','outdoor,camping,tent,sleeping bag,backpack,徒步,旅行,探险,登山,野餐,折叠椅,露营灯','户外'),
('Puckator','puckator.co.uk','英国','{"buying@puckator.co.uk"}','gift,souvenir,collectible,homeware,seasonal,圣诞,新奇品,装饰,冰箱贴,钥匙扣,相框,蜡烛,礼品','礼品'),
('Booker Promotions','bookerpromo.com','美国','{"scott@bookerpromo.com","elle@bookerpromo.com"}','promo,promotional,corporate gift,branded,merchandise,赠品,logo定制,广告礼品,展会礼品,企业定制,促销品','礼品'),
('Globe West','globewest.com.au','澳大利亚','{"briony.miles@globewest.com.au"}','home,furniture,decor,accessory,interior,灯具,纺织品,靠垫,摆件,花瓶,相框,桌布','家居'),
('NF Homewares','nf.com.au','澳大利亚','{"sales@nf.com.au","wayne@nf.com.au"}','home,gift,decor,kitchen,gadget,季节性,摆件,花瓶,收纳,桌布,厨房小工具','家居'),
('Prime Wholesale','primewholesale.co.uk','英国','{"sales@primewholesale.co.uk"}','beauty,cosmetic,makeup,personal care,skincare,护发,洗漱,化妆刷,粉扑,美妆蛋,睫毛夹,指甲锉','美妆'),
('Exertis','exertis.co.uk','英国','{"simon.woodman@exertis.co.uk","dinesh.joshi@exertis.co.uk"}','electronic,tech,IT,mobile,accessory,charger,cable,数码,充电宝,耳机,蓝牙,手机壳,支架,数据线,充电器','电子'),
('JGBM Ltd','jgbm.co.uk','英国','{"simon.sanders@jgbm.co.uk"}','tech,office,printer,toner,supplies,electronic,电脑,文具,办公用品,打印机配件,墨粉,硒鼓','电子'),
('Combined Book Services','combook.co.uk','英国','{"keith.neale@combook.co.uk","sarah.hancock@combook.co.uk"}','book,stationery,notebook,office,publishing,print,reading','文具'),
('Bickers Powersports','bickerspowersports.co.uk','英国','{"neil.fullerton@bickerspowersports.co.uk"}','motorcycle,bike,powersport,accessory,工具,零件,头盔,骑行,改装,手套,护具,车载支架,手机架','五金');
