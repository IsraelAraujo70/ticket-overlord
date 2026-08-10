import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'ticket-overlord-api',
      status: 'ok',
    } as const;
  }
}
