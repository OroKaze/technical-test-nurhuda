export interface DeviceTokenStore {
  upsert(userId: string, token: string): Promise<void>;
  deactivate(userId: string, token: string): Promise<void>;
}

export class InvalidDeviceTokenError extends Error {
  readonly code = 'INVALID_DEVICE_TOKEN';
  constructor() { super('The device token is required.'); }
}

export class DeviceTokenService {
  constructor(private readonly store: DeviceTokenStore) {}

  async register(userId: string, token: string): Promise<void> {
    const normalized = token.trim();
    if (!normalized) throw new InvalidDeviceTokenError();
    await this.store.upsert(userId, normalized);
  }

  async remove(userId: string, token: string): Promise<void> {
    const normalized = token.trim();
    if (!normalized) throw new InvalidDeviceTokenError();
    await this.store.deactivate(userId, normalized);
  }
}
