import { useEffect } from 'react';
import { api } from '../../lib/api-client';
import { getStoredUser } from '../../lib/auth-session';
import { useToast } from '../../components/Toast';

export function useNotificationListener() {
  const user = getStoredUser();
  const { showToast } = useToast();

  useEffect(() => {
    if (user?.role !== 'HRD') return;

    // Register simulated/browser device token if supported
    const dummyToken = `browser-token-${user.id.slice(0, 8)}`;
    api.post('/api/v1/notifications/device-tokens', { token: dummyToken })
      .catch(() => {
        // Ignored in dev / fake provider
      });

    // Provide informational toast about notification channel status
    const timer = setTimeout(() => {
      showToast(
        'info',
        'HRD Notification Active',
        'Notifikasi real-time perubahan data karyawan aktif.',
        5000,
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [user?.id, user?.role, showToast]);
}
