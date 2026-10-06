import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Modal } from '../../components/Modal';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { AlertCircleIcon } from '../../components/Icons';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword,
        newPassword,
      });

      showToast('success', 'Password Diperbarui', 'Password akun Anda berhasil diganti.');
      handleClose();
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'INVALID_CURRENT_PASSWORD' || parsed.statusCode === 400) {
        setError('Password lama tidak benar.');
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ubah Password Akun"
      description="Pastikan password baru Anda aman dan minimal 8 karakter."
    >
      {error && (
        <div className="alert-box alert-error" role="alert">
          <AlertCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <PasswordInput
          label="Password Saat Ini"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Masukkan password lama"
          required
        />

        <PasswordInput
          label="Password Baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          required
        />

        <PasswordInput
          label="Konfirmasi Password Baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ketik ulang password baru"
          required
        />

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" loading={loading}>
            Simpan Password Baru
          </Button>
        </div>
      </form>
    </Modal>
  );
}
