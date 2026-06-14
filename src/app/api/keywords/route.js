import { NextResponse } from 'next/server';

// 品类 → 子品类 + HS Code + 搜索关键词矩阵
const INDUSTRY_DATA = {
  kitchen: {
    en: 'Kitchen Tools & Gadgets',
    zh: '厨房小工具',
    subcategories: ['Garlic Press', 'Spiralizer', 'Peeler', 'Grater', 'Avocado Slicer', 'Can Opener', 'Measuring Spoons', 'Kitchen Scale'],
    hsCodes: ['8205.51', '8215.99', '7323.93'],
    buyerTypes: ['importer', 'distributor', 'wholesaler', 'kitchenware supplier', 'housewares distributor'],
    markets: ['UK', 'USA', 'Germany', 'Australia', 'UAE', 'Netherlands'],
    searchQueries: [
      'kitchen tools wholesaler UK',
      'housewares distributor USA',
      'kitchen gadgets importer Germany',
      'cookware wholesale Australia',
    ],
  },
  pet: {
    en: 'Pet Supplies',
    zh: '宠物用品',
    subcategories: ['Pet Toys', 'Dog Beds', 'Cat Scratchers', 'Pet Bowls', 'Grooming Tools', 'Pet Leashes', 'Pet Carriers'],
    hsCodes: ['4201.00', '4421.99', '6307.90'],
    buyerTypes: ['pet supplies distributor', 'pet products wholesaler', 'pet store supplier', 'pet toy importer'],
    markets: ['UK', 'USA', 'Germany', 'Australia', 'Canada'],
    searchQueries: ['pet products wholesaler UK', 'dog toys distributor USA', 'pet supplies importer Germany'],
  },
  gift: {
    en: 'Gifts & Souvenirs',
    zh: '礼品纪念品',
    subcategories: ['Fridge Magnets', 'Keychains', 'Mugs', 'Photo Frames', 'Candles', 'Figurines', 'Snow Globes'],
    hsCodes: ['8306.29', '6913.90', '9505.90'],
    buyerTypes: ['gift wholesaler', 'souvenir distributor', 'promotional products supplier', 'corporate gifts importer'],
    markets: ['UK', 'USA', 'UAE', 'Australia', 'France'],
    searchQueries: ['gift wholesaler UK', 'souvenir distributor USA', 'promotional products importer UAE'],
  },
  home: {
    en: 'Home Decor & Garden',
    zh: '家居园艺',
    subcategories: ['Cushion Covers', 'Throw Blankets', 'Wall Art', 'Vases', 'Planters', 'Garden Tools', 'Outdoor Lights'],
    hsCodes: ['9404.90', '6304.92', '6702.10'],
    buyerTypes: ['home decor wholesaler', 'garden products distributor', 'homeware importer', 'interior accessories supplier'],
    markets: ['UK', 'USA', 'Germany', 'Australia', 'Netherlands'],
    searchQueries: ['home decor wholesaler UK', 'garden products distributor USA', 'homeware importer Germany'],
  },
  beauty: {
    en: 'Beauty & Personal Care',
    zh: '美妆个护',
    subcategories: ['Makeup Brushes', 'Cosmetic Bags', 'Nail Files', 'Hair Accessories', 'Beauty Sponges', 'Travel Bottles'],
    hsCodes: ['9603.29', '4202.22', '9615.11'],
    buyerTypes: ['beauty wholesaler', 'cosmetics distributor', 'beauty tools importer', 'personal care supplier'],
    markets: ['UK', 'USA', 'Germany', 'France', 'Australia'],
    searchQueries: ['beauty tools wholesaler UK', 'cosmetics distributor USA', 'beauty accessories importer Germany'],
  },
  stationery: {
    en: 'Stationery & Office',
    zh: '文具办公',
    subcategories: ['Notebooks', 'Pens', 'Sticky Notes', 'Desk Organizers', 'File Folders', 'Calculators', 'Whiteboards'],
    hsCodes: ['4820.10', '9608.10', '3926.10'],
    buyerTypes: ['stationery wholesaler', 'office supplies distributor', 'school supplies importer', 'desk accessories supplier'],
    markets: ['UK', 'USA', 'Germany', 'Australia'],
    searchQueries: ['stationery wholesaler UK', 'office supplies distributor USA', 'school supplies importer Germany'],
  },
  toys: {
    en: 'Toys & Games',
    zh: '玩具游戏',
    subcategories: ['Plush Toys', 'Puzzle Games', 'Fidget Toys', 'Board Games', 'Outdoor Toys', 'Educational Toys', 'Action Figures'],
    hsCodes: ['9503.00', '9504.90'],
    buyerTypes: ['toy wholesaler', 'children products distributor', 'educational toys importer', 'game supplier'],
    markets: ['UK', 'USA', 'Germany', 'Australia', 'Canada'],
    searchQueries: ['toy wholesaler UK', 'games distributor USA', 'educational toys importer Germany'],
  },
  outdoor: {
    en: 'Outdoor & Sports',
    zh: '户外运动',
    subcategories: ['Yoga Mats', 'Water Bottles', 'Camping Tools', 'Gym Bags', 'Cycling Accessories', 'Fishing Gear', 'Picnic Sets'],
    hsCodes: ['9506.91', '4202.92', '7323.93'],
    buyerTypes: ['sports wholesaler', 'outdoor equipment distributor', 'camping supplier', 'fitness products importer'],
    markets: ['UK', 'USA', 'Germany', 'Australia', 'Canada'],
    searchQueries: ['sports accessories wholesaler UK', 'outdoor equipment distributor USA', 'camping supplier Germany'],
  },
  electronics: {
    en: 'Electronics & Accessories',
    zh: '电子配件',
    subcategories: ['Phone Cases', 'Chargers', 'Power Banks', 'Cables', 'Screen Protectors', 'Bluetooth Speakers', 'Earphones'],
    hsCodes: ['8517.70', '8544.42', '8507.60'],
    buyerTypes: ['electronics wholesaler', 'mobile accessories distributor', 'tech gadgets importer', 'phone accessories supplier'],
    markets: ['UK', 'USA', 'Germany', 'UAE', 'Australia'],
    searchQueries: ['phone accessories wholesaler UK', 'electronics distributor USA', 'mobile accessories importer Germany'],
  },
};

