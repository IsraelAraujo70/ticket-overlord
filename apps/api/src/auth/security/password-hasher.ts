import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_N = 2 ** 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAX_MEMORY = 192 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt);

    return [
      'scrypt',
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, n, r, p, saltValue, hashValue] = encodedHash.split('$');

    if (
      algorithm !== 'scrypt' ||
      Number(n) !== SCRYPT_N ||
      Number(r) !== SCRYPT_R ||
      Number(p) !== SCRYPT_P ||
      !saltValue ||
      !hashValue
    ) {
      return false;
    }

    const expectedHash = Buffer.from(hashValue, 'base64url');
    const actualHash = await deriveKey(
      password,
      Buffer.from(saltValue, 'base64url'),
    );

    return (
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash)
    );
  }
}
