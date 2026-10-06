import { useState, useRef, type ChangeEvent } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { CameraIcon } from '../../components/Icons';

export interface PhotoUploadProps {
  currentPhotoUrl: string | null;
  fullName: string;
  onPhotoUpdated: (newPhotoUrl: string) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export function PhotoUpload({ currentPhotoUrl, fullName, onPhotoUpdated }: PhotoUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size <= 0) {
      setError('File foto tidak boleh kosong.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('Ukuran file melebihi batas maksimal 2 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(fileExt) || !ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Format file tidak valid. Hanya file JPEG, PNG, dan WebP yang diizinkan.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const result = await api.uploadPhoto<{ id: string; photoUrl: string }>(selectedFile);
      showToast('success', 'Foto Berhasil Diperbarui', 'Foto profil Anda telah disimpan.');
      onPhotoUpdated(result.photoUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal mengunggah foto profil.');
    } finally {
      setUploading(false);
    }
  }

  function handleCancelSelection() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const resolvedPhoto = previewUrl ?? api.resolvePhotoUrl(currentPhotoUrl);
  const initials = fullName
    ? fullName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EM';

  return (
    <div className="photo-upload-container">
      <div className="photo-avatar-wrap">
        {resolvedPhoto ? (
          <img
            src={resolvedPhoto}
            alt={`Foto profil ${fullName}`}
            className="photo-avatar-img"
          />
        ) : (
          <div className="photo-avatar-placeholder" aria-label={fullName}>
            {initials}
          </div>
        )}
      </div>

      <div className="photo-upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          id="photo-file-input"
        />

        <div className="photo-buttons">
          {!selectedFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
              Pilih Foto Profil
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={uploading}
                onClick={handleUpload}
              >
                Simpan Foto
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={handleCancelSelection}
              >
                Batal
              </Button>
            </>
          )}
        </div>

        <p className="photo-hint">Format yang didukung: JPEG, PNG, WebP. Maksimal 2 MB.</p>
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