export async function POST(req) {
  const { industry, targetMarket = '英国' } = await req.json();
  // 预定义品类 或 自定义关键词
  const data = INDUSTRY_DATA[industry];
  if (data) {
    // 使用预定义品类数据
    const buyerQueries = data.subcategories.flatMap(sub =>
      data.buyerTypes.map(bt => `${sub.toLowerCase()} ${bt} ${targetMarket}`)
    );
    const platformQueries = data.searchQueries.map(q => `${q} ${targetMarket}`);
    return NextResponse.json({
      industry: data,
      searchKeywords: {
        product: data.subcategories.map(s => `${s} supplier ${targetMarket}`),
        buyer: buyerQueries.slice(0, 10),
        b2b: platformQueries,
        googleDorks: data.searchQueries.map(q => `site:alibaba.com "${q}" OR site:made-in-china.com "${q}"`),
      },
      hsCodes: data.hsCodes,
    });
  }

  // 自定义品类：生成通用搜索词
  const buyerTypes = ['importer', 'distributor', 'wholesaler', 'supplier'];
  const buyerQueries = buyerTypes.map(bt => `${industry} ${bt} ${targetMarket}`);
  return NextResponse.json({
    industry: { en: industry, zh: industry },
    searchKeywords: {
      product: [`${industry} supplier ${targetMarket}`, `${industry} factory ${targetMarket}`],
      buyer: buyerQueries,
      b2b: [`${industry} wholesale ${targetMarket}`, `site:alibaba.com "${industry}"`, `site:made-in-china.com "${industry}"`],
      googleDorks: [`"${industry}" "wholesale" "${targetMarket}"`, `site:linkedin.com "${industry}" "buyer"`],
    },
    hsCodes: [],
  });
}
