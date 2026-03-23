import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { API_URL } from "../api/client";
import { Button } from "../components/atoms/Button";
import { Input } from "../components/atoms/Input";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        setError(data.error || "Akses Ditolak. Kredensial tidak valid.");
      }
    } catch (err) {
      setError("Server tidak merespons. Periksa koneksi koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 md:p-6 overflow-hidden relative">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-fuchsia-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-float-delay"></div>

      {/* Main Login Card */}
      <div className="glass-dark p-8 md:p-12 rounded-[2.5rem] w-full max-w-md animate-fade-in-up relative z-10">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] transform rotate-3 hover:rotate-0 transition-transform duration-300">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">SIMABOY</h2>
          <p className="text-indigo-300/80 mt-2 text-xs uppercase tracking-[0.2em] font-bold">Smart Management System</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-8 text-xs text-center backdrop-blur-md animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Identity Access"
            type="text"
            placeholder="Username / NIP / NIS"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="text-white"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
            leftIcon={<svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
          />
          
          <Input 
            label="Secure Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="text-white"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
            leftIcon={<svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
          />
          
          <Button 
            type="submit" 
            isLoading={loading}
            fullWidth
            size="lg"
            className="mt-4 bg-white hover:bg-slate-100 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Authenticate
          </Button>
        </form>
        
        <div className="mt-8 text-center">
           <p className="text-[10px] text-slate-500 font-medium tracking-wide">Secured by Bcrypt & JWT</p>
        </div>
      </div>
    </div>
  );
}
