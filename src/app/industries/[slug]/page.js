import { INDUSTRIES, getIndustryBySlug } from '@/lib/industries';
import IndustryPageContent from './IndustryPageContent';

export async function generateStaticParams() {
  return Object.keys(INDUSTRIES).map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  const industry = getIndustryBySlug(slug);
  if (!industry) return { title: '品类未找到' };
  return {
    title: `${industry.zh}外贸客户搜索 - 找海外${industry.zh}采购商联系方式`,
    description: `收录${industry.count.toLocaleString()}+家海外${industry.zh}采购商，覆盖${industry.countries}个市场。输入公司域名查找${industry.keywords.slice(0, 3).join('、')}等${industry.zh}采购决策人邮箱。`,
    keywords: `${industry.zh}外贸,${industry.zh}外贸找客户,${industry.zh}采购商,海外${industry.zh}客户`,
  };
}

export default function IndustryPage({ params }) {
  return <IndustryPageContent slug={params.slug} />;
}
