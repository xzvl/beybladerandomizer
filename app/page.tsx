'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Player, Beyblade, Match } from '@/types';

export default function Home() {
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [beyblades, setBeyblades] = useState<Beyblade[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration state
  const [playerName, setPlayerName] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Viewer state
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [m, p, b] = await Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
      fetch('/api/beyblades').then(r => r.json()),
    ]);
    setMatch(m);
    setPlayers(p);
    setBeyblades(b);
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRegError(data.error || 'Registration failed');
    } else {
      setRegSuccess(`${data.name} registered!`);
      setPlayerName('');
      setPlayers(prev => [...prev, data]);
    }
    setRegLoading(false);
  }

  const selectedAssignment = match?.assignments.find(a => a.playerId === selectedPlayerId);
  const selectedBeyblades = selectedAssignment?.beybladeIds.map(id => beyblades.find(b => b.id === id)).filter(Boolean) as Beyblade[] | undefined;

  const isMatchActive = match !== null && match?.assignments?.length > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#131313] cyber-grid flex items-center justify-center">
        <p className="font-mono text-[12px] tracking-widest text-primary animate-blink uppercase">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#131313] cyber-grid flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute left-1/4 bottom-1/4 w-[300px] h-[300px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />

      {/* Admin link */}
      <Link
        href="/admin"
        className="absolute top-6 right-6 font-mono text-[10px] tracking-[0.2em] uppercase text-[#e2e2e2]/30 hover:text-primary transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
        Admin
      </Link>

      {/* Top label */}
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-8 animate-fade-up" style={{ animationDelay: '0ms' }}>
        XZVL_BEYBLADE // {isMatchActive ? 'MATCH READY' : 'INITIALIZING'}
      </p>

      {/* Title */}
      <h1
        className="font-inter font-black text-center uppercase leading-none tracking-tight animate-fade-up"
        style={{ fontSize: 'clamp(2rem, 7vw, 6rem)', animationDelay: '120ms' }}
      >
        <span className="text-[#e2e2e2]">beyblade</span>
        <span className="text-primary">.</span>
        <br />
        <span className="text-[#e2e2e2]/50 italic text-[0.5em]">randomizer</span>
      </h1>

      {/* Divider */}
      <div className="flex items-center gap-4 my-10 w-full max-w-md animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="flex-1 h-px bg-[#603e39]/60" />
        <span className="material-symbols-outlined text-primary text-[16px]">sports_martial_arts</span>
        <div className="flex-1 h-px bg-[#603e39]/60" />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: '320ms' }}>
        {!isMatchActive ? (
          /* Registration Form */
          <div>
            <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#ebbbb4]/60 text-center mb-6">
              Register to join the match
            </p>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="PLAYER NAME"
                className="w-full bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[13px] tracking-widest px-4 py-3 uppercase placeholder-[#e2e2e2]/20 focus:outline-none focus:border-primary transition-colors"
                maxLength={32}
              />
              {regError && (
                <p className="font-mono text-[11px] text-red-400 tracking-wider">{regError}</p>
              )}
              {regSuccess && (
                <p className="font-mono text-[11px] text-green-400 tracking-wider">{regSuccess}</p>
              )}
              <button
                type="submit"
                disabled={regLoading || !playerName.trim()}
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white font-mono text-[12px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                {regLoading ? 'Registering...' : 'Register'}
              </button>
            </form>
            {players.length > 0 && (
              <p className="font-mono text-[10px] tracking-widest text-[#e2e2e2]/20 uppercase text-center mt-4">
                {players.length} player{players.length !== 1 ? 's' : ''} registered
              </p>
            )}
          </div>
        ) : (
          /* Match Viewer */
          <div>
            <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#ebbbb4]/60 text-center mb-6">
              Select your player to view assignment
            </p>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[13px] tracking-widest px-4 py-3 uppercase focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">-- SELECT PLAYER --</option>
              {match.assignments.map(a => (
                <option key={a.playerId} value={a.playerId}>
                  {a.playerName}
                </option>
              ))}
            </select>

            {selectedBeyblades && selectedBeyblades.length > 0 && (
              <div className="mt-8">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4 text-center">
                  {match.assignments.find(a => a.playerId === selectedPlayerId)?.playerName} — Match Assignment
                </p>
                <div className={`grid gap-3 grid-cols-1 ${selectedBeyblades.length >= 2 ? 'sm:grid-cols-2' : ''} ${selectedBeyblades.length >= 3 ? 'sm:grid-cols-3' : ''}`}>
                  {selectedBeyblades.map((bey, i) => (
                    <div key={bey.id} className="glass-panel p-4 flex flex-col items-center gap-2">
                      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#e2e2e2]/30">
                        Beyblade {i + 1}
                      </p>
                      {bey.image ? (
                        <div className="w-16 h-16">
                          <img src={bey.image} alt={bey.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center border border-[#603e39]/40">
                          <span className="material-symbols-outlined text-primary text-[28px]">sports_martial_arts</span>
                        </div>
                      )}
                      <p className="font-inter font-black text-[#e2e2e2] text-[13px] uppercase text-center leading-tight">{bey.name}</p>
                      <p className="font-mono text-[9px] text-[#ebbbb4]/60 tracking-wider">{bey.serial}</p>
                      <div className="flex gap-1 flex-wrap justify-center">
                        <span className="font-mono text-[8px] tracking-wider text-[#e2e2e2]/50 border border-[#603e39]/40 px-2 py-0.5 uppercase">{bey.type}</span>
                        <span className="font-mono text-[8px] tracking-wider text-primary border border-primary/40 px-2 py-0.5 uppercase">{bey.systemLine}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 animate-fade-up" style={{ animationDelay: '560ms' }}>
        <span className="font-mono text-[10px] tracking-widest text-[#e2e2e2]/20 uppercase">© 2026 xzvl</span>
        <span className="text-primary text-[10px]">·</span>
        <span className="font-mono text-[10px] tracking-widest text-[#e2e2e2]/20 uppercase">Beyblade Randomizer</span>
      </div>
    </main>
  );
}
