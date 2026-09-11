/**
 * ImageKit Auth Helper
 *
 * Obtains signed authentication parameters (token, expire, signature) for direct client-side
 * uploads to ImageKit.
 *
 * Strategy:
 * 1. Attempts to fetch from `/api/imagekit-auth` (local Vite dev server middleware or API proxy).
 * 2. If the API endpoint is unavailable or returns an error, falls back to Web Crypto API HMAC-SHA1
 *    signing on the client side using the configured private key.
 */

const FALLBACK_PRIVATE_KEY =
  import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || 'private_xy7vfRIhMB5sxs52d7Wh2Euogvg=';

export async function getImageKitAuthParams() {
  // Strategy 1: dev server endpoint /api/imagekit-auth
  try {
    const res = await fetch('/api/imagekit-auth');
    if (res.ok) {
      const data = await res.json();
      if (data && data.signature && data.token && data.expire) {
        return data;
      }
    }
  } catch (err) {
    console.warn(
      '[ImageKitAuth] Dev server auth endpoint unavailable, falling back to Web Crypto:',
      err.message
    );
  }

  // Strategy 2: Web Crypto API client-side fallback
  try {
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expire = (Math.floor(Date.now() / 1000) + 1800).toString();

    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(FALLBACK_PRIVATE_KEY),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(token + expire)
    );

    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return { token, expire, signature };
  } catch (err) {
    console.error('[ImageKitAuth] Failed to generate client-side auth signature:', err);
    throw new Error('Could not generate ImageKit authorization parameters: ' + err.message);
  }
}
