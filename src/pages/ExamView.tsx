import { useState, useEffect, useRef } from "react";
import { apiRequest } from "../api/client";
import { useAuthStore } from "../store/authStore";

interface ExamViewProps {
  examId: number | null;
  onEndExam: () => void;
}

function ExamView({ examId, onEndExam }: ExamViewProps) {
  const { user } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showNav, setShowNav] = useState(false); // mobile nav drawer

  const [timeLeft, setTimeLeft] = useState(0);
  const [studentId, setStudentId] = useState<number>(0);

  // Initial Fetch
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const dbRes = await apiRequest(`/api/student/dashboard?username=${user}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.student?.id) {
            setStudentId(dbData.student.id);
          }
        }

        const res = await apiRequest(`/api/student/exams/${examId}`);
        if (res.ok) {
          const data = await res.json();
          setExam(data.exam);
          setQuestions(data.questions || []);
          setTimeLeft((data.exam?.duration_minutes || 90) * 60);
        } else {
          console.error("Failed to fetch exam:", await res.json().catch(() => ({})));
        }
      } catch (err) {
        console.error("Error in fetchExam:", err);
      } finally {
        setLoading(false);
      }
    };
    if (examId && user) fetchExam();
    else if (!examId) setLoading(false);
  }, [examId, user]);

  // Timer
  useEffect(() => {
    if (!isFullscreen || timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFullscreen, loading, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/api/student/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, answers }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Ujian berhasil dikumpulkan!\nSkor Anda: ${result.score.toFixed(1)}`);
        document.exitFullscreen().catch(e => console.error(e));
        onEndExam();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengumpulkan ujian');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  // Anti-cheat + WebSocket reporting (silent – no student UI popup)
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws/exam");
    socket.onopen = () => console.log("Connected to Exam WS Server");
    wsRef.current = socket;

    const reportCheat = (type: string) => {
      const time = new Date().toLocaleTimeString();
      const msg = `Siswa [${user || 'Unknown'}] terdeteksi pelanggaran: ${type}`;
      // Send to teacher monitoring only – no UI popup for student
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(`${msg} pada Jam ${time}`);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) reportCheat("Keluar dari layar ujian utama (Lost Focus / Alt+Tab)");
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportCheat("Mencoba klik kanan (ContextMenu terlarang)");
    };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); reportCheat("Mencoba Copy text"); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); reportCheat("Mencoba Paste text"); };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) reportCheat("Sengaja keluar dari mode Fullscreen");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Fullscreen error: ${err.message}`);
    });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Memuat Data Ujian...</p>
      </div>
    );
  }

  // ── Error / Empty ──
  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 p-6">
        <div className="text-6xl">📭</div>
        <h2 className="text-xl font-bold">Ujian tidak valid atau belum ada soal.</h2>
        <button onClick={onEndExam} className="bg-teal-600 px-8 py-3 rounded-2xl text-white font-bold hover:bg-teal-500 transition-all active:scale-95">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // ── Pre-exam Gate (Fullscreen entry) ──
  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="relative z-10 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto bg-slate-700 rounded-full flex items-center justify-center mb-6 border-4 border-slate-600">
            <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Sistem Aman Diaktifkan</h1>
          <p className="text-slate-300 text-sm sm:text-base font-medium mb-8 leading-relaxed">
            Untuk mengikuti ujian <strong>{exam.title}</strong>, browser Anda akan masuk ke mode layar penuh. <strong className="text-rose-400">Segala aktivitas mencurigakan</strong> seperti pindah tab, minimize, klik kanan, atau screenshot akan tercatat dan dilaporkan ke pengawas.
          </p>
          <button
            onClick={enterFullscreen}
            className="w-full bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(13,148,136,0.4)] transition-all flex items-center justify-center gap-3"
          >
            Mulai Kerjakan
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
          <button onClick={onEndExam} className="mt-5 text-slate-400 font-bold text-sm hover:text-white transition-colors">
            Batal & Kembali
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const options: { id: string; text: string }[] = [];
  if (currentQ.type.toUpperCase() === 'PG') {
    if (currentQ.option_a) options.push({ id: 'a', text: currentQ.option_a });
    if (currentQ.option_b) options.push({ id: 'b', text: currentQ.option_b });
    if (currentQ.option_c) options.push({ id: 'c', text: currentQ.option_c });
    if (currentQ.option_d) options.push({ id: 'd', text: currentQ.option_d });
    if (currentQ.option_e) options.push({ id: 'e', text: currentQ.option_e });
  }
  const answeredCount = Object.keys(answers).length;

  // ── Exam Room (Fullscreen) ──
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans select-none overflow-hidden">

      {/* ── STICKY TOP HEADER (Compact Mobile) ── */}
      <header className="flex-none h-12 sm:h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setShowNav(v => !v)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 active:bg-slate-200 transition flex items-center justify-center shrink-0 md:hidden"
            aria-label="Navigasi soal"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 text-xs sm:text-sm truncate leading-tight">{exam.title}</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">{user} · {answeredCount}/{questions.length} dijawab</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg font-mono font-bold text-xs sm:text-base transition-all ${timeLeft <= 300 ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-56 flex-col bg-white border-r border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-800">
            <p className="text-white font-bold text-xs tracking-widest uppercase">Navigasi Soal</p>
            <p className="text-slate-400 text-[11px] mt-0.5">{answeredCount}/{questions.length} dijawab</p>
          </div>
          <div className="flex-1 p-3 grid grid-cols-5 gap-1.5 overflow-y-auto content-start">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isActive = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${isActive ? 'bg-teal-600 text-white shadow-md scale-110' : isAnswered ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── MOBILE NAV DRAWER OVERLAY ── */}
        {showNav && (
          <div className="fixed inset-0 z-30 md:hidden" onClick={() => setShowNav(false)}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-4 bg-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Navigasi Soal</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{answeredCount}/{questions.length} dijawab</p>
                </div>
                <button onClick={() => setShowNav(false)} className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600">✕</button>
              </div>
              <div className="flex gap-3 px-4 py-2 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-teal-600"></span>Aktif</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-200 border border-emerald-300"></span>Selesai</span>
              </div>
              <div className="flex-1 p-3 grid grid-cols-5 gap-1.5 overflow-y-auto content-start">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentIndex(idx); setShowNav(false); }}
                      className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${isActive ? 'bg-teal-600 text-white shadow-md' : isAnswered ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN QUESTION AREA ── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Scrollable question content */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-4 sm:py-6">
            <div className="max-w-3xl mx-auto">

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8 mb-5">
                <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-100">
                  <span className={`font-bold px-2.5 py-1 rounded-md border uppercase text-[10px] sm:text-xs tracking-wider ${currentQ.type.toUpperCase() === 'PG' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                    {currentQ.type.toUpperCase() === 'PG' ? 'Pilihan Ganda' : 'Essay'}
                  </span>
                  <span className="text-slate-500 text-[11px] sm:text-sm font-medium">
                    <span className="text-teal-600 font-bold">{currentQ.points} poin</span>
                  </span>
                </div>

                {/* Question text */}
                <p className="text-sm sm:text-lg font-semibold text-slate-800 leading-relaxed mb-5 sm:mb-6 whitespace-pre-wrap selection:bg-teal-100">
                  {currentQ.question_text}
                </p>

                {/* Options / Essay */}
                {currentQ.type.toUpperCase() === 'PG' ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {options.map((opt) => {
                      const selected = answers[currentQ.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${selected ? 'border-teal-500 bg-teal-50 shadow-sm ring-1 ring-teal-500' : 'border-slate-200 bg-white hover:border-teal-300'}`}
                        >
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm transition-all mt-0.5 ${selected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 text-slate-500'}`}>
                            {opt.id.toUpperCase()}
                          </div>
                          <input
                            type="radio"
                            name={`q-${currentQ.id}`}
                            className="sr-only"
                            checked={selected}
                            onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))}
                          />
                          <span className={`text-sm sm:text-base font-medium leading-snug pt-0.5 sm:pt-1 ${selected ? 'text-teal-900' : 'text-slate-700'}`}>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    className="w-full p-4 border border-slate-300 rounded-xl min-h-[120px] sm:min-h-[160px] focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-slate-700 font-medium resize-y text-sm sm:text-base bg-slate-50 focus:bg-white transition-colors"
                    placeholder="Ketik jawaban essay Anda di sini..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  />
                )}
              </div>

            </div>
          </div>

          {/* ── STICKY BOTTOM NAVIGATION (Compact Mobile) ── */}
          <div className="flex-none bg-white border-t border-slate-200 px-3 sm:px-6 md:px-10 py-2.5 sm:py-4 z-10 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-3">

              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center justify-center gap-2 w-12 sm:w-auto px-0 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold bg-slate-50 active:bg-slate-100 disabled:opacity-40 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                  Soal {currentIndex + 1} / {questions.length}
                </div>
              </div>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => {
                    if (window.confirm("Yakin ingin menyelesaikan ujian dan mengirimkan jawaban?")) handleSubmit();
                  }}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-teal-600 text-white font-bold active:bg-teal-700 disabled:opacity-50 text-sm w-auto shadow-sm shadow-teal-600/20"
                >
                  <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>{submitting ? '...' : 'Selesai'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center justify-center gap-2 w-12 sm:w-auto px-0 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-teal-600 text-white font-semibold active:bg-teal-700 text-sm shadow-sm shadow-teal-600/20"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default ExamView;