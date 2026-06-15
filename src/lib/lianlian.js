import crypto from 'crypto';

const API_BASE = 'https://api.lianlianpay.com/v1';

function getConfig() {
  return {
    mchId: process.env.LIANLIAN_MCH_ID || '',
    privateKey: (process.env.LIANLIAN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    publicKey: (process.env.LIANLIAN_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
  };
}

function sign(params, privateKey) {
  const signStr = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] != null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createSign('RSA-SHA256').update(signStr).sign(privateKey, 'base64');
}

function verifySign(params, publicKey, receivedSign) {
  const signStr = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] != null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createVerify('RSA-SHA256').update(signStr).verify(publicKey, receivedSign, 'base64');
}

export function getPaymentUrl() {
  return `${API_BASE}/pay/app-request`;
}

export function buildOrderParams({ orderNo, amount, userId, planKey, notifyUrl, returnUrl }) {
  const { mchId, privateKey } = getConfig();

  const params = {
    oid_partner: mchId,
    sign_type: 'RSA',
    no_order: orderNo,
    dt_order: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
    money_order: String(Math.round(amount * 100)),
    name_goods: `跨境蜂-${planKey}`,
    info_order: `升级套餐: ${planKey}`,
    notify_url: notifyUrl,
    user_id: userId,
    risk_item: JSON.stringify({ user_info_mercht_userno: userId }),
  };

  params.sign = sign(params, privateKey);
  return params;
}

export async function lianlianRequest(url, params) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    body.append(k, String(v));
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return res.json();
}

export function verifyNotify(params) {
  const { publicKey } = getConfig();
  const receivedSign = params.sign;
  if (!receivedSign) return false;
  return verifySign(params, publicKey, receivedSign);
}

export function genOrderNo() {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KF${ts}${rand}`;
}
