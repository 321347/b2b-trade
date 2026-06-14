export const metadata = { title: '隐私政策 - 跨境蜂' };

export default function Privacy() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px', fontSize: 14, lineHeight: 2, color: '#475569' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>隐私政策</h1>
      <p>最后更新：2026年6月13日</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 28 }}>1. 我们收集的信息</h2>
      <p>注册时收集：邮箱地址、姓名（选填）。使用服务时收集：搜索产品词、发送的邮件内容、SMTP 配置（仅存储在您的浏览器本地）。</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 28 }}>2. 信息的使用</h2>
      <p>您的邮箱用于账号登录和发送测试邮件。产品搜索词用于改进搜索匹配结果。您的 SMTP 配置仅存储在浏览器 localStorage 中，不会上传到服务器。您的开发信内容和联系人邮箱仅用于完成邮件发送，发送后不留存。</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 28 }}>3. 信息的存储</h2>
      <p>账号信息存储在 Supabase（欧盟数据中心）。搜索缓存数据存储在项目服务器。您的 SMTP 密码和邮件配置存储在您自己的浏览器中，我们无法访问。</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 28 }}>4. 信息安全</h2>
      <p>我们采用行业标准的安全措施保护您的信息。API 请求通过 HTTPS 加密传输。</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginTop: 28 }}>5. 联系我们</h2>
      <p>如有隐私相关问题，请联系：contact@aifusion.icu</p>
    </div>
  );
}
