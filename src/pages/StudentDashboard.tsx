import { useState, useEffect } from "react";
import MobileNav from "../components/MobileNav";
import { apiRequest, API_URL } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Sidebar } from "../components/organisms/Sidebar";
import { TopNav } from "../components/organisms/TopNav";
import { Card } from "../components/molecules/Card";
import { Button } from "../components/atoms/Button";
import { Badge } from "../components/atoms/Badge";

function StudentDashboard({ onStartExam }: { onStartExam: (examId: number) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'home', label: 'Beranda', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
    { id: 'exam', label: 'Ujian Tersedia', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>, badge: data?.exams?.length || 0 },
    { id: 'profile', label: 'Profil Akademik', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
    { id: 'logout', label: 'Keluar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> },
  ];

  const handleNavChange = (id: string) => {
    if (id === 'logout') {
      if (window.confirm("Keluar dari Simaboy?")) logout(API_URL);
    } else {
      setActiveTab(id);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!user) return;
        const res = await apiRequest(`/api/student/dashboard?username=${user}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch student data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><Badge pulsing variant="info">Memuat Dashboard Pintar...</Badge></div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden pb-16 md:pb-0">
      <MobileNav items={navItems} activeTab={activeTab} onTabChange={handleNavChange} />
      
      <Sidebar 
        appName="SIMABOY CBT"
        userName={data.student.name}
        userRole={`NIS: ${data.student.nis} | Kelas: ${data.student.class_name}`}
        brandGradient="from-teal-600 to-emerald-600"
        items={navItems}
        activeTab={activeTab}
        onTabChange={handleNavChange}
        onLogout={() => logout(API_URL)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-28 md:pb-0 scroll-smooth">
        <TopNav 
          title={`Halo, ${data.student.name.split(' ')[0]} 👋`}
          subtitle="Selamat datang di Portal Siswa Terpadu"
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 animate-fade-in-up">
          
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card variant="glass" className="col-span-1 md:col-span-2 relative overflow-hidden group !p-8 border-indigo-100 shadow-indigo-100/50 hover:shadow-2xl">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full mix-blend-multiply opacity-10 group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Ujian Berlangsung / Akan Datang</h3>
                   <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">
                     {data.exams?.length > 0 ? data.exams[0].title : "Tidak ada jadwal ujian saat ini 🎉"}
                   </h2>
                   {data.exams?.length > 0 && (
                     <>
                       <div className="flex gap-4 mb-8">
                         <Badge variant="warning">Waktu: {data.exams[0].duration_minutes || 90} Menit</Badge>
                         <Badge variant="neutral">Mode Anti-Cheat Aktif</Badge>
                       </div>
                       <Button variant="primary" size="lg" onClick={() => onStartExam(data.exams[0].id)} className="group-hover:-translate-y-1">
                         Masuk Ruang Ujian (CBT)
                       </Button>
                     </>
                   )}
                 </Card>

                 <Card variant="glass-dark" className="p-8 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500 rounded-full mix-blend-screen opacity-20 filter blur-xl"></div>
                    <div className="relative z-10">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pencapaian Rata-Rata</h3>
                       <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter">
                         {Number(data.score || 0).toFixed(1)}
                       </div>
                       <p className="text-emerald-400 text-xs mt-3 font-bold flex items-center gap-1">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                         Ayo tingkatkan prestasimu!
                       </p>
                    </div>
                 </Card>
              </div>

              <Card className="!p-8">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-inner">📅</div> 
                     Riwayat Kehadiran Terakhir
                   </h3>
                   <Button variant="outline" size="sm">Lihat Semua</Button>
                 </div>

                 <div className="space-y-4">
                    {data.attendance?.length > 0 ? data.attendance.map((att: any, i: number) => {
                      const isGood = att.status === 'Hadir' || att.status === 'Izin' || att.status === 'Sakit';
                      return (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors hover:shadow-md">
                           <div>
                             <div className="font-bold text-slate-700">{att.subject}</div>
                             <div className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2">
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                               {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                             </div>
                           </div>
                           <div>
                              <Badge variant={isGood ? 'success' : 'error'}>{att.status}</Badge>
                           </div>
                        </div>
                      );
                    }) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-bold text-slate-500">Jurnal kehadiran masih kosong.</p>
                      </div>
                    )}
                 </div>

                 {data.attendance?.some((a: any) => a.status === 'Alpha' || a.status === 'Bolos') && (
                    <div className="mt-8 bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">⚠️</div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-800">Pemberitahuan Orang Tua</h4>
                        <p className="text-xs text-rose-600 mt-1 font-medium leading-relaxed">Terdapat ketidakhadiran tanpa keterangan ("Alpha / Bolos"). Sistem otomatis telah mengirimkan peringatan ke nomor WhatsApp wali murid Anda.</p>
                      </div>
                    </div>
                 )}
              </Card>
            </>
          )}

          {activeTab === 'exam' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Ujian Tersedia</h2>
                    <p className="text-slate-500 mt-1">Ujian yang aktif dan wajib Anda kerjakan.</p>
                  </div>
                </div>

                {data.exams?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.exams.map((exam: any) => {
                       const isDone = data.history?.some((h: any) => h.exam_id === exam.id);
                       return (
                         <Card key={exam.id} className="relative overflow-hidden group hover:shadow-xl transition-all border-slate-200">
                           <div className="p-6">
                             <div className="flex items-center justify-between mb-4">
                               <Badge variant={isDone ? "success" : "info"}>{isDone ? "Selesai" : "Tersedia"}</Badge>
                               <span className="text-xs font-bold text-slate-400 font-mono">⏱ {exam.duration_minutes || 90} mnt</span>
                             </div>
                             <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{exam.title}</h3>
                             <p className="text-sm text-slate-500 mb-6 line-clamp-2">{exam.description || "Ujian ini sedang berlangsung. Silakan kerjakan dengan jujur."}</p>
                             
                             <Button 
                               variant={isDone ? "outline" : "primary"} 
                               className="w-full"
                               disabled={isDone}
                               onClick={() => { if (!isDone) onStartExam(exam.id) }}
                             >
                               {isDone ? "Telah Diselesaikan 🏆" : "Mulai Kerjakan 🚀"}
                             </Button>
                           </div>
                         </Card>
                       );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <span className="text-5xl opacity-40 mb-4 block">🎉</span>
                    <h3 className="text-lg font-bold text-slate-700">Hore! Tidak ada ujian saat ini.</h3>
                    <p className="text-slate-500 mt-1">Anda sudah menyelesaikan semua kewajiban akademik.</p>
                  </div>
                )}
              </div>
          )}

          {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-6">Riwayat Nilai Ujian</h2>
                {data.history?.length > 0 ? (
                  <Card className="overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-5 font-bold border-b border-slate-100">Waktu Penyelesaian</th>
                            <th className="p-5 font-bold border-b border-slate-100">ID Ujian</th>
                            <th className="p-5 font-bold border-b border-slate-100 text-right">Skor Akhir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                          {data.history.map((h: any) => (
                            <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-5 text-slate-600 font-mono">{new Date(h.created_at).toLocaleString('id-ID')}</td>
                              <td className="p-5 font-bold text-slate-800">Exam #{h.exam_id}</td>
                              <td className="p-5 text-right">
                                 <span className={`inline-block px-3 py-1 rounded-lg font-black ${h.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                   {h.score.toFixed(1)}
                                 </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-500 font-medium">Belum ada riwayat ujian yang diselesaikan.</p>
                  </div>
                )}
              </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
