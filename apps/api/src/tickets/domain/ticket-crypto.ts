import { sign, verify } from 'node:crypto';

const QR_PREFIX = 'to1';
const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const QR_PATTERN = new RegExp(
  `^${QR_PREFIX}[.](${UUID})[.](${UUID})[.](${UUID})[.]([A-Za-z0-9_-]+)$`,
  'i',
);

export interface ParsedQrCode {
  keyId: string;
  ticketId: string;
  eventId: string;
}

/** Creates the canonical, versioned ticket data covered by Ed25519. */
export function canonicalTicketPayload(
  keyId: string,
  ticketId: string,
  eventId: string,
): string {
  return `${QR_PREFIX}.${keyId}.${ticketId}.${eventId}`;
}

/** Signs a canonical ticket payload and returns the complete QR value. */
export function createQrCode(
  keyId: string,
  ticketId: string,
  eventId: string,
  privateKeyPem: string,
): string {
  const payload = canonicalTicketPayload(keyId, ticketId, eventId);
  const signature = sign(null, Buffer.from(payload), privateKeyPem);
  return `${payload}.${signature.toString('base64url')}`;
}

/** Parses and verifies a QR value without trusting any embedded identifier. */
export function verifyQrCode(
  code: string,
  publicKeyPem: string,
): ParsedQrCode | null {
  const match = QR_PATTERN.exec(code);
  if (!match) return null;
  const [, keyId, ticketId, eventId, encodedSignature] = match;
  if (!keyId || !ticketId || !eventId || !encodedSignature) return null;
  try {
    const payload = canonicalTicketPayload(keyId, ticketId, eventId);
    const valid = verify(
      null,
      Buffer.from(payload),
      publicKeyPem,
      Buffer.from(encodedSignature, 'base64url'),
    );
    return valid ? { keyId, ticketId, eventId } : null;
  } catch {
    return null;
  }
}
