export interface StoreEventImageInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export abstract class EventImageStorage {
  abstract store(input: StoreEventImageInput): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract createReadUrl(key: string): Promise<string>;
}
