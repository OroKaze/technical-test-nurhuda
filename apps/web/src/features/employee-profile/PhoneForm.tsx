import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';

export interface PhoneFormProps {
  currentPhone: string | null;
  onPhoneUpdated: (newPhone: string) => void;
}

export function PhoneForm({ currentPhone, onPhoneUpdated }: PhoneFormProps) {
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(currentPhone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = phoneNumber.trim();
    if (trimmed && !/^\+?[0-9 ()-]+$/.test(trimmed)) {
      setError('Nomor telepon hanya boleh berisi angka, tanda +, spasi, kurung, atau strip.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/api/v1/me/profile', {
        phoneNumber: trimmed || null,
      });

      showToast('success', 'Nomor Telepon Diperbarui', 'Data profil Anda telah disimpan.');
      onPhoneUpdated(trimmed);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal memperbarui nomor telepon.');
    } finally {
      setLoading(false);
    }
  }

  const isChanged = (phoneNumber.trim() || null) !== (currentPhone || null);

  return (
    <form onSubmit={handleSubmit} className="phone-form">
      <Input
        label="Nomor Telepon"
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+628123456789"
        hint="Contoh: +628123456789 (minimal 5 karakter)."
        error={error}
      />

      <div className="form-action-row">
        <Button
          type="submit"
          size="sm"
          loading={loading}
          disabled={!isChanged}
        >
          Simpan Telepon
        </Button>
      </div>
    </form>
  );
}
