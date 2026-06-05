'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push('/admin/beyblade');
    } else {
      const data = await res.json();
      setError(data.error || 'Invalid credentials');
    }
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen bg-[#131313] cyber-grid flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />

      <Link
        href="/"
        className="absolute top-6 left-6 font-mono text-[10px] tracking-[0.2em] uppercase text-[#e2e2e2]/30 hover:text-primary transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        Home
      </Link>

      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-8 animate-fade-up" style={{ animationDelay: '0ms' }}>
        XZVL_BEYBLADE // ADMIN ACCESS
      </p>

      <h1
        className="font-inter font-black text-center uppercase leading-none tracking-tight text-[#e2e2e2] animate-fade-up mb-2"
        style={{ fontSize: 'clamp(1.8rem, 5vw, 4rem)', animationDelay: '120ms' }}
      >
        Admin<span className="text-primary">.</span>Login
      </h1>

      <div className="flex items-center gap-4 my-8 w-full max-w-sm animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex-1 h-px bg-[#603e39]/60" />
        <span className="material-symbols-outlined text-primary text-[16px]">lock</span>
        <div className="flex-1 h-px bg-[#603e39]/60" />
      </div>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm flex flex-col gap-3 animate-fade-up"
        style={{ animationDelay: '280ms' }}
      >
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="USERNAME"
          autoComplete="username"
          className="w-full bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[13px] tracking-widest px-4 py-3 uppercase placeholder-[#e2e2e2]/20 focus:outline-none focus:border-primary transition-colors"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="PASSWORD"
          autoComplete="current-password"
          className="w-full bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[13px] tracking-widest px-4 py-3 uppercase placeholder-[#e2e2e2]/20 focus:outline-none focus:border-primary transition-colors"
        />
        {error && (
          <p className="font-mono text-[11px] text-red-400 tracking-wider">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white font-mono text-[12px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
    </main>
  );
}
