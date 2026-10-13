'use strict';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const upstream = process.env.KATABUMP_PAIRING_URL;
  const secret = process.env.PAIRING_API_SECRET;
  if (!upstream || !secret) {
    return res.status(503).json({ error: 'Pairing service is not configured yet. Please contact the administrator.' });
  }

  let number = String(req.body?.number || '').replace(/[\s()+-]/g, '');
  if (!/^\d{8,15}$/.test(number) || number.startsWith('0')) {
    return res.status(400).json({ error: 'Enter the full international number with country code, digits only, without a leading 0.' });
  }

  let target;
  try { target = new URL(upstream); }
  catch (_) { return res.status(500).json({ error: 'Pairing endpoint URL is invalid.' }); }
  if (target.protocol !== 'https:' && target.hostname !== 'localhost' && target.hostname !== '127.0.0.1') {
    return res.status(500).json({ error: 'The pairing endpoint must use HTTPS.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(target.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ number }),
      signal: controller.signal,
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = [400, 401, 409, 429, 502, 503].includes(response.status) ? response.status : 502;
      return res.status(status).json({ error: data.error || 'The bot server could not create a pairing code.' });
    }
    if (typeof data.code !== 'string' || !data.code) {
      return res.status(502).json({ error: 'The bot server returned an invalid response.' });
    }
    return res.status(200).json({ code: data.code, message: data.message || 'Enter this code in WhatsApp Linked Devices.' });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return res.status(502).json({ error: timedOut ? 'The bot server took too long to respond. Try again shortly.' : 'Cannot reach the bot server. Check that it is online and its pairing port is reachable.' });
  } finally {
    clearTimeout(timeout);
  }
};
