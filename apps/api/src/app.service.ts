import { Injectable } from '@nestjs/common';

interface ApiRootData {
  name: string;
  version: string;
  status: 'running';
}

@Injectable()
export class AppService {
  getRoot(): ApiRootData {
    return {
      name: 'NextHire API',
      version: '1.0',
      status: 'running',
    };
  }
}
