// Vercel Serverless Function — proxy to Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwp2Qsbwdi8BooXadJv0iYUNzabPxigRPnm8cFs_DckUc05fxKdFlBU6VQk-zLKT6RR/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let url = GAS_URL;

    if (req.method === 'POST') {
      const payload = encodeURIComponent(JSON.stringify(req.body));
      url = `${GAS_URL}?payload=${payload}`;
    } else {
      const qs = new URLSearchParams(req.query).toString();
      if (qs) url = `${GAS_URL}?${qs}`;
    }

    // Follow redirects manually to handle Apps Script redirect chain
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });

    const text = await response.text();

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      // If not JSON, check if it looks like an error page
      console.error('Non-JSON response:', text.substring(0, 200));
      return res.status(200).json({ ok: false, error: 'Apps Script returned non-JSON: ' + text.substring(0, 100) });
    }

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
