export interface GeneratedToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export abstract class TokenGenerator {
  abstract generate(ttlMilliseconds: number): GeneratedToken;
  abstract hash(raw: string): string;
}
