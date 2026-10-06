import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Modal } from '../../components/Modal';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '../../components/Icons';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Requirements Evaluation
  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

  const requirements: PasswordRequirement[] = [
    { id: 'length', label: 'Minimal 8 karakter', met: hasMinLength },
    { id: 'mixed', label: 'Kombinasi huruf besar (A-Z) & huruf kecil (a-z)', met: hasMixedCase },
    { id: 'number', label: 'Minimal 1 angka (0-9)', met: hasNumber },
    { id: 'symbol', label: 'Minimal 1 karakter simbol khusus (@, #, $, dll)', met: hasSpecialChar },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const isAllRequirementsMet = metCount === 4;

  // Strength score: 0 to 4
  let strengthScore = 0;
  if (newPassword.length > 0) {
    if (metCount === 1) strengthScore = 1;
    else if (metCount === 2) strengthScore = 2;
    else if (metCount === 3) strengthScore = 3;
    else if (metCount === 4) {
      strengthScore = newPassword.length >= 12 ? 4 : 3;
    }
  }

  let strengthLabel = 'Belum diisi';
  let strengthColor = '#94a3b8';

  if (newPassword.length > 0) {
    if (strengthScore <= 1) {
      strengthLabel = 'Sangat Lemah';
      strengthColor = '#ef4444';
    } else if (strengthScore === 2) {
      strengthLabel = 'Sedang';
      strengthColor = '#f59e0b';
    } else if (strengthScore === 3) {
      strengthLabel = 'Kuat';
      strengthColor = '#10b981';
    } else {
      strengthLabel = 'Sangat Kuat';
      strengthColor = '#059669';
    }
  }

  // Password Confirmation Evaluation
  const hasConfirmText = confirmPassword.length > 0;
  const isPasswordMatch = hasConfirmText && newPassword === confirmPassword;
  const isSameAsCurrent = Boolean(newPassword && currentPassword && newPassword === currentPassword);

  const isFormValid =
    currentPassword.trim().length > 0 &&
    isAllRequirementsMet &&
    isPasswordMatch &&
    !isSameAsCurrent;

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

    if (!isAllRequirementsMet) {
      setError('Password baru belum memenuhi semua kriteria keamanan yang disyaratkan.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Password baru tidak boleh sama dengan password saat ini.');
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
        setError('Password lama yang Anda masukkan tidak benar.');
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
      description="Buat password baru yang kuat untuk melindungi akun dan data kehadiran Anda."
    >
      {error && (
        <div className="alert-box alert-error" role="alert" style={{ marginBottom: 16 }}>
          <AlertCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        {/* Field 1: Password Saat Ini */}
        <PasswordInput
          label="Password Saat Ini"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Masukkan password lama Anda"
          required
        />

        {/* Field 2: Password Baru */}
        <div>
          <PasswordInput
            label="Password Baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter kombinasi"
            required
            error={isSameAsCurrent ? 'Password baru tidak boleh sama dengan password saat ini' : undefined}
          />

          {/* Strength Meter Bars & Label */}
          {newPassword.length > 0 && (
            <div className="password-strength-container" aria-live="polite">
              <div className="password-strength-header">
                <span className="password-strength-label">Kekuatan Password</span>
                <span className="password-strength-value" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
              <div className="password-strength-bars">
                {[1, 2, 3, 4].map((barIndex) => {
                  const isActive = strengthScore >= barIndex;
                  return (
                    <div
                      key={barIndex}
                      className="password-strength-bar"
                      style={{
                        backgroundColor: isActive ? strengthColor : '#e2e8f0',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Ketentuan Password Baru Card Checklist */}
          <div className="password-requirements-card">
            <div className="password-requirements-title">Ketentuan Password Baru</div>
            <ul className="password-requirements-list">
              {requirements.map((req) => (
                <li
                  key={req.id}
                  className={`password-req-item ${req.met ? 'is-met' : ''}`}
                >
                  <span className={`password-req-icon ${req.met ? 'is-met' : 'is-unmet'}`}>
                    {req.met ? (
                      <CheckCircleIcon style={{ width: 14, height: 14 }} />
                    ) : (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#94a3b8',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </span>
                  <span>{req.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Field 3: Konfirmasi Password Baru */}
        <div style={{ marginTop: 14 }}>
          <PasswordInput
            label="Konfirmasi Password Baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ketik ulang password baru Anda"
            required
          />

          {/* Live Matching Indicator */}
          {hasConfirmText && (
            <div
              className={`password-match-status ${
                isPasswordMatch ? 'is-matching' : 'is-mismatch'
              }`}
              role="status"
            >
              {isPasswordMatch ? (
                <>
                  <CheckCircleIcon style={{ width: 14, height: 14 }} />
                  <span>Password cocok</span>
                </>
              ) : (
                <>
                  <XMarkIcon style={{ width: 14, height: 14 }} />
                  <span>Konfirmasi password belum sesuai</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isFormValid || loading}
          >
            Simpan Password Baru
          </Button>
        </div>
      </form>
    </Modal>
  );
}
