export function LoadingState({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <div className="state-box state-loading" role="status">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'Tidak ada data',
  description = 'Belum ada catatan yang ditemukan untuk filter ini.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-box state-empty">
      <div className="state-icon" aria-hidden="true">📭</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box state-error" role="alert">
      <div className="state-icon" aria-hidden="true">⚠️</div>
      <h3>{title}</h3>
      <p>{message ?? 'Gagal memuat informasi. Silakan coba kembali.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Coba Lagi
        </button>
      )}
    </div>
  );
}
