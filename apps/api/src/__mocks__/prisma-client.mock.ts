export class PrismaClient {
  $on: jest.Mock = jest.fn();
  $connect: jest.Mock = jest.fn();
  $disconnect: jest.Mock = jest.fn().mockResolvedValue(undefined);
  $use: jest.Mock = jest.fn();
  $extends: jest.Mock = jest.fn();
  $transaction: jest.Mock = jest.fn();
  $queryRaw: jest.Mock = jest.fn();
  $queryRawUnsafe: jest.Mock = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  $executeRaw: jest.Mock = jest.fn();
  $executeRawUnsafe: jest.Mock = jest.fn();
}
