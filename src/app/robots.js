export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/email-settings/', '/send/', '/search/'],
    },
    sitemap: 'https://b2b.toolbase.fun/sitemap.xml',
  };
}
