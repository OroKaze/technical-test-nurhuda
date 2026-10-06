import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { EmployeeFormModal, type EmployeeData } from './EmployeeFormModal';
import { ErrorState } from '../../components/FeedbackStates';

interface AdminEmployeesResponse {
  data: EmployeeData[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AdminEmployeesResponse>('/api/v1/admin/employees?limit=200');
      setEmployees(response.data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal memuat daftar karyawan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  function handleOpenCreate() {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(emp: EmployeeData) {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  }

  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.companyEmail.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      (emp.phoneNumber && emp.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-page-container">
      <section className="card workspace-card">
        {/* Header Section */}
        <header className="card-header-flex">
          <div>
            <h2 className="card-section-title">Manajemen Data Karyawan</h2>
            <p className="card-section-desc">
              Kelola akun, informasi profil jabatan, dan nomor kontak resmi karyawan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-add-employee-dexa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Tambah Karyawan Baru</span>
          </button>
        </header>

        {/* Search Toolbar */}
        <div className="search-toolbar-dexa">
          <div className="search-input-wrapper">
            <span className="search-icon-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari Nama atau Email Karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
            />
          </div>
        </div>

        {/* Data Table */}
        {error ? (
          <ErrorState
            title="Gagal Memuat Karyawan"
            message={error}
            onRetry={loadEmployees}
          />
        ) : (
          <div className="table-wrapper-dexa">
            <table className="table-dexa">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '60px' }}>FOTO</th>
                  <th scope="col">NAMA LENGKAP</th>
                  <th scope="col">JABATAN</th>
                  <th scope="col">EMAIL PERUSAHAAN</th>
                  <th scope="col">NOMOR TELEPON</th>
                  <th scope="col" style={{ width: '80px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="table-empty-cell">Memuat daftar karyawan...</td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-cell">
                      {search
                        ? `Tidak ada karyawan yang cocok dengan pencarian "${search}".`
                        : 'Belum ada karyawan yang terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const photoUrl = api.resolvePhotoUrl(emp.photoUrl);
                    const initials = emp.fullName
                      ? emp.fullName
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'EM';

                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="table-avatar-dexa">
                            {photoUrl ? (
                              <img src={photoUrl} alt={emp.fullName} className="table-avatar-img" />
                            ) : (
                              <span className="table-avatar-initials">{initials}</span>
                            )}
                          </div>
                        </td>
                        <td className="font-semibold text-slate-900">{emp.fullName}</td>
                        <td>
                          <span className="badge-dexa badge-dexa-neutral">{emp.position}</span>
                        </td>
                        <td className="font-mono text-xs text-slate-600">{emp.companyEmail}</td>
                        <td className="font-mono text-xs">{emp.phoneNumber || <span className="text-muted">—</span>}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="btn-edit-table-dexa"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="table-footer-status">
              <span>Menampilkan {filteredEmployees.length} data karyawan</span>
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeToEdit={selectedEmployee}
        onSuccess={loadEmployees}
      />
    </div>
  );
}
