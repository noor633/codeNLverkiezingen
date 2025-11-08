// sw.js
// Service Worker used to persist a "voted" flag in CacheStorage and respond to messages.

const CACHE_NAME = 'nl-stem-cache-v1';
const VOTED_KEY = '/voted-flag';
const VOTED_FP_KEY = '/voted-fp';
const VOTED_EMAIL_KEY = '/voted-email';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('message', async (ev) => {
  const msg = ev.data || {};
  const srcClient = ev.source;
  try {
    if (msg && msg.type === 'set-voted') {
      const payload = msg.payload || { ts: Date.now() };
      const cache = await caches.open(CACHE_NAME);
      const resp = new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' }
      });
      // store main flag
      await cache.put(VOTED_KEY, resp);
      // optionally store fp/email separately if present
      if(payload.fp){
        await cache.put(VOTED_FP_KEY, new Response(JSON.stringify({ ts: payload.ts || Date.now(), fp: payload.fp }), { headers: { 'Content-Type': 'application/json' } }));
      }
      if(payload.emailHash){
        await cache.put(VOTED_EMAIL_KEY, new Response(JSON.stringify({ ts: payload.ts || Date.now(), emailHash: payload.emailHash }), { headers: { 'Content-Type': 'application/json' } }));
      }
      // reply to sender
      if (srcClient && typeof srcClient.postMessage === 'function') {
        srcClient.postMessage({ type: 'voted-set', payload: true });
      }
      return;
    }

    if (msg && msg.type === 'get-voted') {
      const cache = await caches.open(CACHE_NAME);
      const r = await cache.match(VOTED_KEY);
      const rfp = await cache.match(VOTED_FP_KEY);
      const rem = await cache.match(VOTED_EMAIL_KEY);
      const text = r ? await r.text() : null;
      const fpText = rfp ? await rfp.text() : null;
      const emText = rem ? await rem.text() : null;
      if (srcClient && typeof srcClient.postMessage === 'function') {
        srcClient.postMessage({ type: 'voted-result', payload: { flag: text, fp: fpText, email: emText } });
      }
      return;
    }

    if (msg && msg.type === 'clear-voted') {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(VOTED_KEY);
      await cache.delete(VOTED_FP_KEY);
      await cache.delete(VOTED_EMAIL_KEY);
      if (srcClient && typeof srcClient.postMessage === 'function') {
        srcClient.postMessage({ type: 'voted-cleared', payload: true });
      }
      return;
    }
  } catch (e) {
    if (srcClient && typeof srcClient.postMessage === 'function') {
      srcClient.postMessage({ type: 'voted-error', payload: String(e) });
    }
  }
});
