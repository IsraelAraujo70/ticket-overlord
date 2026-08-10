import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

export interface GeneratedToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  generate(ttlMilliseconds: number): GeneratedToken {
    const raw = randomBytes(32).toString('base64url');

    return {
      raw,
      hash: this.hash(raw),
      expiresAt: new Date(Date.now() + ttlMilliseconds),
    };
  }

  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
