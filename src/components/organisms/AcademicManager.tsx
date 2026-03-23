import { useState, useEffect } from 'react';
import { apiRequest } from "../../api/client";
import { Card } from "../molecules/Card";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Modal } from "../molecules/Modal";
import { Badge } from "../atoms/Badge";
import { Loading } from "../atoms/Loading";

type AcademicTab = 'matapel' | 'jadwal' | 'absen-guru' | 'absen-siswa';

interface Props {
  activeTab: AcademicTab;
}

export default function AcademicManager({ activeTab }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Lookups for Schedule/Attendance forms
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); setSearchQuery(""); }, [activeTab]);
  
  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getEndpoint = () => {
    if (activeTab === 'matapel') return '/api/academic/subjects';
    if (activeTab === 'jadwal') return '/api/academic/schedules';
    if (activeTab === 'absen-guru') return '/api/academic/attendance/teacher';
    if (activeTab === 'absen-siswa') return '/api/academic/attendance/student';
    return '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(getEndpoint());
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [cRes, tRes, sRes] = await Promise.all([
        apiRequest('/api/master/classes'),
        apiRequest('/api/master/teachers'),
        apiRequest('/api/academic/subjects')
      ]);
      const cJson = await cRes.json();
      const tJson = await tRes.json();
      const sJson = await sRes.json();
      setClasses(cJson.data || []);
      setTeachers(tJson.data || []);
      setSubjects(sJson.data || []);
    } catch (e) { console.error(e) }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'jadwal' || activeTab === 'absen-guru') {
      fetchLookups();
    }
  }, [activeTab]);

  const openAddModal = () => {
    setEditId(null);
    if (activeTab === 'matapel') setFormData({ name: '', type: 'Wajib' });
    if (activeTab === 'jadwal') setFormData({ class_id: '', teacher_id: '', subject_id: '', day_of_week: 'Senin', start_time: '07:00', end_time: '08:30' });
    if (activeTab === 'absen-guru') setFormData({ teacher_id: '', status: 'Hadir', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditId(item.id || item.ID);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await apiRequest(`${getEndpoint()}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) { console.error(e) }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      // Convert select strings to ints for foreign keys
      if (payload.class_id) payload.class_id = parseInt(payload.class_id);
      if (payload.teacher_id) payload.teacher_id = parseInt(payload.teacher_id);
      if (payload.subject_id) payload.subject_id = parseInt(payload.subject_id);

      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `${getEndpoint()}/${editId}` : getEndpoint();

      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert("Gagal menyimpan data: " + err.error);
      }
    } catch (e) { console.error(e) }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      
      {activeTab !== 'absen-siswa' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {activeTab === 'matapel' && 'Daftar Mata Pelajaran'}
                {activeTab === 'jadwal' && 'Matriks Jadwal Pelajaran'}
                {activeTab === 'absen-guru' && 'Rekapitulasi Kehadiran Guru'}
              </h2>
              <p className="text-sm text-slate-500">Kelola dan pantau aliran akademik sekolah.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <div className="relative w-full sm:w-64">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" placeholder={`Cari dari ${data.length} data...`} value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400" />
              </div>
              <Button variant="primary" onClick={openAddModal} className="whitespace-nowrap flex-shrink-0 justify-center">
                Tambah {activeTab === 'matapel' ? 'Mata Pelajaran' : activeTab === 'jadwal' ? 'Jadwal' : 'Absensi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'absen-siswa' && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-indigo-800">Pantau Absensi Siswa</h2>
            <p className="text-sm text-indigo-600 mt-1">Data absensi siswa di bawah ini diisikan langsung oleh Guru melalui portal mereka. Admin hanya memiliki hak pandang (Read-Only) untuk memantau kedisiplinan harian.</p>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
             <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             <input type="text" placeholder={`Cari absensi...`} value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} className="w-full bg-white border border-indigo-200 text-indigo-900 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-indigo-400" />
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0 border-0 shadow-sm !rounded-2xl">
        <div className="relative overflow-x-auto shadow-inner rounded-xl touch-pan-x outline-none">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {activeTab === 'matapel' && (
                  <>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Mata Pelajaran</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Tipe / Kelompok</th>
                  </>
                )}
                {activeTab === 'jadwal' && (
                  <>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Kelas</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Hari & Jam</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Mata Pelajaran</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Guru Pengampu</th>
                  </>
                )}
                {activeTab === 'absen-guru' && (
                  <>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Tanggal</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Nama Guru</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Status Kehadiran</th>
                  </>
                )}
                {activeTab === 'absen-siswa' && (
                  <>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Tanggal</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Nama Siswa</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Kelas</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Guru Pelapor</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-500">Status</th>
                  </>
                )}
                {activeTab !== 'absen-siswa' && (
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><Loading message="Memuat aliran data akademik..." className="py-16" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Belum ada data tercatat.</td></tr>
              ) : pagedData.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                  
                  {activeTab === 'matapel' && (
                    <>
                      <td className="py-4 px-6 font-bold text-slate-800">{item.Name || item.name}</td>
                      <td className="py-4 px-6"><Badge variant="info">{item.Type || item.type}</Badge></td>
                    </>
                  )}

                  {activeTab === 'jadwal' && (
                    <>
                      <td className="py-4 px-6 font-bold text-slate-800">{item.class_name || '-'}</td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {item.day_of_week} <br />
                        <span className="text-xs text-slate-400">{item.start_time} - {item.end_time}</span>
                      </td>
                      <td className="py-4 px-6 text-indigo-600 font-semibold">{item.subject_name || '-'}</td>
                      <td className="py-4 px-6 text-slate-500">{item.teacher_name || '-'}</td>
                    </>
                  )}

                  {activeTab === 'absen-guru' && (
                    <>
                      <td className="py-4 px-6 font-mono text-slate-500">{item.date}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{item.teacher_name || '-'}</td>
                      <td className="py-4 px-6">
                        <Badge variant={item.status === 'Hadir' ? 'success' : item.status === 'Sakit' ? 'warning' : 'error'}>
                          {item.status}
                        </Badge>
                      </td>
                    </>
                  )}

                  {activeTab === 'absen-siswa' && (
                    <>
                      <td className="py-4 px-6 font-mono text-slate-500">{item.date}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{item.student_name || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{item.class_name || '-'}</td>
                      <td className="py-4 px-6 text-slate-500 text-sm">{item.teacher_name || '-'}</td>
                      <td className="py-4 px-6">
                        <Badge variant={item.status === 'Hadir' ? 'success' : item.status === 'Sakit' ? 'warning' : 'error'}>
                          {item.status}
                        </Badge>
                      </td>
                    </>
                  )}

                  {activeTab !== 'absen-siswa' && (
                    <td className="py-4 px-6 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(item.id || item.ID)}>Del</Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs text-slate-500 font-medium">
            {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, data.length)} dari <strong>{data.length}</strong> data
          </span>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-white hover:shadow-sm transition">← Prev</button>
            {Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
              let page = i + 1;
              if (totalPages > 5 && currentPage > 3) page = currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    page === currentPage ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-white hover:shadow-sm'
                  }`}>{page}</button>
              );
            })}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-white hover:shadow-sm transition">Next →</button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editId ? 'Ubah' : 'Tambah'} ${activeTab === 'matapel' ? 'Mata Pelajaran' : activeTab === 'jadwal' ? 'Jadwal' : 'Kehadiran'}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeTab === 'matapel' && (
            <>
              <Input label="Nama Mata Pelajaran" required value={formData.name || formData.Name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: Biologi Lanjutan" />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kelompok Mapel</label>
                <select required value={formData.type || formData.Type || 'Wajib'} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
                  <option value="Wajib">Wajib (Nasional)</option>
                  <option value="Peminatan">Peminatan (Jurusan)</option>
                  <option value="Lintas Minat">Lintas Minat</option>
                  <option value="Muatan Lokal">Muatan Lokal</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'jadwal' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Pilih Kelas</label>
                  <select required value={formData.class_id || ''} onChange={e => setFormData({...formData, class_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500">
                    <option value="">-- Kelas --</option>
                    {classes.map(c => <option key={c.ID||c.id} value={c.ID||c.id}>{c.Name||c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Mata Pelajaran</label>
                  <select required value={formData.subject_id || ''} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500">
                    <option value="">-- Mapel --</option>
                    {subjects.map(s => <option key={s.ID||s.id} value={s.ID||s.id}>{s.Name||s.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Guru Pengampu</label>
                <select required value={formData.teacher_id || ''} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500">
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => <option key={t.id||t.ID} value={t.id||t.ID}>{t.name||t.Name} ({t.subject||t.Subject||'-'})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Hari</label>
                  <select required value={formData.day_of_week || 'Senin'} onChange={e => setFormData({...formData, day_of_week: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500">
                    <option value="Senin">Senin</option><option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option><option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option><option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                <Input label="Jam Masuk" type="time" required value={formData.start_time || ''} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                <Input label="Jam Keluar" type="time" required value={formData.end_time || ''} onChange={e => setFormData({...formData, end_time: e.target.value})} />
              </div>
            </>
          )}

          {activeTab === 'absen-guru' && (
            <>
              <Input label="Tanggal Absensi" type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nama Guru</label>
                <select required value={formData.teacher_id || ''} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-indigo-500">
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => <option key={t.id||t.ID} value={t.id||t.ID}>{t.name||t.Name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Status Kehadiran</label>
                <select required value={formData.status || 'Hadir'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-indigo-500">
                  <option value="Hadir">Hadir</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpa">Alpa (Tanpa Keterangan)</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">Simpan Data</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
