import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../api/client";

/* ─── tiny hook: animated counter ─── */
function useCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ─── stat badge ─── */
function StatBadge({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const count = useCounter(value);
  return (
    <div className="lb-stat">
      <span className="lb-stat-val">{count}{suffix}</span>
      <span className="lb-stat-label">{label}</span>
    </div>
  );
}

/* ─── floating particle ─── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="lb-particle" style={style} />;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.role, username, data.token, data.teacher_id);
      } else {
        setError(data.error || "Akses ditolak. Kredensial tidak valid.");
      }
    } catch {
      setError("Server tidak merespons. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const particles = [
    { width: 6, height: 6, top: "12%", left: "18%", opacity: 0.35, animationDelay: "0s", animationDuration: "7s" },
    { width: 10, height: 10, top: "28%", left: "72%", opacity: 0.2, animationDelay: "1.5s", animationDuration: "9s" },
    { width: 4, height: 4, top: "58%", left: "9%", opacity: 0.3, animationDelay: "0.8s", animationDuration: "6s" },
    { width: 8, height: 8, top: "75%", left: "55%", opacity: 0.25, animationDelay: "2s", animationDuration: "8s" },
    { width: 5, height: 5, top: "42%", left: "88%", opacity: 0.2, animationDelay: "3s", animationDuration: "10s" },
    { width: 12, height: 12, top: "88%", left: "30%", opacity: 0.15, animationDelay: "1s", animationDuration: "11s" },
  ];

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .lb-root {
          min-height: 100dvh;
          display: flex;
          background: #f0faf8;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── Left branding panel ── */
        .lb-left {
          display: none;
          flex: 0 0 52%;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
        }
        @media (min-width: 1024px) {
          .lb-left { display: flex; }
        }
        .lb-left-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 40%, #134e4a 100%);
        }
        .lb-left-glow1 {
          position: absolute;
          width: 480px; height: 480px;
          top: -100px; right: -80px;
          background: radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lb-left-glow2 {
          position: absolute;
          width: 360px; height: 360px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lb-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .lb-left-noise {
          position: absolute;
          inset: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ── Left: logo top ── */
        .lb-logo {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .lb-logo-icon {
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .lb-logo-text {
          font-size: 1.1rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* ── Left: center copy ── */
        .lb-copy {
          position: relative;
          z-index: 10;
        }
        .lb-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          margin-bottom: 1.5rem;
        }
        .lb-badge-dot {
          width: 7px; height: 7px;
          background: #6ee7b7;
          border-radius: 50%;
          animation: lb-pulse 2s ease-in-out infinite;
        }
        .lb-badge-text {
          font-size: 0.7rem;
          font-weight: 700;
          color: #a7f3d0;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        @keyframes lb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(110,231,183,0.6); }
          50% { box-shadow: 0 0 0 6px rgba(110,231,183,0); }
        }
        .lb-headline {
          font-size: clamp(2rem, 3vw, 2.8rem);
          font-weight: 900;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 1rem;
        }
        .lb-headline-accent {
          display: inline-block;
          background: linear-gradient(90deg, #6ee7b7, #34d399, #a7f3d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lb-desc {
          font-size: 0.92rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          max-width: 320px;
          margin-bottom: 2rem;
        }
        .lb-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .lb-pill {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          backdrop-filter: blur(4px);
          transition: background 0.2s;
        }
        .lb-pill:hover { background: rgba(255,255,255,0.14); }

        /* ── Left: stats bottom ── */
        .lb-stats {
          position: relative;
          z-index: 10;
          display: flex;
          gap: 2.5rem;
        }
        .lb-stat {
          display: flex;
          flex-direction: column;
        }
        .lb-stat-val {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
        }
        .lb-stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          margin-top: 3px;
          letter-spacing: 0.04em;
        }

        /* ── Floating particles ── */
        .lb-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          animation: lb-float 7s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes lb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.1); }
        }

        /* ── Right form panel ── */
        .lb-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1.25rem;
          position: relative;
          overflow: hidden;
          background: #f0faf8;
          min-height: 100dvh;
        }
        @media (min-width: 640px) {
          .lb-right { padding: 2.5rem 2rem; }
        }

        /* mobile decorative circles */
        .lb-right-circle1 {
          position: absolute;
          top: -120px; right: -100px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lb-right-circle2 {
          position: absolute;
          bottom: -100px; left: -80px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* ── Card ── */
        .lb-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
          animation: lb-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes lb-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Mobile logo ── */
        .lb-mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 1024px) { .lb-mobile-logo { display: none; } }
        .lb-mobile-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #0d9488, #059669);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(13,148,136,0.35);
        }
        .lb-mobile-logo-text {
          font-size: 0.95rem;
          font-weight: 900;
          color: #134e4a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── School name banner ── */
        .lb-school-banner {
          display: flex;
          flex-direction: column;
          margin-bottom: 1.75rem;
        }
        .lb-school-name {
          font-size: clamp(1.05rem, 3.5vw, 1.2rem);
          font-weight: 800;
          color: #134e4a;
          line-height: 1.25;
          margin: 0 0 0.2rem;
        }
        .lb-school-tagline {
          font-size: 0.78rem;
          color: #5eead4;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Divider line ── */
        .lb-divider {
          width: 36px;
          height: 3px;
          background: linear-gradient(90deg, #0d9488, #34d399);
          border-radius: 2px;
          margin-bottom: 1.75rem;
        }

        /* ── Heading ── */
        .lb-heading { margin-bottom: 1.75rem; }
        .lb-heading h2 {
          font-size: clamp(1.4rem, 4vw, 1.75rem);
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.3rem;
          line-height: 1.2;
        }
        .lb-heading p {
          font-size: 0.84rem;
          color: #64748b;
          margin: 0;
        }

        /* ── Error ── */
        .lb-error {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-left: 3px solid #f43f5e;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          margin-bottom: 1.25rem;
          font-size: 0.83rem;
          color: #be123c;
          animation: lb-rise 0.3s ease-out both;
        }

        /* ── Form ── */
        .lb-form { display: flex; flex-direction: column; gap: 1rem; }
        .lb-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .lb-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .lb-input-wrap { position: relative; }
        .lb-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: color 0.2s;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .lb-input-icon.active { color: #0d9488; }
        .lb-input {
          width: 100%;
          padding: 0.85rem 0.9rem 0.85rem 2.8rem;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .lb-input::placeholder { color: #cbd5e1; }
        .lb-input:hover { border-color: #99f6e4; }
        .lb-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.12);
          background: #f0fdfa;
        }
        .lb-eye-btn {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.2rem;
          color: #94a3b8;
          line-height: 0;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .lb-eye-btn:hover { color: #0d9488; }

        /* ── Submit ── */
        .lb-submit {
          width: 100%;
          padding: 0.9rem 1.5rem;
          margin-top: 0.25rem;
          background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(13,148,136,0.4);
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
          letter-spacing: 0.02em;
        }
        .lb-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(13,148,136,0.5);
        }
        .lb-submit:active:not(:disabled) { transform: scale(0.98); }
        .lb-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .lb-submit .arrow {
          transition: transform 0.2s;
        }
        .lb-submit:hover:not(:disabled) .arrow { transform: translateX(3px); }

        /* ── Spinner ── */
        @keyframes lb-spin { to { transform: rotate(360deg); } }
        .lb-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lb-spin 0.7s linear infinite;
        }

        /* ── Role cards ── */
        .lb-roles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
          margin-top: 1.5rem;
        }
        .lb-role-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.65rem 0.5rem;
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .lb-role-card:hover {
          border-color: #99f6e4;
          box-shadow: 0 2px 10px rgba(13,148,136,0.1);
        }
        .lb-role-icon { font-size: 1.2rem; margin-bottom: 0.2rem; line-height: 1; }
        .lb-role-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .lb-role-label.admin { color: #7c3aed; }
        .lb-role-label.guru  { color: #0d9488; }
        .lb-role-label.siswa { color: #0284c7; }

        /* ── Footer ── */
        .lb-footer {
          text-align: center;
          font-size: 0.68rem;
          color: #94a3b8;
          margin-top: 1.5rem;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .lb-footer span { color: #0d9488; font-weight: 700; }
      `}</style>

      <div className="lb-root">

        {/* ─── LEFT PANEL ─── */}
        <div className="lb-left">
          <div className="lb-left-bg" />
          <div className="lb-left-glow1" />
          <div className="lb-left-glow2" />
          <div className="lb-left-grid" />
          <div className="lb-left-noise" />

          {/* floating particles */}
          {particles.map((p, i) => (
            <Particle
              key={i}
              style={{
                width: p.width, height: p.height,
                top: p.top, left: p.left,
                opacity: p.opacity,
                animationDelay: p.animationDelay,
                animationDuration: p.animationDuration,
              }}
            />
          ))}

          {/* top logo */}
          <div className="lb-logo" style={{ position: "relative", zIndex: 10 }}>
            <div className="lb-logo-icon">
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="lb-logo-text">Simaboy</span>
          </div>

          {/* center copy */}
          <div className="lb-copy">
            <div className="lb-badge">
              <span className="lb-badge-dot" />
              <span className="lb-badge-text">Sistem Aktif</span>
            </div>
            <h1 className="lb-headline">
              Platform Manajemen<br />
              <span className="lb-headline-accent">Sekolah Modern</span>
            </h1>
            <p className="lb-desc">
              Kelola absensi, jurnal mengajar, ujian CBT, dan seluruh data akademik siswa dalam satu ekosistem yang terintegrasi dan aman.
            </p>
            <div className="lb-pills">
              {["📋 Absensi Digital", "🎯 Ujian CBT", "📊 Monitoring Real-Time", "🔒 Keamanan JWT"].map(f => (
                <span key={f} className="lb-pill">{f}</span>
              ))}
            </div>
          </div>

          {/* bottom stats */}
          <div className="lb-stats">
            <StatBadge value={100} suffix="+" label="Siswa Aktif" />
            <StatBadge value={3} label="Peran Pengguna" />
            <StatBadge value={99} suffix="%" label="Uptime Server" />
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="lb-right">
          <div className="lb-right-circle1" />
          <div className="lb-right-circle2" />

          <div className="lb-card">

            {/* mobile logo */}
            <div className="lb-mobile-logo">
              <div className="lb-mobile-logo-icon">
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="lb-mobile-logo-text">Simaboy</span>
            </div>

            {/* school name */}
            <div className="lb-school-banner">
              <h1 className="lb-school-name">SMA Negeri 1 Boyolangu</h1>
              <span className="lb-school-tagline">Sistem Informasi Akademik</span>
            </div>
            <div className="lb-divider" />

            {/* heading */}
            <div className="lb-heading">
              <h2>Masuk ke Sistem</h2>
              <p>Gunakan akun yang diberikan oleh administrator sekolah</p>
            </div>

            {/* error */}
            {error && (
              <div className="lb-error">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* form */}
            <form onSubmit={handleLogin} className="lb-form">

              {/* username */}
              <div className="lb-field">
                <label className="lb-label">Username / NIP / NIS</label>
                <div className="lb-input-wrap">
                  <span className={`lb-input-icon${focused === "user" ? " active" : ""}`}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocused("user")}
                    onBlur={() => setFocused(null)}
                    placeholder="Masukkan username Anda"
                    className="lb-input"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* password */}
              <div className="lb-field">
                <label className="lb-label">Password</label>
                <div className="lb-input-wrap">
                  <span className={`lb-input-icon${focused === "pass" ? " active" : ""}`}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••••"
                    className="lb-input"
                    style={{ paddingRight: "2.8rem" }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lb-eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}>
                    {showPass ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* submit */}
              <button type="submit" disabled={loading} className="lb-submit">
                {loading ? (
                  <>
                    <span className="lb-spinner" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk ke Sistem
                    <svg className="arrow" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* role hints */}
            <div className="lb-roles">
              {[
                { role: "Admin", icon: "🛡️", cls: "admin" },
                { role: "Guru", icon: "👨‍🏫", cls: "guru" },
                { role: "Siswa", icon: "🎒", cls: "siswa" },
              ].map(r => (
                <div key={r.role} className="lb-role-card">
                  <div className="lb-role-icon">{r.icon}</div>
                  <p className={`lb-role-label ${r.cls}`}>{r.role}</p>
                </div>
              ))}
            </div>

            <p className="lb-footer">
              Dilindungi oleh <span>Bcrypt & JWT</span> · Simaboy © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
