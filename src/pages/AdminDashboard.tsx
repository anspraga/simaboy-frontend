import { useState, useEffect, useRef } from "react";
import MobileNav from "../components/MobileNav";
import { apiRequest, API_URL } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Sidebar } from "../components/organisms/Sidebar";
import { TopNav } from "../components/organisms/TopNav";
import { Modal } from "../components/molecules/Modal";
import { Card } from "../components/molecules/Card";
import { Button } from "../components/atoms/Button";
import { Input } from "../components/atoms/Input";
import { Badge } from "../components/atoms/Badge";
import { Loading } from "../components/atoms/Loading";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import AcademicManager from "../components/organisms/AcademicManager";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'beranda' | 'admin' | 'siswa' | 'guru' | 'kelas' | 'matapel' | 'jadwal' | 'absen-guru' | 'absen-siswa'>('beranda');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number}>({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState<{row: number, name: string, reason: string}[]>([]);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [summaryData, setSummaryData] = useState({ admins_count: 0, teachers_count: 0, students_count: 0, classes_count: 0, class_dist: [] as any[] });
  const [scheduleStats, setScheduleStats] = useState<{per_day: {day: string, count: number}[], per_teacher: {teacher_name: string, count: number}[]}>({ per_day: [], per_teacher: [] });

  const now = new Date();
  const [absenMonth, setAbsenMonth] = useState(now.getMonth() + 1);
  const [absenYear, setAbsenYear] = useState(now.getFullYear());
  const [monthlyAttendance, setMonthlyAttendance] = useState<{
    teacher_status: {status: string, count: number}[],
    student_status: {status: string, count: number}[],
    teacher_trend: {date: string, count: number}[],
    student_trend: {date: string, count: number}[],
  }>({ teacher_status: [], student_status: [], teacher_trend: [], student_trend: [] });
  const [loadingAbsen, setLoadingAbsen] = useState(false);

  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuthStore();

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
    { id: 'admin', label: 'Admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
    { id: 'guru', label: 'Guru', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg> },
    { id: 'siswa', label: 'Siswa', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
    { id: 'kelas', label: 'Data Kelas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> },
    { id: 'matapel', label: 'Bidang Studi', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
    { id: 'jadwal', label: 'Jadwal PBM', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
    { id: 'absen-guru', label: 'Absen Guru', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: 'absen-siswa', label: 'Absen Siswa', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    { id: 'logout', label: 'Keluar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>, color: 'text-rose-500' },
  ];

  const handleNavChange = (id: string) => {
    if (id === 'logout') {
      if (window.confirm("Yakin ingin keluar?")) logout(API_URL);
    } else {
      setActiveTab(id as any);
      setSearchQuery('');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const initialFormState = { 
    name: '', username: '', password: '', class_id: '',
    nip: '', phone: '', gender: 'Laki-laki',
    nis: '', nisn: '', address: '',
    birth_place: '', birth_date: '', parent_phone: '', parent_email: '',
    nuptk: '', subject: '', education_level: 'S1', email: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchDashboardSummary = async () => {
    try {
      const res = await apiRequest(`/api/master/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData({
          admins_count: data.admins_count || 0,
          teachers_count: data.teachers_count || 0,
          students_count: data.students_count || 0,
          classes_count: data.classes_count || 0,
          class_dist: data.class_dist || [],
        });
      }
      // Also fetch schedule stats
      try {
        const statsRes = await apiRequest('/api/academic/schedules/stats');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setScheduleStats({ per_day: stats.per_day || [], per_teacher: stats.per_teacher || [] });
        }
      } catch (_) {}
      // Fetch monthly attendance stats for current month
      fetchMonthlyAttendance(absenMonth, absenYear);
    } catch (e) { console.error(e) }
  }

  const fetchMonthlyAttendance = async (month: number, year: number) => {
    setLoadingAbsen(true);
    try {
      const res = await apiRequest(`/api/master/rekap-absensi?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyAttendance({
          teacher_status: data.teacher_status || [],
          student_status: data.student_status || [],
          teacher_trend: data.teacher_trend || [],
          student_trend: data.student_trend || [],
        });
      }
    } catch (_) {}
    setLoadingAbsen(false);
  };

  const fetchData = async () => {
    if (activeTab === 'beranda') {
      await fetchDashboardSummary();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (['matapel', 'jadwal', 'absen-guru', 'absen-siswa'].includes(activeTab)) {
         setLoading(false);
         return; // Let AcademicManager handle its own fetches
      }
      let endpoint = "students";
      if (activeTab === "guru") endpoint = "teachers";
      if (activeTab === "kelas") endpoint = "classes";
      if (activeTab === "admin") endpoint = "admins";
      
      const res = await apiRequest(`/api/master/${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiRequest(`/api/master/classes`);
      if (res.ok) {
        const json = await res.json();
        setClasses(json.data || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'siswa' || activeTab === 'beranda') fetchClasses();
  }, [activeTab]);

  const isAcademicTab = ['matapel', 'jadwal', 'absen-guru', 'absen-siswa'].includes(activeTab);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Yakin ingin menghapus data ini beserta akses loginnya?")) return;
    try {
      let endpoint = "students";
      if (activeTab === "guru") endpoint = "teachers";
      if (activeTab === "kelas") endpoint = "classes";
      if (activeTab === "admin") endpoint = "admins";

      const res = await apiRequest(`/api/master/${endpoint}/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else alert("Gagal menghapus data.");
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (item: any) => {
    setEditId(item.id || item.ID);
    setFormData({
      ...initialFormState,
      name: item.name || item.Name || '',
      username: item.username || item.Username || '',
      password: '',
      class_id: item.class_id || item.ClassID || '',
      nip: item.nip || item.NIP || '',
      phone: item.phone || item.Phone || '',
      gender: item.gender || item.Gender || 'Laki-laki',
      nis: item.nis || item.NIS || '',
      nisn: item.nisn || item.NISN || '',
      address: item.address || item.Address || '',
      birth_place: item.birth_place || item.BirthPlace || '',
      birth_date: item.birth_date || item.BirthDate || '',
      parent_phone: item.parent_phone || item.ParentPhone || '',
      parent_email: item.parent_email || item.ParentEmail || '',
      nuptk: item.nuptk || item.NUPTK || '',
      subject: item.subject || item.Subject || '',
      education_level: item.education_level || item.EducationLevel || 'S1',
      email: item.email || item.Email || ''
    });
    setIsModalOpen(true);
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = "students";
      if (activeTab === "guru") endpoint = "teachers";
      if (activeTab === "kelas") endpoint = "classes";
      if (activeTab === "admin") endpoint = "admins";

      const payload: any = { name: formData.name || formData.username };
      if (activeTab !== 'kelas') {
        payload.username = formData.username;
        payload.password = formData.password;
        payload.gender = formData.gender;
      }
      if (activeTab === 'guru') {
        payload.nip = formData.nip;
        payload.nuptk = formData.nuptk;
        payload.phone = formData.phone;
        payload.email = formData.email;
        payload.birth_place = formData.birth_place;
        payload.birth_date = formData.birth_date;
        payload.subject = formData.subject;
        payload.education_level = formData.education_level;
        payload.address = formData.address;
      }
      if (activeTab === 'siswa') {
        payload.class_id = parseInt(formData.class_id);
        payload.nis = formData.nis;
        payload.nisn = formData.nisn;
        payload.address = formData.address;
        payload.birth_place = formData.birth_place;
        payload.birth_date = formData.birth_date;
        payload.parent_phone = formData.parent_phone;
        payload.parent_email = formData.parent_email;
      }

      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/master/${endpoint}/${editId}` : `/api/master/${endpoint}`;

      const res = await apiRequest(url, {
        method: method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditId(null);
        setFormData(initialFormState);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal ${editId ? 'mengubah' : 'menambahkan'} data: ` + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- CHART COMPUTATIONS ---
  const summaryStats = [
    { name: 'Siswa', value: summaryData.students_count, fill: '#14b8a6' }, // Teal 500
    { name: 'Guru', value: summaryData.teachers_count, fill: '#10b981' }, // Emerald 500
    { name: 'Admin', value: summaryData.admins_count, fill: '#06b6d4' }   // Cyan 500
  ];

  const classChartData = summaryData.class_dist
    .map((c: any) => ({ name: c.class_name, students: c.count }))
    .sort((a: any, b: any) => b.students - a.students);

  // --- PAGINATION ---
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // --- SEARCH LOGIC ---
  const filteredData = data.filter((item: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (item.name || item.Name || item.username || '').toLowerCase();
    
    if (activeTab === 'siswa') {
      const nis = (item.nis || item.NIS || '').toLowerCase();
      const nisn = (item.nisn || item.NISN || '').toLowerCase();
      const cls = (item.class || item.Class || '').toLowerCase();
      return name.includes(query) || nis.includes(query) || nisn.includes(query) || cls.includes(query);
    }
    if (activeTab === 'guru') {
      const nip = (item.nip || item.NIP || '').toLowerCase();
      const nuptk = (item.nuptk || item.NUPTK || '').toLowerCase();
      const subject = (item.subject || item.Subject || '').toLowerCase();
      return name.includes(query) || nip.includes(query) || nuptk.includes(query) || subject.includes(query);
    }
    return name.includes(query);
  });

  // Reset to page 1 when tab or search changes
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // --- EXPORT LOGIC ---
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('Tidak ada data untuk diekspor!');
    setExporting(true);
    
    setTimeout(() => {
      // Create headers (ignoring id and password if they exist)
      const excludeKeys = ['id', 'password', 'ID'];
    const headers = Object.keys(filteredData[0]).filter(k => !excludeKeys.includes(k));
    
    // Create rows safely preserving commas inside quotes if needed
    const csvRows = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          return `"${val.replace(/"/g, '""')}"`; // escape quotes
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExporting(false);
  }, 800); // Artificial delay for premium feel
};

  // --- IMPORT LOGIC ---
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error('File CSV kosong atau tidak memiliki data.');

        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const payloads = lines.slice(1).map(line => {
          // Simple CSV splitter that respects quotes (regex match)
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => { 
            const val = values[i] ? values[i].replace(/^"|"$/g, '') : '';
            if (val) obj[h] = val; 
            if (h.toLowerCase() === 'class' && obj[h]) {
              obj['class_id'] = parseInt(obj[h], 10) || 0; // attempt generic mapping
            }
          });
          // Default password setup if missing
          if (!obj.password) obj.password = '123456'; 
          return obj;
        });

        let endpoint = "students";
        if (activeTab === "guru") endpoint = "teachers";
        if (activeTab === "kelas") endpoint = "classes";
        if (activeTab === "admin") endpoint = "admins";

        let validPayloads = [];
        let duplicateCount = 0;
        let seenSet = new Set();
        
        for (let idx = 0; idx < payloads.length; idx++) {
          const payload = payloads[idx];
          const uStr = (payload.username || '').toLowerCase();
          const pStr = (activeTab === 'siswa' ? payload.nis : activeTab === 'guru' ? payload.nip : payload.name || '').toLowerCase();
          
          const inDb = data.some((item: any) => {
             const iu = (item.username || item.Username || '').toLowerCase();
             if (activeTab !== 'kelas' && uStr && iu === uStr) return true;
             
             if (activeTab === 'siswa' && payload.nis && (item.nis === payload.nis || item.NIS === payload.nis)) return true;
             if (activeTab === 'guru' && payload.nip && (item.nip === payload.nip || item.NIP === payload.nip)) return true;
             if (activeTab === 'kelas' && payload.name && ((item.name || item.Name || '').toLowerCase() === payload.name.toLowerCase())) return true;
             
             return false;
          });
          
          const inCsv = (activeTab !== 'kelas' && uStr && seenSet.has(uStr)) || (pStr && seenSet.has(pStr));
          
          if (inDb || inCsv) {
            duplicateCount++;
            setImportErrors(prev => [...prev, { row: idx + 2, name: payload.name || payload.username || 'Baris CSV', reason: inCsv ? 'Data kembar di dalam file CSV' : 'Identitas sudah terdaftar di Sistem' }]);
          } else {
            validPayloads.push({payload, originalIndex: idx + 2});
            if (uStr) seenSet.add(uStr);
            if (pStr) seenSet.add(pStr);
          }
        }

        if (validPayloads.length === 0) {
           setImportDone(true);
           return;
        }

        let successCount = 0;
        setImportProgress({ current: 0, total: validPayloads.length });
        
        // Sequentially create items
        for (let i = 0; i < validPayloads.length; i++) {
          const {payload, originalIndex} = validPayloads[i];
          if (payload.class_id) payload.class_id = parseInt(payload.class_id, 10);
          if (payload.class) {
             payload.class_id = parseInt(payload.class, 10);
             delete payload.class;
          }
          
          try {
            const res = await apiRequest(`/api/master/${endpoint}`, {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              successCount++;
            } else {
              const err = await res.json();
              setImportErrors(prev => [...prev, { row: originalIndex, name: payload.name || payload.username || '-', reason: err.error || 'Server menolak data' }]);
            }
          } catch (e: any) {
            setImportErrors(prev => [...prev, { row: originalIndex, name: payload.name || '-', reason: e.message || 'Koneksi terputus' }]);
          }
          
          setImportProgress({ current: i + 1, total: validPayloads.length });
        }
        
        fetchData();
        setImportDone(true);
      } catch (err: any) {
        alert(`Gagal memproses CSV: ${err.message}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const closeImportModal = () => {
    setImporting(false);
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden pb-16 md:pb-0">
      <MobileNav items={navItems} activeTab={activeTab} onTabChange={handleNavChange} />
      
      <Sidebar 
        appName="SIMABOY"
        userName={user || 'Administrator'}
        userRole="Super Admin"
        brandGradient="from-teal-400 to-emerald-400"
        items={navItems}
        activeTab={activeTab}
        onTabChange={handleNavChange}
        onLogout={() => logout(API_URL)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden pb-28 md:pb-0 scroll-smooth w-full">
        <TopNav 
          title={
            activeTab === 'beranda' ? 'Dashboard Utama' : 
            activeTab === 'matapel' ? 'Mata Pelajaran' :
            activeTab === 'jadwal' ? 'Jadwal Mengajar' :
            activeTab === 'absen-guru' ? 'Kehadiran Guru' :
            activeTab === 'absen-siswa' ? 'Pantau Absensi Siswa' :
            `Kelola Data ${activeTab}`
          }
          subtitle={activeTab === 'beranda' ? 'Ikhtisar Sistem Terkini' : 'Manajemen Data Terpusat'}
          actionLabel={(activeTab !== 'beranda' && !isAcademicTab) ? `Tambah ${activeTab}` : undefined}
          onActionClick={(activeTab !== 'beranda' && !isAcademicTab) ? () => { setEditId(null); setFormData(initialFormState); setIsModalOpen(true); } : undefined}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
          
          {activeTab === 'beranda' && (
            <div className="space-y-8">
              {/* METRIC CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Siswa</p>
                      {loading ? <div className="h-10 w-20 bg-slate-200 animate-pulse rounded-lg mt-1" /> : <p className="text-4xl font-black text-slate-800 tracking-tighter">{summaryData.students_count}</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Guru</p>
                      {loading ? <div className="h-10 w-20 bg-slate-200 animate-pulse rounded-lg mt-1" /> : <p className="text-4xl font-black text-slate-800 tracking-tighter">{summaryData.teachers_count}</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Kelas</p>
                      {loading ? <div className="h-10 w-20 bg-slate-200 animate-pulse rounded-lg mt-1" /> : <p className="text-4xl font-black text-slate-800 tracking-tighter">{summaryData.classes_count}</p>}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Admin Aktif</p>
                      {loading ? <div className="h-10 w-20 bg-slate-200 animate-pulse rounded-lg mt-1" /> : <p className="text-4xl font-black text-slate-800 tracking-tighter">{summaryData.admins_count}</p>}
                    </div>
                  </div>
              </div>
              
              {/* CHARTS LAYER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* DONUT CHART (Composition) */}
                <Card className="lg:col-span-1 p-6 flex flex-col items-center hover:shadow-lg transition-shadow">
                   <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg> Komposisi Pengguna</h3>
                   <div className="w-full h-64">
                     {loading ? (
                       <div className="w-full h-full flex items-center justify-center">
                         <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse" />
                       </div>
                     ) : summaryData.students_count > 0 || summaryData.teachers_count > 0 || summaryData.admins_count > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={summaryStats} innerRadius={65} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                             {summaryStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                           <Legend verticalAlign="bottom" height={36} iconType="circle" />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data Pengguna</div>
                     )}
                   </div>
                </Card>

                {/* BAR CHART (Class Distribution) */}
                <Card className="lg:col-span-2 p-6 flex flex-col hover:shadow-lg transition-shadow">
                   <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> Populasi Siswa per Kelas</h3>
                   <div className="w-full h-64">
                     {loading ? (
                       <div className="w-full h-full flex items-end justify-between px-4 pb-2 pb-8 gap-2">
                         {[...Array(6)].map((_, i) => (
                           <div key={i} className="w-full bg-slate-200 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                         ))}
                       </div>
                     ) : classChartData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={classChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                           <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0d9488', fontWeight: 'bold' }} />
                           <Bar dataKey="students" name="Siswa" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000}>
                             {classChartData.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#14b8a6' : '#10b981'} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada penyebaran kelas</div>
                     )}
                   </div>
                </Card>
              </div>

              {/* SCHEDULE CHARTS */}
              {(scheduleStats.per_day.length > 0 || scheduleStats.per_teacher.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar: Jadwal per Hari */}
                  <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                    <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Beban Jadwal per Hari
                    </h3>
                    <div className="w-full h-64">
                      {loading ? (
                       <div className="w-full h-full flex items-end justify-between px-4 pb-2 pb-8 gap-2">
                         {[...Array(6)].map((_, i) => (
                           <div key={i} className="w-full bg-slate-200 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                         ))}
                       </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scheduleStats.per_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }} />
                            <Bar dataKey="count" name="Sesi" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={1000}>
                              {scheduleStats.per_day.map((_, i) => (
                                <Cell key={i} fill={['#14b8a6','#06b6d4','#6366f1','#8b5cf6','#f59e0b'][i % 5]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </Card>

                  {/* Bar: Beban Mengajar per Guru */}
                  <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                    <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                      Beban Mengajar per Guru (Top 10)
                    </h3>
                    <div className="w-full h-64">
                      {loading ? (
                        <div className="w-full h-full flex flex-col justify-between py-2 gap-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-full bg-slate-200 animate-pulse rounded-r-lg" style={{ width: `${Math.random() * 60 + 20}%` }} />
                          ))}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scheduleStats.per_teacher} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="teacher_name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }} />
                            <Bar dataKey="count" name="Sesi" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={20} animationDuration={1000}>
                              {scheduleStats.per_teacher.map((_, i) => (
                                <Cell key={i} fill={i % 2 === 0 ? '#8b5cf6' : '#6366f1'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* MONTHLY ATTENDANCE RECAP */}
              {(() => {
                const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                const STATUS_COLORS: Record<string, string> = {
                  'Hadir': '#22c55e', 'hadir': '#22c55e',
                  'Izin': '#f59e0b', 'izin': '#f59e0b',
                  'Sakit': '#3b82f6', 'sakit': '#3b82f6',
                  'Alpa': '#ef4444', 'alpa': '#ef4444', 'Alpha': '#ef4444',
                };
                const toDonut = (arr: {status: string, count: number}[]) =>
                  arr.map(d => ({ name: d.status, value: d.count, fill: STATUS_COLORS[d.status] || '#94a3b8' }));
                const teacherDonut = toDonut(monthlyAttendance.teacher_status);
                const studentDonut = toDonut(monthlyAttendance.student_status);
                const years = Array.from({length: 5}, (_, i) => now.getFullYear() - i);
                return (
                  <div className="space-y-4">
                    {/* Header + Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <span className="text-sm font-bold text-slate-700">Rekap Absensi Bulanan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={absenMonth}
                          onChange={e => { const m = +e.target.value; setAbsenMonth(m); fetchMonthlyAttendance(m, absenYear); }}
                          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                        >
                          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <select
                          value={absenYear}
                          onChange={e => { const y = +e.target.value; setAbsenYear(y); fetchMonthlyAttendance(absenMonth, y); }}
                          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none cursor-pointer"
                        >
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {loadingAbsen && <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                      </div>
                    </div>

                    {/* 4 Charts: 2 rows */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Teacher Donut */}
                      <Card className="p-6 flex flex-col items-center hover:shadow-lg transition-shadow">
                        <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Status Kehadiran Guru — {MONTHS[absenMonth-1]} {absenYear}
                        </h3>
                        <div className="w-full h-56">
                          {loadingAbsen ? (
                           <div className="w-full h-full flex items-center justify-center">
                             <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-emerald-400 border-r-emerald-300 animate-spin" />
                           </div>
                          ) : teacherDonut.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={teacherDonut} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                  {teacherDonut.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data kehadiran guru bulan ini</div>}
                        </div>
                      </Card>

                      {/* Student Donut */}
                      <Card className="p-6 flex flex-col items-center hover:shadow-lg transition-shadow">
                        <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Status Absensi Siswa — {MONTHS[absenMonth-1]} {absenYear}
                        </h3>
                        <div className="w-full h-56">
                          {loadingAbsen ? (
                           <div className="w-full h-full flex items-center justify-center">
                             <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-sky-400 border-l-sky-300 animate-spin" />
                           </div>
                          ) : studentDonut.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={studentDonut} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                  {studentDonut.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data absensi siswa bulan ini</div>}
                        </div>
                      </Card>

                      {/* Teacher Daily Trend */}
                      <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                        <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          Tren Kehadiran Guru Harian
                        </h3>
                        <div className="w-full h-48">
                          {loadingAbsen ? (
                            <div className="w-full h-full flex items-end justify-between px-4 pb-2 pb-8 gap-2">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-full bg-slate-200 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                              ))}
                            </div>
                          ) : monthlyAttendance.teacher_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyAttendance.teacher_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={6} tickFormatter={d => d.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }} />
                                <Bar dataKey="count" name="Hadir" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={20} animationDuration={800} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data tren kehadiran guru</div>}
                        </div>
                      </Card>

                      {/* Student Daily Trend */}
                      <Card className="p-6 flex flex-col hover:shadow-lg transition-shadow">
                        <h3 className="text-sm font-bold text-slate-700 w-full border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          Tren Kehadiran Siswa Harian
                        </h3>
                        <div className="w-full h-48">
                          {loadingAbsen ? (
                            <div className="w-full h-full flex items-end justify-between px-4 pb-2 pb-8 gap-2">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-full bg-slate-200 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                              ))}
                            </div>
                          ) : monthlyAttendance.student_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyAttendance.student_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={6} tickFormatter={d => d.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }} />
                                <Bar dataKey="count" name="Hadir" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} animationDuration={800} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data tren kehadiran siswa</div>}
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}


          {isAcademicTab && (
            <AcademicManager activeTab={activeTab as any} />
          )}

          {(!isAcademicTab && activeTab !== 'beranda') && (
            <>
              {/* CONTROL BAR (Search + Export/Import) */}
              <div className="mb-6 flex flex-col md:flex-row gap-4 animate-fade-in-up items-start md:items-center">
                <div className="relative group w-full flex-1">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari data ${activeTab} berdasarkan nama atau identitas...`}
                    className="w-full pl-12 pr-4 py-4 md:py-3.5 bg-white border border-slate-200/80 rounded-2xl md:rounded-xl shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-base md:text-sm text-slate-700 placeholder-slate-400 hover:border-slate-300"
                  />
                </div>
                
                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  <Button variant="secondary" onClick={handleExportCSV} className="flex-1 md:flex-none justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Ekspor CSV
                  </Button>
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex-1 md:flex-none justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> {importing ? 'Proses...' : 'Impor CSV'}
                  </Button>
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                </div>
              </div>

              {/* MOBILE CARD VIEW (Hidden on md and larger) */}
              <div className="md:hidden space-y-4">
                {loading ? (
                  <Loading message="Memuat data secara aman..." />
                ) : pagedData.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium">{searchQuery ? `Tidak ada data ${activeTab} yang cocok dengan "${searchQuery}".` : `Data ${activeTab} masih kosong.`}</p>
                  </div>
                ) : pagedData.map((item: any, idx) => (
                  <Card key={idx} className="p-4 border border-slate-200 shadow-sm rounded-2xl bg-white">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{item.name || item.Name || item.username}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {activeTab === 'siswa' && `NIS: ${item.nis || '-'} | NISN: ${item.nisn || '-'}`}
                          {activeTab === 'guru' && `NIP: ${item.nip || '-'}`}
                          {activeTab === 'admin' && `Super Admin`}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                         <Button variant="outline" size="sm" className="px-3" onClick={() => openEditModal(item)}>Edit</Button>
                         <Button variant="danger" size="sm" className="px-3" onClick={() => handleDelete(item.id || item.ID)}>Del</Button>
                      </div>
                    </div>
                    
                    {/* Bio Data Section */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs w-full">
                      {activeTab === 'siswa' && (
                        <>
                          <div className="min-w-0"><span className="block text-slate-400">Kelas</span><span className="font-medium truncate block">{item.class || item.Class || '-'}</span></div>
                          <div className="min-w-0"><span className="block text-slate-400">Gender</span><span className="font-medium truncate block">{item.gender || item.Gender || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">TTL</span><span className="font-medium break-words block">{item.birth_place || '-'}, {item.birth_date || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">Alamat Lengkap</span><span className="font-medium break-words block">{item.address || '-'}</span></div>
                          <div className="min-w-0"><span className="block text-slate-400">Telp. Wali</span><span className="font-medium truncate block">{item.parent_phone || '-'}</span></div>
                          <div className="min-w-0"><span className="block text-slate-400">Email Wali</span><span className="font-medium truncate block">{item.parent_email || '-'}</span></div>
                        </>
                      )}
                      {activeTab === 'guru' && (
                        <>
                          <div className="min-w-0"><span className="block text-slate-400">Mata Pelajaran</span><span className="font-medium truncate block">{item.subject || item.Subject || '-'}</span></div>
                          <div className="min-w-0"><span className="block text-slate-400">NUPTK</span><span className="font-medium truncate block">{item.nuptk || item.NUPTK || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">Pendidikan</span><span className="font-medium break-words block">{item.education_level || item.EducationLevel || '-'}</span></div>
                          <div className="min-w-0"><span className="block text-slate-400">Gender</span><span className="font-medium truncate block">{item.gender || item.Gender || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">TTL</span><span className="font-medium break-words block">{item.birth_place || item.BirthPlace || '-'}, {item.birth_date || item.BirthDate || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">No. HP & Email</span><span className="font-medium break-words block">{item.phone || item.Phone || '-'} | {item.email || item.Email || '-'}</span></div>
                          <div className="col-span-2 min-w-0"><span className="block text-slate-400">Alamat Lengkap</span><span className="font-medium break-words block">{item.address || item.Address || '-'}</span></div>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              {/* MOBILE PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500">{(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filteredData.length)} dari {filteredData.length}</span>
                  <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">← Prev</button>
                    <span className="px-2 py-1.5 text-xs text-slate-500">{currentPage}/{totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">Next →</button>
                  </div>
                </div>
              )}

              {/* DESKTOP TABLE VIEW (Visible on md and larger) */}
              <div className="hidden md:block">
                <Card className="overflow-hidden p-0 border-0 shadow-lg !rounded-2xl">
                  <div className="relative overflow-x-auto shadow-inner rounded-xl touch-pan-x outline-none">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm sticky top-0 z-10">
                        {/* NO ID COLUMN FOR DESKTOP ANYMORE */}
                        <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">{activeTab === 'kelas' ? 'Nama Kelas' : 'Nama Lengkap'}</th>
                        {activeTab === 'siswa' && (
                          <>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">NIS/NISN</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Kelas</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">L/P</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">TTL</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Alamat</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Kontak Wali</th>
                          </>
                        )}
                        {activeTab === 'guru' && (
                          <>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">NIP/NUPTK</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Pelajaran</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Pendidikan</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">L/P</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">TTL</th>
                            <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">Kontak</th>
                          </>
                        )}
                        <th className="py-4 px-6 text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={10}><Loading message="Mengambil daftar data..." className="py-20" /></td></tr>
                      ) : filteredData.length === 0 ? (
                        <tr><td colSpan={10} className="p-12 text-center text-slate-400 font-medium">{searchQuery ? `Pencarian "${searchQuery}" tidak ditemukan.` : `Data ${activeTab} masih kosong.`}</td></tr>
                      ) : pagedData.map((item: any, idx) => (
                        <tr key={idx} className="border-b border-slate-100/50 hover:bg-indigo-50/30 transition-colors group">
                          {/* Name Column */}
                          <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3 min-w-[200px]">
                            {activeTab !== 'kelas' && (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs text-slate-500 font-bold">
                                {(item.name || item.Name || item.username)[0].toUpperCase()}
                              </div>
                            )}
                            {item.name || item.Name || item.username}
                          </td>
                          
                          {activeTab === 'siswa' && (
                            <>
                              <td className="py-4 px-6 text-slate-500 font-mono text-sm">{item.nis || item.NIS || '-'}<br/><span className="text-[10px] text-slate-400">{item.nisn || item.NISN || ''}</span></td>
                              <td className="py-4 px-6"><Badge variant="info">{item.class || item.Class}</Badge></td>
                              <td className="py-4 px-6 text-slate-600 font-semibold">{(item.gender || item.Gender || '-')[0]}</td>
                              <td className="py-4 px-6 text-slate-500 text-sm">{item.birth_place || '-'}, {item.birth_date || '-'}</td>
                              <td className="py-4 px-6 text-slate-500 text-sm max-w-[200px] truncate">{item.address || '-'}</td>
                              <td className="py-4 px-6 text-slate-500 text-sm">{item.parent_phone || '-'}<br/><span className="text-[10px] text-slate-400">{item.parent_email || ''}</span></td>
                            </>
                          )}
                          
                          {activeTab === 'guru' && (
                            <>
                              <td className="py-4 px-6 text-slate-500 font-mono text-sm">{item.nip || item.NIP || '-'}<br/><span className="text-[10px] text-slate-400">{item.nuptk || item.NUPTK || ''}</span></td>
                              <td className="py-4 px-6 text-slate-500 font-medium">{item.subject || item.Subject || '-'}</td>
                              <td className="py-4 px-6 text-slate-500">{item.education_level || item.EducationLevel || '-'}</td>
                              <td className="py-4 px-6 text-slate-600 font-semibold">{(item.gender || item.Gender || '-')[0]}</td>
                              <td className="py-4 px-6 text-slate-500 text-sm">{item.birth_place || item.BirthPlace || '-'}, {item.birth_date || item.BirthDate || '-'}</td>
                              <td className="py-4 px-6 text-slate-500 text-sm">{item.phone || item.Phone || '-'}<br/><span className="text-[10px] text-slate-400">{item.email || item.Email || ''}</span></td>
                            </>
                          )}
                          
                          <td className="py-4 px-6 text-right space-x-2">
                             <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>Edit</Button>
                             <Button variant="danger" size="sm" onClick={() => handleDelete(item.id || item.ID)}>Hapus</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {/* DESKTOP PAGINATION */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <span className="text-xs text-slate-500 font-medium">{(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filteredData.length)} dari <strong>{filteredData.length}</strong> data</span>
                      <div className="flex items-center gap-1">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-white hover:shadow-sm transition">← Prev</button>
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
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-white hover:shadow-sm transition">Next →</button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

        </div>
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`${editId ? 'Edit' : 'Tambah'} ${activeTab}`}
        maxWidth="lg"
        footer={(
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleCreateOrEdit}>Simpan Data</Button>
          </div>
        )}
      >
        <form className="space-y-5" onSubmit={handleCreateOrEdit}>
          
          {activeTab === 'kelas' && (
            <Input label="Nama Kelas" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: X IPA 1" />
          )}

          {(activeTab === 'guru' || activeTab === 'siswa') && (
            <div className="space-y-4">
              <Input label="Nama Lengkap" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Jenis Kelamin</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
                    <option value="Laki-laki">Laki-laki (L)</option>
                    <option value="Perempuan">Perempuan (P)</option>
                  </select>
                </div>
                <Input label="Tanggal Lahir" type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>
              <Input label="Tempat Lahir" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} />
              <Input label="Alamat Lengkap" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          )}

          {activeTab === 'guru' && (
            <div className="space-y-4 border-t border-slate-100 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} placeholder="198..." />
                <Input label="NUPTK" value={formData.nuptk} onChange={e => setFormData({...formData, nuptk: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Mata Pelajaran" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                <Input label="Pendidikan Terakhir" value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})} placeholder="Misal: S1 Matematika" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="No. HP" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input label="Email Pribadi" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          )}

          {activeTab === 'siswa' && (
            <div className="space-y-4 border-t border-slate-100 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="NIS" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} />
                <Input label="NISN" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rombel (Kelas)</label>
                <select required value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
                  <option value="">-- Pilih Kelas Aktif --</option>
                  {classes.map(c => (
                    <option key={c.ID || c.id} value={c.ID || c.id}>{c.Name || c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telp Wali / Ortu" value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} />
                <Input label="Email Wali" type="email" value={formData.parent_email} onChange={e => setFormData({...formData, parent_email: e.target.value})} />
              </div>
            </div>
          )}

          {activeTab !== 'kelas' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Kredensial Login</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="user123" />
                <Input label="Password" required={!editId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editId ? "Kosongkan jika tidak ubah" : "Minimal 6 karakter"} />
              </div>
            </div>
          )}
          
          
          <button type="submit" className="hidden">Submit</button> 
        </form>
      </Modal>

      {/* FULL SCREEN IMPORT/EXPORT LOADER & REPORT */}
      <Modal isOpen={importing || exporting} onClose={() => { importDone ? closeImportModal() : null }} maxWidth={importDone ? 'lg' : 'sm'}>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {!importDone && (
             <>
               <Loading size="lg" message={importing ? `Memproses Baris ${importProgress.current} dari ${importProgress.total}...` : "Menyiapkan File Download..."} />
               <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 mb-2 overflow-hidden">
                 <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: importProgress.total > 0 ? `${(importProgress.current / importProgress.total)*100}%` : '0%' }}></div>
               </div>
               <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                 Mohon jangan tutup jendela ini selama proses berlangsung untuk mencegah data korup.
               </p>
             </>
          )}

          {importDone && (
            <div className="w-full text-left">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${importErrors.length === 0 ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'}`}>
                  {importErrors.length === 0 ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Laporan Impor Data</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Proses impor telah selesai. {importProgress.current - importErrors.filter(e => e.reason !== 'Identitas sudah terdaftar di Sistem' && e.reason !== 'Data kembar di dalam file CSV').length} data berhasil masuk sistem.
              </p>

              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 max-h-60 overflow-y-auto mb-6">
                  <h4 className="font-bold text-rose-800 text-sm mb-3">Terdapat {importErrors.length} Data Bermasalah:</h4>
                  <ul className="space-y-3">
                    {importErrors.map((err, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 bg-white border border-rose-200 text-rose-600 font-mono text-xs px-2 py-0.5 rounded-lg h-fit">Baris {err.row}</span>
                        <div>
                          <p className="font-bold text-slate-700 leading-none">{err.name}</p>
                          <p className="text-rose-500 text-xs mt-1">{err.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="primary" className="w-full justify-center py-3" onClick={closeImportModal}>Tutup Laporan</Button>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}

export default AdminDashboard;
