import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';

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
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  employeeToEdit,
  onSuccess,
}: EmployeeFormModalProps) {
  const isEditing = Boolean(employeeToEdit);
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setFullName(employeeToEdit.fullName);
      setCompanyEmail(employeeToEdit.companyEmail);
      setPosition(employeeToEdit.position);
      setPhoneNumber(employeeToEdit.phoneNumber ?? '');
      setPassword('');
    } else {
      setFullName('');
      setCompanyEmail('');
      setPassword('');
      setPosition('');
      setPhoneNumber('');
    }
    setError('');
  }, [employeeToEdit, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.');
      return;
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
          companyEmail: companyEmail.trim().toLowerCase(),
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
        setError('Email harus menggunakan domain perusahaan resmi (@company.example).');
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
          <span>⚠️</span>
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

        <Input
          label="Email Perusahaan"
          type="email"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          placeholder="budi@company.example"
          disabled={isEditing}
          required
          hint={isEditing ? 'Email tidak dapat diubah setelah dibuat.' : 'Gunakan domain @company.example.'}
        />

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
