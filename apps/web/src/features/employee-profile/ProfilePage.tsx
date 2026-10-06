import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { PhotoUpload } from './PhotoUpload';
import { PhoneForm } from './PhoneForm';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { Button } from '../../components/Button';
import { LoadingState, ErrorState } from '../../components/FeedbackStates';
import { KeyIcon } from '../../components/Icons';

export interface EmployeeProfileData {
  id: string;
  fullName: string;
  companyEmail: string;
  photoUrl: string | null;
  position: string;
  phoneNumber: string | null;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<EmployeeProfileData>('/api/v1/me/profile');
      setProfile(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal memuat profil karyawan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  if (loading) {
    return <LoadingState message="Memuat profil Anda..." />;
  }

  if (error || !profile) {
    return <ErrorState title="Gagal Memuat Profil" message={error ?? undefined} onRetry={loadProfile} />;
  }

  return (
    <div className="profile-page-grid">
      <section className="card profile-card">
        <header className="card-header">
          <span className="eyebrow">FOTO & IDENTITAS</span>
          <h2 className="card-title">Foto Profil</h2>
        </header>

        <PhotoUpload
          currentPhotoUrl={profile.photoUrl}
          fullName={profile.fullName}
          onPhotoUpdated={(newUrl) => {
            setProfile((prev) => (prev ? { ...prev, photoUrl: newUrl } : null));
          }}
        />
      </section>

      <section className="card profile-card">
        <header className="card-header">
          <span className="eyebrow">DATA DIRI</span>
          <h2 className="card-title">Informasi Karyawan</h2>
        </header>

        <dl className="profile-meta-list">
          <div className="meta-item">
            <dt>Nama Lengkap</dt>
            <dd className="meta-value">{profile.fullName}</dd>
          </div>
          <div className="meta-item">
            <dt>Email Perusahaan</dt>
            <dd className="meta-value">{profile.companyEmail}</dd>
          </div>
          <div className="meta-item">
            <dt>Jabatan / Posisi</dt>
            <dd className="meta-value">
              <span className="badge badge-primary">{profile.position}</span>
            </dd>
          </div>
        </dl>

        <div className="divider" />

        <PhoneForm
          currentPhone={profile.phoneNumber}
          onPhoneUpdated={(newPhone) => {
            setProfile((prev) => (prev ? { ...prev, phoneNumber: newPhone } : null));
          }}
        />

        <div className="divider" />

        <div className="security-section">
          <div>
            <strong>Keamanan Akun</strong>
            <p className="text-muted text-sm">Ganti password secara berkala untuk menjaga keamanan akun.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            <KeyIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            Ubah Password
          </Button>
        </div>
      </section>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
