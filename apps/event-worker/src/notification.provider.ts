import type { NotificationProvider } from './notification.consumer';

export class FakeNotificationProvider implements NotificationProvider {
  async send(_token: string, _message: { title: string; body: string }): Promise<void> {
    // Local provider boundary: delivery is intentionally simulated without claiming FCM success.
  }
}

export class FirebaseNotificationProvider implements NotificationProvider {
  async send(_token: string, _message: { title: string; body: string }): Promise<void> {
    throw new Error('Firebase provider is not configured for this runtime');
  }
}

export function createNotificationProvider(): NotificationProvider {
  return process.env.NOTIFICATION_PROVIDER === 'firebase'
    ? new FirebaseNotificationProvider()
    : new FakeNotificationProvider();
}
