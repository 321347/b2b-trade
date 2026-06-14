// providers.js - 多源邮箱查找 Provider

export const PROVIDERS = {
  hunter: { name: 'hunter', label: 'Hunter.io', monthlyQuota: 75, priority: 2 },
  anymailfinder: { name: 'anymailfinder', label: 'Anymailfinder', monthlyQuota: 50, priority: 3 },
  findymail: { name: 'findymail', label: 'Findymail', monthlyQuota: 50, priority: 4 },
  apollo: { name: 'apollo', label: 'Apollo.io', monthlyQuota: 100, priority: 1 },
};

function getKeys() {
  return {
    HUNTER_API_KEY: process.env.HUNTER_API_KEY || '',
    ANYMAILFINDER_KEY: process.env.ANYMAILFINDER_KEY || '',
    FINDYMAIL_KEY: process.env.FINDYMAIL_KEY || '',
    APOLLO_API_KEY: process.env.APOLLO_API_KEY || '',
  };
}

// ============ Hunter ============
async function searchHunter(domain) {
  const key = getKeys().HUNTER_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}`
  );
  if (res.status === 429) return { error: 'rate_limit', provider: 'hunter' };
  if (!res.ok) return null;

  const json = await res.json();
  if (!json.data) return null;

  const emails = (json.data.emails || []).map((e) => ({
    email: e.value,
    firstName: e.first_name || '',
    lastName: e.last_name || '',
    position: e.position || '',
    confidence: e.confidence || 0,
    source: 'hunter',
    verified: e.verification?.result === 'deliverable',
  }));

  return {
    provider: 'hunter',
    domain: json.data.domain,
    emails,
    quotaUsed: json.data?.requests?.used || 1,
    quotaTotal: json.data?.requests?.available || 75,
  };
}

// ============ Anymailfinder ============
async function searchAnymailfinder(domain) {
  const key = getKeys().ANYMAILFINDER_KEY;
  if (!key) return null;

  const res = await fetch('https://anymailfinder.com/api/5.0/search/domain.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `api_key=${key}&domain=${encodeURIComponent(domain)}&count=50`,
  });
  if (res.status === 429) return { error: 'rate_limit', provider: 'anymailfinder' };
  if (!res.ok) return null;

  const json = await res.json();
  if (!json.data) return null;

  const emails = (json.data.emails || []).map((e) => ({
    email: e.email,
    firstName: e.first_name || '',
    lastName: e.last_name || '',
    position: e.title || '',
    confidence: e.confidence || 0,
    source: 'anymailfinder',
    verified: e.is_verified || false,
  }));

  return { provider: 'anymailfinder', domain, emails, quotaUsed: 1, quotaTotal: 50 };
}

// ============ Findymail ============
async function searchFindymail(domain) {
  const key = getKeys().FINDYMAIL_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://api.findymail.com/v1/search/domain?domain=${encodeURIComponent(domain)}&limit=50`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  if (res.status === 429) return { error: 'rate_limit', provider: 'findymail' };
  if (!res.ok) return null;

  const json = await res.json();
  if (!json.results) return null;

  const emails = json.results.map((e) => ({
    email: e.email,
    firstName: e.first_name || '',
    lastName: e.last_name || '',
    position: e.position || '',
    confidence: e.score || 0,
    source: 'findymail',
    verified: e.verified || false,
  }));

  return { provider: 'findymail', domain, emails, quotaUsed: 1, quotaTotal: 50 };
}

// ============ Apollo ============
async function searchApollo(domain) {
  const key = getKeys().APOLLO_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      q_organization_domains: domain,
      per_page: 50,
      page: 1,
    }),
  });
  if (res.status === 429) return { error: 'rate_limit', provider: 'apollo' };
  if (!res.ok) return null;

  const json = await res.json();
  const people = json.people || [];

  const emails = people
    .filter((p) => p.email)
    .map((p) => ({
      email: p.email,
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      position: p.title || '',
      confidence: p.email_status === 'verified' ? 95 : 60,
      source: 'apollo',
      verified: p.email_status === 'verified',
    }));

  return { provider: 'apollo', domain, emails, quotaUsed: 1, quotaTotal: 100 };
}

// ============ 路由 ============
const SEARCH_FNS = {
  hunter: searchHunter,
  anymailfinder: searchAnymailfinder,
  findymail: searchFindymail,
  apollo: searchApollo,
};

export async function searchAllProviders(domain, quotaState) {
  const available = Object.values(PROVIDERS)
    .filter((p) => (quotaState[p.name]?.usedThisMonth || 0) < p.monthlyQuota)
    .sort((a, b) => a.priority - b.priority);

  if (available.length === 0) return { error: 'all_quota_exhausted', providers: {} };

  const results = {};
  const allEmails = new Map();

  for (const provider of available) {
    try {
      const fn = SEARCH_FNS[provider.name];
      const result = await fn(domain);

      if (result?.error === 'rate_limit') {
        results[provider.name] = { error: 'rate_limit' };
        continue;
      }

      if (result?.emails) {
        results[provider.name] = result;
        for (const e of result.emails) {
          const existing = allEmails.get(e.email);
          if (!existing || e.confidence > existing.confidence) {
            allEmails.set(e.email, e);
          }
        }
      }
    } catch (err) {
      results[provider.name] = { error: err.message };
    }
  }

  return {
    emails: Array.from(allEmails.values()),
    providers: results,
    totalFound: allEmails.size,
  };
}

export { getKeys };
