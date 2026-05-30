// Vercel Serverless Function — proxy to Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwp2Qsbwdi8BooXadJv0iYUNzabPxigRPnm8cFs_DckUc05fxKdFlBU6VQk-zLKT6RR/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let gasRes;

    if (req.method === 'POST') {
      // Send as real POST to Apps Script doPost — no URL length limit
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
    } else {
      // GET — read operations only, payload is small
      const qs = new URLSearchParams(req.query).toString();
      const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
      gasRes = await fetch(url, { redirect: 'follow' });
    }

    const text = await gasRes.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      // Strip HTML tags from error for cleaner message
      const clean = text.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().substring(0,200);
      console.error('GAS non-JSON:', clean);
      return res.status(200).json({ ok: false, error: clean || 'Non-JSON response from Apps Script' });
    }

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
