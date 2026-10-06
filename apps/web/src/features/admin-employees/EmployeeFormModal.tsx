import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import {
  cleanEmailUsername,
  buildFullCompanyEmail,
  isEmailTaken,
  validateCompanyUsername,
  DEFAULT_COMPANY_EMAIL_DOMAIN,
} from '../../lib/email-validation';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { AlertCircleIcon } from '../../components/Icons';

export interface EmployeeData {
  id: string;
  fullName: string;
  companyEmail: string;
  photoUrl: string | null;
  position: string;
  phoneNumber: string | null;
}

export interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: EmployeeData | null;
  onSuccess: () => void;
  existingEmails?: string[];
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  employeeToEdit,
  onSuccess,
  existingEmails = [],
}: EmployeeFormModalProps) {
  const isEditing = Boolean(employeeToEdit);
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cachedEmails, setCachedEmails] = useState<string[]>(existingEmails);

  useEffect(() => {
    if (existingEmails && existingEmails.length > 0) {
      setCachedEmails(existingEmails);
    } else if (isOpen && !isEditing) {
      void api
        .get<{ data: Array<{ companyEmail: string }> }>('/api/v1/admin/employees?limit=200')
        .then((res) => {
          if (res?.data) {
            setCachedEmails(res.data.map((emp) => emp.companyEmail));
          }
        })
        .catch(() => {});
    }
  }, [existingEmails, isOpen, isEditing]);

  useEffect(() => {
    if (employeeToEdit) {
      setFullName(employeeToEdit.fullName);
      setCompanyEmail(employeeToEdit.companyEmail);
      setEmailPrefix(cleanEmailUsername(employeeToEdit.companyEmail));
      setPosition(employeeToEdit.position);
      setPhoneNumber(employeeToEdit.phoneNumber ?? '');
      setPassword('');
    } else {
      setFullName('');
      setCompanyEmail('');
      setEmailPrefix('');
      setPassword('');
      setPosition('');
      setPhoneNumber('');
    }
    setError('');
  }, [employeeToEdit, isOpen]);

  function handleEmailPrefixChange(raw: string) {
    const cleaned = cleanEmailUsername(raw);
    setEmailPrefix(cleaned);
  }

  const fullCompanyEmail = isEditing
    ? companyEmail
    : buildFullCompanyEmail(emailPrefix, DEFAULT_COMPANY_EMAIL_DOMAIN);

  const emailValidation = isEditing
    ? { isValid: true }
    : validateCompanyUsername(emailPrefix);

  const isDuplicate =
    !isEditing && emailPrefix.trim().length >= 2
      ? isEmailTaken(fullCompanyEmail, cachedEmails)
      : false;

  const isEmailFieldInvalid =
    !isEditing && emailPrefix.trim().length > 0 && (!emailValidation.isValid || isDuplicate);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.');
      return;
    }

    if (!isEditing) {
      if (!emailValidation.isValid) {
        setError(emailValidation.error ?? 'Nama email perusahaan tidak valid.');
        return;
      }
      if (isDuplicate) {
        setError(`Email ${fullCompanyEmail} sudah terdaftar di sistem. Silakan gunakan nama lain.`);
        return;
      }
    }

    if (position.trim().length < 2) {
      setError('Jabatan minimal 2 karakter.');
      return;
    }

    if (!isEditing && password.length < 8) {
      setError('Password awal minimal 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && employeeToEdit) {
        await api.patch(`/api/v1/admin/employees/${employeeToEdit.id}`, {
          fullName: fullName.trim(),
          position: position.trim(),
          phoneNumber: phoneNumber.trim() || null,
        });
        showToast('success', 'Data Diperbarui', `Data karyawan ${fullName} berhasil diupdate.`);
      } else {
        await api.post('/api/v1/admin/employees', {
          fullName: fullName.trim(),
          companyEmail: fullCompanyEmail,
          password,
          position: position.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        });
        showToast('success', 'Karyawan Ditambahkan', `Karyawan baru ${fullName} berhasil didaftarkan.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'EMPLOYEE_EMAIL_EXISTS' || parsed.statusCode === 409) {
        setError('Email perusahaan tersebut sudah terdaftar.');
      } else if (parsed.code === 'INVALID_COMPANY_EMAIL') {
        setError(`Email harus menggunakan domain perusahaan resmi (@${DEFAULT_COMPANY_EMAIL_DOMAIN}).`);
      } else {
        setError(parsed.message || 'Gagal menyimpan data karyawan.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
      description={
        isEditing
          ? 'Perbarui nama, jabatan, atau nomor telepon karyawan.'
          : 'Daftarkan akun karyawan baru ke dalam sistem platform.'
      }
    >
      {error && (
        <div className="alert-box alert-error" role="alert">
          <AlertCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <Input
          label="Nama Lengkap"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Contoh: Budi Santoso"
          required
        />

        {/* Company Email Field with Affixed Domain and Availability Checker */}
        <div className={`field-group ${isEmailFieldInvalid ? 'has-error' : ''}`}>
          <label htmlFor="email-perusahaan" className="field-label">
            Email Perusahaan
          </label>
          {isEditing ? (
            <input
              id="email-perusahaan"
              className="field-input"
              type="email"
              value={companyEmail}
              disabled
            />
          ) : (
            <div className="email-input-wrapper">
              <input
                id="email-perusahaan"
                className="field-input email-prefix-input"
                type="text"
                value={emailPrefix}
                onChange={(e) => handleEmailPrefixChange(e.target.value)}
                placeholder="budi"
                required
                autoComplete="off"
              />
              <span className="email-domain-addon">@{DEFAULT_COMPANY_EMAIL_DOMAIN}</span>
            </div>
          )}
          {!isEditing && emailPrefix.trim().length > 0 && (
            <span
              className={`email-status-text ${
                isEmailFieldInvalid ? 'email-status-taken' : 'email-status-available'
              }`}
              role={isEmailFieldInvalid ? 'alert' : 'status'}
            >
              {!emailValidation.isValid
                ? emailValidation.error
                : isDuplicate
                ? `✕ Email ${fullCompanyEmail} sudah terdaftar.`
                : `✓ Email tersedia: ${fullCompanyEmail}`}
            </span>
          )}
        </div>

        {!isEditing && (
          <PasswordInput
            label="Password Awal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
          />
        )}

        <Input
          label="Jabatan / Posisi"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Contoh: Frontend Developer"
          required
        />

        <Input
          label="Nomor Telepon (Opsional)"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+628123456789"
        />

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? 'Simpan Perubahan' : 'Tambah Karyawan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
