import React, { useState, useEffect } from "react";
import MobileNav from "../components/MobileNav";
import { API_URL, apiRequest } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Sidebar } from "../components/organisms/Sidebar";
import { TopNav } from "../components/organisms/TopNav";
import { Badge } from "../components/atoms/Badge";
import { PullToRefresh } from "../components/atoms/PullToRefresh";

function TeacherDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  const [jurnalTopic, setJurnalTopic] = useState("");
  const [jurnalNotes, setJurnalNotes] = useState("");

  // Data Jadwal & Hari
  const [schedules, setSchedules] = useState<any[]>([]);
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const todayName = DAYS[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(WEEKDAYS.includes(todayName) ? todayName : 'Senin');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, +1 = next week
  const [activeScheduleId, setActiveScheduleId] = useState<number | ''>("");

  // Compute the Monday of the current displayed week
  const getWeekMonday = (offset: number) => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const diffToMon = day === 0 ? -6 : 1 - day; // days to go back to Monday
    const mon = new Date(today);
    mon.setDate(today.getDate() + diffToMon + offset * 7);
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  // Returns a map of { Senin: Date, Selasa: Date, ... } for displayed week
  const getWeekDates = (offset: number): Record<string, Date> => {
    const mon = getWeekMonday(offset);
    return {
      'Senin': new Date(mon.getTime() + 0 * 86400000),
      'Selasa': new Date(mon.getTime() + 1 * 86400000),
      'Rabu': new Date(mon.getTime() + 2 * 86400000),
      'Kamis': new Date(mon.getTime() + 3 * 86400000),
      'Jumat': new Date(mon.getTime() + 4 * 86400000),
      'Sabtu': new Date(mon.getTime() + 5 * 86400000),
      'Minggu': new Date(mon.getTime() + 6 * 86400000),
    };
  };

  const fmtDay = (d: Date) => d.getDate();
  const fmtMonShort = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short' });
  const isActualToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const [attendance, setAttendance] = useState<{ id: number; name: string; nis?: string; status: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'jadwal' | 'jurnal' | 'absensi' | 'monitor' | 'banksoal'>('jadwal');
  const [myAttendances, setMyAttendances] = useState<any[]>([]);
  const [myAttendanceRecap, setMyAttendanceRecap] = useState({ Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 });
  const { logout, user, teacherId } = useAuthStore();

  const navItems = [
    { id: 'jadwal', label: 'Jadwal Saya', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
    { id: 'jurnal', label: 'Jurnal Kelas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> },
    { id: 'absensi', label: 'Absensi Saya', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: 'monitor', label: 'Monitoring Ujian', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>, badge: logs.length > 1 ? logs.length - 1 : undefined },
    { id: 'banksoal', label: 'Bank Ujian', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.247 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
    { id: 'logout', label: 'Keluar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> },
  ];

  const handleNavChange = (id: string) => {
    if (id === 'logout') {
      if (window.confirm("Akhiri sesi mengajar?")) logout(API_URL);
    } else {
      setActiveTab(id as any);
    }
  };

  const [exams, setExams] = useState<any[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState({ title: '', description: '', subject_id: 0, class_id: 0, duration_minutes: 60 });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  // Edit soal state
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const emptyQForm = { type: 'PG', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'a', answer_key: '', points: 1 };
  const [questionForm, setQuestionForm] = useState(emptyQForm);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [viewingResults, setViewingResults] = useState<any | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (activeTab === 'jadwal' || activeTab === 'jurnal') {
      fetchSchedules();
    }
    if (activeTab === 'absensi') {
      fetchMyAttendances();
    }
    if (activeTab === 'banksoal') {
      fetchExams();
      fetchSubjectsAndClasses();
    }
  }, [activeTab, selectedDay, teacherId]);

  const fetchExams = async () => {
    try {
      const res = await apiRequest('/api/academic/exams/me');
      if (res.ok) { const data = await res.json(); setExams(data.data || []); }
    } catch (err) { console.error(err); }
  };

  const fetchSubjectsAndClasses = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        apiRequest('/api/academic/subjects'),
        apiRequest('/api/academic/classes'),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setSubjects(d.data || []); }
      if (cRes.ok) { const d = await cRes.json(); setClasses(d.data || []); }
    } catch (err) { console.error(err); }
  };

  const submitCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title || !examForm.duration_minutes) return alert('Judul dan durasi wajib diisi!');
    const res = await apiRequest('/api/academic/exams', {
      method: 'POST',
      body: JSON.stringify(examForm),
    });
    if (res.ok) {
      setExamForm({ title: '', description: '', subject_id: 0, class_id: 0, duration_minutes: 60 });
      setShowExamForm(false);
      fetchExams();
    } else {
      const d = await res.json();
      alert(d.error || 'Gagal membuat ujian');
    }
  };

  const deleteExam = async (id: number) => {
    if (!window.confirm('Hapus ujian ini?')) return;
    const res = await apiRequest(`/api/academic/exams/${id}`, { method: 'DELETE' });
    if (res.ok) fetchExams();
  };

  const toggleExamStatus = async (id: number, current: boolean) => {
    await apiRequest(`/api/academic/exams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !current }),
    });
    fetchExams();
  };

  const openEditSoal = async (exam: any) => {
    setEditingExam(exam);
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm(emptyQForm);
    fetchQuestions(exam.id);
  };

  const fetchResults = async (exam: any) => {
    setViewingResults(exam);
    setResultsData([]);
    try {
      const res = await apiRequest(`/api/academic/exams/${exam.id}/results`);
      if (res.ok) {
        const d = await res.json();
        setResultsData(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async (examId: number) => {
    try {
      const res = await apiRequest(`/api/academic/exams/${examId}/questions`);
      if (res.ok) { const d = await res.json(); setQuestions(d.data || []); }
    } catch (err) { console.error(err); }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Tipe,Pertanyaan,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci,Poin\nPG,Ibukota Indonesia adalah?,Medan,Surabaya,Jakarta,Bandung,Semarang,c,1\nessay,Jelaskan fungsi dari UUD 1945!,,,,,,,Sebagai dasar negara,2";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_simaboy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingExam) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${API_URL}/api/academic/exams/${editingExam.id}/questions/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        fetchQuestions(editingExam.id);
        fetchExams(); // Update initial list counts
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal import soal');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    if (editingQuestion) {
      // Update
      await apiRequest(`/api/academic/questions/${editingQuestion.id}`, {
        method: 'PUT', body: JSON.stringify(questionForm),
      });
    } else {
      // Create
      await apiRequest(`/api/academic/exams/${editingExam.id}/questions`, {
        method: 'POST', body: JSON.stringify(questionForm),
      });
    }
    setQuestionForm(emptyQForm);
    setShowQuestionForm(false);
    setEditingQuestion(null);
    fetchQuestions(editingExam.id);
  };

  const deleteQuestion = async (id: number) => {
    if (!window.confirm('Hapus soal ini?')) return;
    await apiRequest(`/api/academic/questions/${id}`, { method: 'DELETE' });
    if (editingExam) fetchQuestions(editingExam.id);
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setQuestionForm({
      type: q.type, question_text: q.question_text,
      option_a: q.option_a, option_b: q.option_b, option_c: q.option_c,
      option_d: q.option_d, option_e: q.option_e,
      correct_answer: q.correct_answer, answer_key: q.answer_key,
      points: q.points,
    });
    setShowQuestionForm(true);
  };


  const fetchMyAttendances = async () => {
    try {
      const res = await apiRequest('/api/academic/attendance/me');
      if (res.ok) {
        const data = await res.json();
        setMyAttendances(data.data || []);
        setMyAttendanceRecap(data.recap || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 });
      }
    } catch (err) { console.error(err); }
  };

  const fetchSchedules = async () => {
    if (!teacherId) return;
    try {
      // For calendar view (jadwal), fetch ALL days at once; for jurnal select today only
      const url = activeTab === 'jurnal'
        ? `/api/academic/schedules?teacher_id=${teacherId}&day=${todayName === 'Minggu' ? 'Senin' : todayName}`
        : `/api/academic/schedules?teacher_id=${teacherId}`;
      const res = await apiRequest(url);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.data || []);
      }
    } catch (err) { console.error(err); }
  };


  const handleScheduleSelect = async (schedId: number) => {
    setActiveScheduleId(schedId);
    if (!schedId) { setAttendance([]); return; }
    const sched = schedules.find(s => s.id === schedId);
    if (!sched || !sched.class_id) {
      setAttendance([]);
      return;
    }
    // Fetch students in this class using the guru-accessible endpoint
    try {
      const res = await apiRequest(`/api/academic/class-students?class_id=${sched.class_id}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance((data.data || []).map((s: any) => ({ id: s.id, name: s.name, nis: s.nis, status: '' })));
      }
    } catch (err) { console.error(err); }
  };

  const submitTeacherAttendance = async (status: string) => {
    if (!teacherId) return alert("Teacher ID tidak ditemukan");

    const today = new Date().toISOString().split('T')[0];
    let latitude = 0, longitude = 0, locationName = '';

    // For "Hadir" → GPS location wajib
    if (status === 'Hadir') {
      if (!navigator.geolocation) {
        return alert("Browser Anda tidak mendukung geolocation. Tidak bisa melakukan absensi Hadir.");
      }
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        // Reverse geocode via OpenStreetMap Nominatim
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geoRes.json();
          locationName = geoData.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        } catch {
          locationName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
      } catch (err: any) {
        if (err.code === 1) return alert("Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk absensi Hadir.");
        if (err.code === 2) return alert("Lokasi tidak dapat dideteksi. Pastikan GPS aktif.");
        return alert("Gagal mendapatkan lokasi. Coba lagi.");
      }
    }

    const res = await apiRequest("/api/academic/attendance/teacher", {
      method: "POST",
      body: JSON.stringify({
        teacher_id: teacherId,
        status,
        date: today,
        latitude,
        longitude,
        location_name: locationName,
      })
    });

    if (res.ok) {
      alert(`✅ Absensi "${status}" berhasil dicatat${locationName ? `\n📍 ${locationName.substring(0, 80)}...` : ''}`);
      // Refresh attendance data if on the absensi tab
      if (activeTab === 'absensi') fetchMyAttendances();
    } else {
      const body = await res.json();
      const msg = body.error || "Gagal melakukan presensi";
      // 409 = already recorded today
      if (res.status === 409) alert(`⚠️ ${msg}`);
      else alert(`❌ ${msg}`);
    }
  };

  const submitJurnalAndAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jurnalTopic || !activeScheduleId) return alert("Materi dan Jadwal Kelas tidak boleh kosong!");
    if (!teacherId) return alert("Teacher ID not found.");

    const sched = schedules.find(s => s.id === activeScheduleId);
    if (!sched) return;

    const today = new Date().toISOString().split('T')[0];

    // 1. Submit Journal
    await apiRequest("/api/academic/journal", {
      method: "POST", body: JSON.stringify({ teacher_id: teacherId, class_id: sched.class_id, topic: jurnalTopic, notes: jurnalNotes, date: today })
    });

    // 2. Submit Batch Attendance
    if (attendance.length > 0) {
      const payload = attendance.map(a => ({
        student_id: a.id, teacher_id: teacherId, status: a.status, date: today
      }));
      await apiRequest("/api/academic/attendance/student/batch", {
        method: "POST", body: JSON.stringify(payload)
      });
    }

    alert("Berhasil! Jurnal dan absensi kelas tersimpan.");
    setJurnalTopic("");
    setJurnalNotes("");
    setActiveScheduleId("");
    setAttendance([]);
  };
  const handleRefresh = async () => {
    try {
      // Refresh data sesuai dengan tab yang sedang dibuka
      if (activeTab === 'jadwal' || activeTab === 'jurnal') {
        await fetchSchedules();
      } else if (activeTab === 'absensi') {
        await fetchMyAttendances();
      } else if (activeTab === 'banksoal') {
        await fetchExams();
        await fetchSubjectsAndClasses();
      }
    } catch (err) {
      console.error("Gagal refresh", err);
    }

    // Delay 500ms agar animasi spinner terlihat natural
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const socket = new WebSocket("ws://localhost:8080/ws/exam");
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setWsConnected(true);
        setLogs((prev) => [...prev, "Status: Terhubung ke Server Pemantau Anti-Cheat. ✅"]);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${event.data}`, ...prev]);
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setWsConnected(false);
        // Auto-reconnect after 3s if still mounted
        setTimeout(() => connect(), 3000);
      };

      socket.onerror = (err) => {
        console.error("WS error:", err);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, []);



  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden pb-16 md:pb-0">
      <MobileNav items={navItems} activeTab={activeTab} onTabChange={handleNavChange} />

      <Sidebar
        appName="SIMABOY"
        userName={user || "Guru Pengajar"}
        userRole="Tenaga Pendidik"
        brandGradient="from-indigo-500 to-rose-500"
        items={navItems}
        activeTab={activeTab}
        onTabChange={handleNavChange}
        onLogout={() => logout(API_URL)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-28 md:pb-0 scroll-smooth">
        <PullToRefresh onRefresh={handleRefresh}>
          <TopNav
            title={
              activeTab === 'jadwal' ? 'Jadwal Mengajar' :
                activeTab === 'jurnal' ? 'Jurnal Kelas' :
                  activeTab === 'absensi' ? 'Absensi Saya' :
                    activeTab === 'monitor' ? 'Monitoring Ujian' :
                      'Bank Ujian'
            }
            subtitle={
              activeTab === 'jadwal' ? 'Jadwal mengajar mingguan' :
                activeTab === 'jurnal' ? 'Rekap materi & absensi kelas' :
                  activeTab === 'absensi' ? 'Riwayat kehadiran saya' :
                    activeTab === 'monitor' ? 'Deteksi anti-cheat real-time' :
                      'Kelola soal & ujian saya'
            }
          />

          <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
            {activeTab === 'jadwal' && (() => {
              const WEEK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
              const weekDates = getWeekDates(weekOffset);
              const mon = weekDates['Senin'];
              const sun = weekDates['Minggu'];
              const weekRangeLabel = `${fmtDay(mon)} ${fmtMonShort(mon)} – ${fmtDay(sun)} ${fmtMonShort(sun)} ${sun.getFullYear()}`;

              const TIME_SLOTS = [
                { start: '07:00', end: '07:45', label: '07:00' },
                { start: '07:45', end: '08:30', label: '07:45' },
                { start: '08:30', end: '08:45', label: '08:30', isBreak: true, name: '☕ Istirahat Pagi' },
                { start: '08:45', end: '09:30', label: '08:45' },
                { start: '09:30', end: '10:15', label: '09:30' },
                { start: '10:15', end: '10:30', label: '10:15', isBreak: true, name: '🥪 Istirahat' },
                { start: '10:30', end: '11:15', label: '10:30' },
                { start: '11:15', end: '12:00', label: '11:15' },
                { start: '12:00', end: '13:00', label: '12:00', isBreak: true, name: '🕌 ISHOMA' },
                { start: '13:00', end: '13:45', label: '13:00' },
                { start: '13:45', end: '14:30', label: '13:45' },
                { start: '14:30', end: '15:15', label: '14:30' },
              ];

              const mobileSlotsForDay = (day: string) => {
                const rows: any[] = [];
                for (const slot of TIME_SLOTS) {
                  if ((slot as any).isBreak) {
                    rows.push({ ...slot, isBreak: true });
                  } else {
                    const session = schedules.find((s: any) => s.day_of_week === day && s.start_time === slot.start);
                    rows.push({ ...slot, session });
                  }
                }
                return rows;
              };

              return (
                <div className="space-y-4">
                  {/* Header Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">📅</div>
                      <div>
                        <h2 className="font-bold text-slate-800 text-base">Jadwal Mengajar Saya</h2>
                        <p className="text-xs text-slate-400">Mingguan Senin – Jumat</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => submitTeacherAttendance('Hadir')} className="flex-1 sm:flex-none text-sm font-bold rounded-xl px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">✅ Hadir</button>
                      <button onClick={() => submitTeacherAttendance('Izin')} className="flex-1 sm:flex-none text-sm font-bold rounded-xl px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">📋 Izin</button>
                      <button onClick={() => submitTeacherAttendance('Sakit')} className="flex-1 sm:flex-none text-sm font-bold rounded-xl px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors">🤒 Sakit</button>
                    </div>
                  </div>

                  {/* Week Navigator */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <button
                      onClick={() => setWeekOffset(w => w - 1)}
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      ← Minggu Lalu
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">{weekRangeLabel}</p>
                      {weekOffset !== 0 && (
                        <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-0.5">
                          Kembali ke minggu ini
                        </button>
                      )}
                      {weekOffset === 0 && <p className="text-xs text-emerald-500 font-medium mt-0.5">Minggu Ini</p>}
                    </div>
                    <button
                      onClick={() => setWeekOffset(w => w + 1)}
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      Minggu Depan →
                    </button>
                  </div>

                  {/* ─── MOBILE VIEW: day scroll chips + vertical timeline ─── */}
                  <div className="block md:hidden space-y-3">
                    {/* Day Picker Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {WEEK_DAYS.map(d => {
                        const dayDate = weekDates[d];
                        const isToday = isActualToday(dayDate);
                        const isSelected = d === selectedDay;
                        return (
                          <button
                            key={d}
                            onClick={() => setSelectedDay(d as any)}
                            className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl text-sm font-bold transition-all shadow-sm min-w-[56px] ${isSelected
                              ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md scale-105'
                              : isToday
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                          >
                            <span className="text-xs font-black">{d.substring(0, 3)}</span>
                            <span className={`text-base font-black leading-tight ${isSelected ? 'text-white' : isToday ? 'text-indigo-700' : 'text-slate-800'}`}>{fmtDay(dayDate)}</span>
                            <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{fmtMonShort(dayDate)}</span>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-current mt-0.5 opacity-70"></span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Timeline */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {mobileSlotsForDay(selectedDay).map((item: any, i: number) => {
                        if (item.isBreak) {
                          return (
                            <div key={i} className="flex items-center gap-3 bg-amber-50 px-4 py-2 border-b border-amber-100">
                              <span className="text-xs font-bold text-amber-600 w-10 shrink-0">{item.label}</span>
                              <div className="h-px flex-1 bg-amber-200"></div>
                              <span className="text-xs font-bold text-amber-700">{item.name}</span>
                              <div className="h-px flex-1 bg-amber-200"></div>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="flex items-stretch gap-0 border-b border-slate-100 last:border-b-0">
                            <div className="w-14 shrink-0 flex flex-col items-center justify-center py-3 border-r border-slate-100 bg-slate-50">
                              <span className="text-[11px] font-bold text-slate-500">{item.label}</span>
                            </div>
                            <div className="flex-1 px-3 py-2 flex items-center">
                              {item.session ? (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 w-full">
                                  <p className="text-sm font-bold text-indigo-800 leading-tight">{item.session.subject_name}</p>
                                  <p className="text-xs text-indigo-500 mt-0.5">Kelas {item.session.class_name}</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                  <span className="text-xs">Tidak ada kelas</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── DESKTOP VIEW: full weekly grid ─── */}
                  <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[620px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="w-28 py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-100">Waktu</th>
                            {WEEK_DAYS.map(d => {
                              const dayDate = weekDates[d];
                              const today = isActualToday(dayDate);
                              return (
                                <th key={d} className={`py-2 px-2 text-center ${today ? 'text-indigo-600 bg-indigo-50/60' : 'text-slate-500'}`}>
                                  <p className="text-[10px] font-bold uppercase tracking-wider">{d.substring(0, 3)}</p>
                                  <p className={`text-lg font-black leading-tight ${today ? 'text-indigo-600' : 'text-slate-700'}`}>{fmtDay(dayDate)}</p>
                                  <p className="text-[10px] text-slate-400">{fmtMonShort(dayDate)}</p>
                                  {today && <span className="text-[9px] uppercase bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block">Hari ini</span>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {TIME_SLOTS.map((slot, i) => {
                            if ((slot as any).isBreak) {
                              return (
                                <tr key={i} className="bg-amber-50/60 border-b border-amber-100">
                                  <td className="py-1.5 px-3 text-xs font-semibold text-amber-600 border-r border-amber-100 whitespace-nowrap">{slot.label}</td>
                                  <td colSpan={7} className="py-1.5 px-4 text-xs font-bold text-amber-700 text-center tracking-wide">{(slot as any).name}</td>
                                </tr>
                              );
                            }
                            return (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3 text-xs font-semibold text-slate-400 border-r border-slate-100 whitespace-nowrap">{slot.label}</td>
                                {WEEK_DAYS.map(day => {
                                  const dayDate = weekDates[day];
                                  const today = isActualToday(dayDate);
                                  const classSession = schedules.find((s: any) => s.day_of_week === day && s.start_time === slot.start);
                                  return (
                                    <td key={day} className={`py-1.5 px-2 text-center align-middle ${today ? 'bg-indigo-50/30' : ''}`}>
                                      {classSession ? (
                                        <div className="bg-indigo-100 border border-indigo-200 rounded-xl px-2 py-1.5 text-left hover:bg-indigo-200 transition-colors cursor-default">
                                          <p className="text-xs font-bold text-indigo-800 leading-tight truncate">{classSession.subject_name}</p>
                                          <p className="text-[10px] text-indigo-500 truncate">Kls {classSession.class_name}</p>
                                        </div>
                                      ) : (
                                        <div className="h-8 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 inline-block"></span>Kelas Anda</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block"></span>Istirahat</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 inline-block"></span>Kosong</span>
                  </div>
                </div>
              );
            })()}



            {activeTab === 'absensi' && (() => {
              const total = myAttendances.length;
              const pctHadir = total > 0 ? Math.round((myAttendanceRecap.Hadir / total) * 100) : 0;
              const statusColor: Record<string, string> = {
                Hadir: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                Sakit: 'bg-amber-100 text-amber-700 border-amber-200',
                Izin: 'bg-blue-100 text-blue-700 border-blue-200',
                Alpa: 'bg-rose-100 text-rose-700 border-rose-200',
              };
              return (
                <div className="space-y-5">
                  {/* Recap Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Hadir', value: myAttendanceRecap.Hadir, icon: '✅', color: 'emerald' },
                      { label: 'Sakit', value: myAttendanceRecap.Sakit, icon: '🤒', color: 'amber' },
                      { label: 'Izin', value: myAttendanceRecap.Izin, icon: '📋', color: 'blue' },
                      { label: 'Alpa', value: myAttendanceRecap.Alpa, icon: '❌', color: 'rose' },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{icon}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor[label] || ''}`}>{label}</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{value}</p>
                        <p className="text-xs text-slate-400">hari {label.toLowerCase()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Attendance Rate Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-700">Tingkat Kehadiran</p>
                      <span className={`text-sm font-black ${pctHadir >= 80 ? 'text-emerald-600' : pctHadir >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{pctHadir}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pctHadir >= 80 ? 'bg-emerald-500' : pctHadir >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${pctHadir}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Total {total} hari tercatat · Standar kehadiran minimal 80%</p>
                  </div>

                  {/* History Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">🗂️</div>
                      <h3 className="font-bold text-slate-800">Riwayat Absensi</h3>
                      <span className="ml-auto text-xs text-slate-400">{total} entri</span>
                    </div>
                    {myAttendances.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="font-medium text-sm">Belum ada riwayat absensi</p>
                        <p className="text-xs mt-1">Tekan tombol Hadir / Izin / Sakit di tab Jadwal Saya untuk mencatat kehadiran</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-10">No</th>
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Hari</th>
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                              <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myAttendances.map((row: any, idx: number) => {
                              const d = row.date ? new Date(row.date) : null;
                              const dayLabel = d ? d.toLocaleDateString('id-ID', { weekday: 'long' }) : '-';
                              const dateLabel = d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                              return (
                                <tr key={row.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                  <td className="px-5 py-3 text-slate-400 text-xs font-medium">{idx + 1}</td>
                                  <td className="px-5 py-3 font-medium text-slate-700">{dateLabel}</td>
                                  <td className="px-5 py-3 text-slate-500 capitalize">{dayLabel}</td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor[row.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 max-w-xs">
                                    {row.latitude && row.latitude !== 0 ? (
                                      <a
                                        href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-600 hover:text-indigo-800 underline line-clamp-2 block"
                                        title={row.location_name}
                                      >
                                        📍 {row.location_name ? row.location_name.substring(0, 50) + (row.location_name.length > 50 ? '…' : '') : `${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`}
                                      </a>
                                    ) : (
                                      <span className="text-xs text-slate-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'jurnal' && (() => {
              const unfilledCount = attendance.filter(a => !a.status).length;
              const canSave = !!activeScheduleId && !!jurnalTopic && unfilledCount === 0;
              return (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Step 1: Select Class */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shrink-0">1</div>
                      <h3 className="font-bold text-slate-800">Pilih Sesi Kelas</h3>
                    </div>
                    <select
                      value={activeScheduleId}
                      onChange={(e) => handleScheduleSelect(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                    >
                      <option value="">-- Pilih Kelas & Mata Pelajaran --</option>
                      {schedules.map(s => (
                        <option key={s.id} value={s.id}>{s.day_of_week} · {s.start_time}–{s.end_time} · {s.subject_name} (Kelas {s.class_name})</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Journal */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shrink-0">2</div>
                      <h3 className="font-bold text-slate-800">Tulis Jurnal Mengajar</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Materi Pokok / KD <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={jurnalTopic}
                          onChange={e => setJurnalTopic(e.target.value)}
                          placeholder="Misal: Pewarisan Sifat Mendel"
                          disabled={!activeScheduleId}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Catatan / Hambatan <span className="text-slate-400">(Opsional)</span></label>
                        <textarea
                          rows={3}
                          value={jurnalNotes}
                          onChange={e => setJurnalNotes(e.target.value)}
                          disabled={!activeScheduleId}
                          placeholder="Catatan proses belajar, hambatan, dll."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm transition-all placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Attendance */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shrink-0">3</div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Isi Kehadiran Siswa</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {activeScheduleId
                              ? `${attendance.length} siswa · ${schedules.find(s => s.id === activeScheduleId)?.class_name || ''}`
                              : 'Pilih sesi kelas dulu'}
                          </p>
                        </div>
                      </div>
                      {attendance.length > 0 && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                            {attendance.filter(a => a.status === 'Hadir').length} Hadir
                          </span>
                          {unfilledCount > 0 && (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                              {unfilledCount} belum diisi
                            </span>
                          )}
                          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                            {attendance.filter(a => a.status === 'Alpha' || a.status === 'Bolos').length} Alpha
                          </span>
                        </div>
                      )}
                    </div>

                    {attendance.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-2">
                        <span className="text-4xl">🏫</span>
                        <p className="font-bold text-slate-500 text-sm">Daftar siswa belum dimuat</p>
                        <p className="text-xs text-slate-400">Pilih sesi kelas di langkah 1</p>
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-slate-50">
                          {attendance.map((stu, idx) => (
                            <div key={stu.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${!stu.status ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}`}>
                              <span className="w-6 text-xs font-bold text-slate-300 shrink-0 text-right">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 text-sm truncate">{stu.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{stu.nis || `NIS-${stu.id}`}</p>
                              </div>
                              <select
                                value={stu.status}
                                onChange={(e) => setAttendance(attendance.map(a => a.id === stu.id ? { ...a, status: e.target.value } : a))}
                                className={`
                                outline-none text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none text-center cursor-pointer min-w-[100px] shrink-0
                                ${stu.status === 'Hadir' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                    stu.status === 'Sakit' || stu.status === 'Izin' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      stu.status === 'Alpha' || stu.status === 'Bolos' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                        'bg-amber-50 border-amber-300 text-amber-600'
                                  }
                              `}
                              >
                                <option value="" disabled>— Pilih —</option>
                                <option value="Hadir">✅ Hadir</option>
                                <option value="Sakit">🤒 Sakit</option>
                                <option value="Izin">📋 Izin</option>
                                <option value="Alpha">❌ Alpha</option>
                                <option value="Bolos">🚫 Bolos</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        {/* Mini summary footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-4 gap-2 text-center">
                          {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(s => (
                            <div key={s} className="text-xs">
                              <p className="font-black text-slate-700 text-lg">{attendance.filter(a => a.status === s || (s === 'Alpha' && a.status === 'Bolos')).length}</p>
                              <p className="text-slate-400">{s}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Single Save Button */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    {!canSave && (
                      <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span>
                          {!activeScheduleId ? 'Pilih sesi kelas terlebih dahulu.' :
                            !jurnalTopic ? 'Isi materi pokok / KD terlebih dahulu.' :
                              unfilledCount > 0 ? `${unfilledCount} siswa belum diisi statusnya.` : ''}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); submitJurnalAndAttendance(e as any); }}
                      disabled={!canSave}
                      className={`w-full py-4 rounded-2xl font-black text-base tracking-wide transition-all shadow-sm flex items-center justify-center gap-3
                      ${canSave
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg hover:scale-[1.01]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      💾 Simpan Jurnal & Absensi Kelas
                    </button>
                  </div>
                </div>
              );
            })()}


            {activeTab === 'banksoal' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Bank Ujian Saya</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{exams.length} ujian tersimpan</p>
                  </div>
                  <button
                    onClick={() => setShowExamForm(v => !v)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
                  >
                    {showExamForm ? '✕ Tutup' : '＋ Buat Ujian Baru'}
                  </button>
                </div>

                {/* Create form */}
                {showExamForm && (
                  <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg p-6 animate-fade-in-up">
                    <h3 className="font-bold text-slate-800 mb-5 text-base flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">📝</span>
                      Form Buat Ujian Baru
                    </h3>
                    <form onSubmit={submitCreateExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Judul Ujian <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={examForm.title}
                          onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Misal: UTS Biologi Kelas X"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mata Pelajaran</label>
                        <select
                          value={examForm.subject_id}
                          onChange={e => setExamForm(f => ({ ...f, subject_id: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        >
                          <option value={0}>-- Pilih Mapel --</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kelas</label>
                        <select
                          value={examForm.class_id}
                          onChange={e => setExamForm(f => ({ ...f, class_id: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        >
                          <option value={0}>-- Pilih Kelas --</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Durasi (Menit) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={examForm.duration_minutes}
                          onChange={e => setExamForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deskripsi / Catatan</label>
                        <input
                          type="text"
                          value={examForm.description}
                          onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Opsional"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-3 pt-2">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
                          💾 Simpan Ujian
                        </button>
                        <button type="button" onClick={() => setShowExamForm(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Exam cards */}
                {exams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-3">
                    <span className="text-5xl">📚</span>
                    <p className="font-bold text-slate-500 text-base">Belum ada ujian</p>
                    <p className="text-sm text-slate-400">Klik "Buat Ujian Baru" untuk mulai membuat soal ujian</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exams.map(e => (
                      <div key={e.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-base leading-snug flex-1">{e.title}</h4>
                          <button
                            onClick={() => toggleExamStatus(e.id, e.is_active)}
                            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${e.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                          >
                            {e.is_active ? '● Aktif' : '○ Nonaktif'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {e.subject_name && <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{e.subject_name}</span>}
                          {e.class_name && <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">Kelas {e.class_name}</span>}
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            ⏱ {e.duration_minutes} menit
                          </span>
                        </div>
                        {e.description && <p className="text-xs text-slate-500 leading-relaxed">{e.description}</p>}
                        <p className="text-[10px] text-slate-400 font-mono">{e.created_at}</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => openEditSoal(e)}
                            className="flex-1 text-xs font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-xl transition-all"
                          >
                            ✏️ Soal ({e.question_count ?? 0})
                          </button>
                          <button
                            onClick={() => fetchResults(e)}
                            className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all font-bold text-xs flex items-center justify-center"
                            title="Lihat Nilai Kelas"
                          >
                            🏅
                          </button>
                          <button
                            onClick={() => deleteExam(e.id)}
                            className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── EXAM RESULTS OVERLAY ── */}
            {viewingResults && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingResults(null)} />
                <div className="relative w-full max-w-4xl max-h-[90vh] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-fade-in-up">

                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="font-black text-slate-800 text-lg">🏅 Hasil Nilai Ujian</h2>
                      <p className="text-sm text-slate-500 mt-1">{viewingResults.title} • {viewingResults.class_name}</p>
                    </div>
                    <button onClick={() => setViewingResults(null)} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {resultsData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400 gap-3">
                        <span className="text-4xl opacity-50">📂</span>
                        <p className="font-bold text-sm">Belum ada siswa yang menyelesaikan ujian ini.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                              <th className="p-4 font-bold border-b border-slate-200 rounded-tl-2xl">NIS</th>
                              <th className="p-4 font-bold border-b border-slate-200">Nama Siswa</th>
                              <th className="p-4 font-bold border-b border-slate-200 text-center">Waktu Pengerjaan</th>
                              <th className="p-4 font-bold border-b border-slate-200 text-right rounded-tr-2xl">Nilai Akhir</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {resultsData.map((res: any) => (
                              <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 text-sm text-slate-500 font-mono">{res.nis}</td>
                                <td className="p-4 text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{res.name}</td>
                                <td className="p-4 text-xs text-slate-500 text-center">{res.created_at}</td>
                                <td className="p-4 text-right">
                                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black ${res.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {res.score.toFixed(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ── EDIT SOAL OVERLAY ── */}
            {editingExam && (
              <div className="fixed inset-0 z-[60] flex">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingExam(null)} />
                <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                      <h2 className="font-black text-slate-800 text-base">{editingExam.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{questions.length} soal · {editingExam.duration_minutes} menit</p>
                      <button onClick={downloadCSVTemplate} className="text-[10px] text-indigo-600 hover:underline mt-1 font-bold">Unduh Template CSV</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {importing ? '⏳ Mengimpor...' : '📥 Import CSV'}
                      </button>
                      <button
                        onClick={() => { setShowQuestionForm(true); setEditingQuestion(null); setQuestionForm(emptyQForm); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all"
                      >＋ Tambah Soal</button>
                      <button onClick={() => setEditingExam(null)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">✕</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Question list */}
                    <div className={`flex-1 overflow-y-auto border-r border-slate-100 ${showQuestionForm ? 'hidden md:block' : 'block'}`}>
                      {questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2 p-8">
                          <span className="text-4xl">📝</span>
                          <p className="font-bold text-slate-500 text-sm">Belum ada soal</p>
                          <p className="text-xs">Klik "＋ Tambah Soal" untuk mulai</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {questions.map((q, idx) => (
                            <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.type === 'PG' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{q.type === 'PG' ? 'Pilihan Ganda' : 'Essay'}</span>
                                    <span className="text-[10px] text-slate-400">{q.points} poin</span>
                                  </div>
                                  <p className="text-sm text-slate-700 font-medium leading-snug">{q.question_text}</p>
                                  {q.type === 'PG' && (
                                    <div className="mt-2 space-y-0.5">
                                      {['a', 'b', 'c', 'd', 'e'].map(opt => q[`option_${opt}`] ? (
                                        <p key={opt} className={`text-xs px-2 py-0.5 rounded ${q.correct_answer === opt ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500'}`}>
                                          {opt.toUpperCase()}. {q[`option_${opt}`]}{q.correct_answer === opt ? ' ✓' : ''}
                                        </p>
                                      ) : null)}
                                    </div>
                                  )}
                                  {q.type === 'essay' && q.answer_key && (
                                    <p className="text-xs text-slate-400 mt-1 italic">Kunci: {q.answer_key}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0 mt-1">
                                  <button onClick={() => startEditQuestion(q)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all text-xs">✏️</button>
                                  <button onClick={() => deleteQuestion(q.id)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all text-xs">🗑</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Question form */}
                    {showQuestionForm && (
                      <div className="w-full md:w-96 overflow-y-auto bg-slate-50/50 border-t md:border-t-0 border-slate-100 p-5 pb-20 md:pb-5 flex-1 shrink-0 md:shrink-0 md:flex-none">
                        <h3 className="font-bold text-slate-800 text-sm mb-4">{editingQuestion ? '✏️ Edit Soal' : '＋ Soal Baru'}</h3>
                        <form onSubmit={submitQuestion} className="space-y-3">
                          {/* Type */}
                          <div className="flex gap-2">
                            {[['PG', '⚪ Pilihan Ganda'], ['essay', '✍️ Essay']].map(([t, label]) => (
                              <button key={t} type="button"
                                onClick={() => setQuestionForm(f => ({ ...f, type: t }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${questionForm.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                              >{label}</button>
                            ))}
                          </div>
                          {/* Question text */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pertanyaan *</label>
                            <textarea rows={3} required value={questionForm.question_text}
                              onChange={e => setQuestionForm(f => ({ ...f, question_text: e.target.value }))}
                              placeholder="Tulis pertanyaan..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none"
                            />
                          </div>
                          {/* PG options */}
                          {questionForm.type === 'PG' ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-slate-400">Klik tombol huruf untuk tandai jawaban benar ✓</p>
                              {['a', 'b', 'c', 'd', 'e'].map(opt => (
                                <div key={opt} className="flex gap-2 items-center">
                                  <button type="button"
                                    onClick={() => setQuestionForm(f => ({ ...f, correct_answer: opt }))}
                                    className={`w-8 h-8 rounded-full text-xs font-black shrink-0 border transition-all ${questionForm.correct_answer === opt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                                  >{opt.toUpperCase()}</button>
                                  <input type="text"
                                    value={(questionForm as any)[`option_${opt}`]}
                                    onChange={e => setQuestionForm(f => ({ ...f, [`option_${opt}`]: e.target.value }))}
                                    placeholder={`Opsi ${opt.toUpperCase()}`}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kunci Jawaban (Opsional)</label>
                              <textarea rows={2} value={questionForm.answer_key}
                                onChange={e => setQuestionForm(f => ({ ...f, answer_key: e.target.value }))}
                                placeholder="Jawaban model / kunci..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none"
                              />
                            </div>
                          )}
                          {/* Points */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Poin</label>
                            <input type="number" min={1} value={questionForm.points}
                              onChange={e => setQuestionForm(f => ({ ...f, points: Number(e.target.value) }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all">
                              {editingQuestion ? '💾 Update' : '💾 Simpan'}
                            </button>
                            <button type="button"
                              onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); setQuestionForm(emptyQForm); }}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-all"
                            >Batal</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monitor' && (
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col h-[75vh] overflow-hidden relative group animate-fade-in-up">
                {/* Radar Glow Effect Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(244,63,94,0.05)_0%,transparent_60%)] group-hover:bg-[radial-gradient(circle,rgba(244,63,94,0.1)_0%,transparent_60%)] transition-colors duration-1000 pointer-events-none"></div>

                <div className="px-8 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-slate-400 font-mono text-sm tracking-widest uppercase">Sec-Ops Monitor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {wsConnected
                      ? <Badge pulsing variant="success" className="bg-emerald-500/10 border-0 text-emerald-400">WebSocket Connected</Badge>
                      : <Badge variant="error" className="bg-rose-500/10 border-0 text-rose-400 animate-pulse">Reconnecting...</Badge>
                    }
                  </div>
                </div>

                <div className="p-8 font-mono text-sm overflow-y-auto flex-1 space-y-4 z-10">
                  {logs.length === 0 && <p className="text-slate-600 animate-pulse">Menunggu transmisi keamanan dari device peserta...</p>}
                  {logs.map((log, i) => {
                    const isCheat = log.toLowerCase().includes("pelanggaran");
                    return (
                      <div key={i} className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 ${isCheat ? 'bg-rose-950/40 border-rose-900/60 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.1)] -translate-x-2' : 'bg-slate-800/20 border-slate-800 text-emerald-400/80'}`}>
                        {isCheat && <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">❌</div>}
                        <div className="flex-1 leading-relaxed">
                          {log}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PullToRefresh>
      </main>
    </div>
  );
}

export default TeacherDashboard;
