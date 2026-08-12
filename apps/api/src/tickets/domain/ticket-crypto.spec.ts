import { generateKeyPairSync } from 'node:crypto';
import { createQrCode, verifyQrCode } from './ticket-crypto';

describe('ticket QR cryptography', () => {
  const pair = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { format: 'pem', type: 'spki' },
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
  });
  const keyId = '10000000-0000-4000-8000-000000000001';
  const ticketId = '20000000-0000-4000-8000-000000000002';
  const eventId = '30000000-0000-4000-8000-000000000003';

  it('verifies the canonical signed value and rejects tampering', () => {
    const code = createQrCode(keyId, ticketId, eventId, pair.privateKey);
    expect(verifyQrCode(code, pair.publicKey)).toEqual({
      keyId,
      ticketId,
      eventId,
    });
    expect(
      verifyQrCode(code.replace(eventId, keyId), pair.publicKey),
    ).toBeNull();
  });
});
