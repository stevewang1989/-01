// Binance requires HMAC-SHA256 signatures for private endpoints.
// We use the browser's native Web Crypto API to avoid external dependencies.

const enc = new TextEncoder();

/**
 * Convert an ArrayBuffer to a Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sign a message using HMAC-SHA256
 */
export async function hmacSha256(key: string, message: string): Promise<string> {
  const keyData = enc.encode(key);
  const messageData = enc.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  return bufferToHex(signature);
}