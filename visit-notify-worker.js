/**
 * Daneen Visions: visit alerts by SMS
 *
 * A web page can't send a text message by itself, so this tiny server-side
 * function does it. Deploy it (for example as a free Cloudflare Worker),
 * then paste its URL into NOTIFY_ENDPOINT in index.html.
 *
 * Settings to add in the Worker dashboard (Settings > Variables, as secrets):
 *   TWILIO_SID     your Twilio Account SID
 *   TWILIO_TOKEN   your Twilio Auth Token
 *   TWILIO_FROM    your Twilio sender number, e.g. +1xxxxxxxxxx
 *   NOTIFY_TO      +917007996454
 *   ALLOWED_ORIGIN your website address, e.g. https://yourdomain.com
 *
 * Optional: bind a KV namespace called THROTTLE so visit texts are limited
 * to one every 10 minutes instead of one per visitor.
 *
 * Keep these values here, never inside index.html. Anything in index.html
 * is public.
 *
 * Note: sending SMS to Indian numbers usually needs sender registration
 * (DLT) with your SMS provider. If that is a hurdle, ask your provider
 * about WhatsApp or push alerts instead; this same function can be adapted.
 */

const clean = (v, n = 80) => String(v || '').replace(/[^\w .,:@/\-+|]/g, '').slice(0, n);

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('ok', { headers: cors });

    let d = {};
    try { d = JSON.parse(await request.text()); } catch (e) {}

    const type = clean(d.type, 20) || 'visit';

    // Limit visit texts so a busy day doesn't flood your phone or your bill.
    if (type === 'visit' && env.THROTTLE) {
      if (await env.THROTTLE.get('visit')) return new Response('throttled', { headers: cors });
      await env.THROTTLE.put('visit', '1', { expirationTtl: 600 });
    }

    const title =
      type === 'enquiry' ? 'New enquiry on Daneen Visions' :
      type === 'whatsapp click' ? 'Someone tapped WhatsApp on Daneen Visions' :
      'New visitor on Daneen Visions';

    const text = [
      title,
      'Device: ' + clean(d.device, 12),
      'From: ' + clean(d.referrer, 60),
      d.extra ? 'Detail: ' + clean(d.extra, 60) : '',
      'Time: ' + clean(d.time, 30),
    ].filter(Boolean).join('\n');

    const res = await fetch(
      'https://api.twilio.com/2010-04-01/Accounts/' + env.TWILIO_SID + '/Messages.json',
      {
        method: 'POST',
        headers: { Authorization: 'Basic ' + btoa(env.TWILIO_SID + ':' + env.TWILIO_TOKEN) },
        body: new URLSearchParams({ To: env.NOTIFY_TO, From: env.TWILIO_FROM, Body: text }),
      }
    );

    return new Response(res.ok ? 'sent' : 'failed', { status: res.ok ? 200 : 502, headers: cors });
  },
};
