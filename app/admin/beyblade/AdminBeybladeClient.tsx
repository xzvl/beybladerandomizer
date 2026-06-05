'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Player, Beyblade, Match, PlayerAssignment } from '@/types';

const BEYBLADE_TYPES = ['Attack', 'Defense', 'Stamina', 'Balance'];
const SYSTEM_LINES = ['BX', 'UX', 'CX'] as const;

export default function AdminBeybladeClient() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [beyblades, setBeyblades] = useState<Beyblade[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Add beyblade form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formType, setFormType] = useState(BEYBLADE_TYPES[0]);
  const [formSystemLine, setFormSystemLine] = useState<'BX' | 'UX' | 'CX'>('BX');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Player edit state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState('');

  // Randomizer
  const [numBeyblades, setNumBeyblades] = useState(1);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [shuffleValues, setShuffleValues] = useState<Record<string, string[]>>({});
  const pendingMatch = useRef<Match | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAll();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [p, b, m] = await Promise.all([
      fetch('/api/players').then(r => r.json()),
      fetch('/api/beyblades').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]);
    setPlayers(p);
    setBeyblades(b);
    setMatch(m);
    setLoading(false);
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin');
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFormImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  }

  function resetForm() {
    setFormName(''); setFormSerial(''); setFormType(BEYBLADE_TYPES[0]);
    setFormSystemLine('BX'); setFormImage(null); setImagePreview('');
    setFormError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleAddBeyblade(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formSerial) { setFormError('Name and serial are required'); return; }
    setFormLoading(true);
    setFormError('');
    const fd = new FormData();
    fd.append('name', formName);
    fd.append('serial', formSerial);
    fd.append('type', formType);
    fd.append('systemLine', formSystemLine);
    if (formImage) fd.append('image', formImage);
    const res = await fetch('/api/beyblades', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || 'Failed to add'); }
    else {
      setBeyblades(prev => [...prev, data]);
      resetForm();
      setShowForm(false);
    }
    setFormLoading(false);
  }

  function startEditPlayer(player: Player) {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
    setEditError('');
  }

  function cancelEditPlayer() {
    setEditingPlayerId(null);
    setEditingName('');
    setEditError('');
  }

  async function handleEditPlayer(id: string) {
    if (!editingName.trim()) { setEditError('Name is required'); return; }
    const res = await fetch('/api/players', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editingName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setEditError(data.error || 'Failed to update'); return; }
    setPlayers(prev => prev.map(p => p.id === id ? data : p));
    cancelEditPlayer();
  }

  async function handleDeletePlayer(id: string) {
    await fetch('/api/players', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggleStatus(id: string, current: 'active' | 'inactive') {
    const next = current === 'active' ? 'inactive' : 'active';
    const res = await fetch('/api/beyblades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    const data = await res.json();
    if (res.ok) setBeyblades(prev => prev.map(b => b.id === id ? data : b));
  }

  async function handleDeleteBeyblade(id: string) {
    await fetch('/api/beyblades', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setBeyblades(prev => prev.filter(b => b.id !== id));
  }

  function startRandomizer() {
    const activeBeyblades = beyblades.filter(b => (b.status ?? 'active') === 'active');
    const needed = players.length * numBeyblades;
    if (players.length === 0) { alert('No players registered yet.'); return; }
    if (activeBeyblades.length < needed) {
      alert(`Need at least ${needed} active beyblades for ${players.length} players × ${numBeyblades}. Only ${activeBeyblades.length} active.`);
      return;
    }

    // Shuffle and assign from active only
    const shuffled = [...activeBeyblades].sort(() => Math.random() - 0.5);
    const assignments: PlayerAssignment[] = players.map((player, i) => ({
      playerId: player.id,
      playerName: player.name,
      beybladeIds: shuffled.slice(i * numBeyblades, (i + 1) * numBeyblades).map(b => b.id),
    }));

    const newMatch: Match = { assignments, numBeyblades, createdAt: new Date().toISOString() };
    pendingMatch.current = newMatch;

    setIsRandomizing(true);

    intervalRef.current = setInterval(() => {
      const values: Record<string, string[]> = {};
      players.forEach(p => {
        values[p.id] = Array.from({ length: numBeyblades }, () =>
          activeBeyblades[Math.floor(Math.random() * activeBeyblades.length)]?.name || '???'
        );
      });
      setShuffleValues(values);
    }, 120);

    setTimeout(async () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRandomizing(false);
      setShuffleValues({});
      const m = pendingMatch.current!;
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      });
      setMatch(m);
    }, 5000);
  }

  async function handleReset() {
    if (isRandomizing) { if (intervalRef.current) clearInterval(intervalRef.current); setIsRandomizing(false); setShuffleValues({}); }
    await fetch('/api/matches', { method: 'DELETE' });
    setMatch(null);
  }

  function getBeybladeDisplay(playerId: string, slotIdx: number): { name: string; isSlot: boolean; image?: string } {
    if (isRandomizing) {
      return { name: shuffleValues[playerId]?.[slotIdx] || '???', isSlot: true };
    }
    const assignment = match?.assignments.find(a => a.playerId === playerId);
    if (assignment) {
      const bId = assignment.beybladeIds[slotIdx];
      const bey = beyblades.find(b => b.id === bId);
      return { name: bey?.name || '???', isSlot: false, image: bey?.image };
    }
    return { name: 'TBA', isSlot: false };
  }

  const activeBeyblades = beyblades.filter(b => (b.status ?? 'active') === 'active');
  const totalNeeded = players.length * numBeyblades;
  const enoughBeyblades = activeBeyblades.length >= totalNeeded;

  return (
    <main className="min-h-screen bg-[#131313] cyber-grid">
      {/* Header */}
      <header className="border-b border-[#603e39]/40 bg-[#131313]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#e2e2e2]/30 hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Home
            </Link>
            <span className="text-[#603e39]/60">|</span>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary">
              XZVL_BEYBLADE // ADMIN
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#e2e2e2]/30 hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-mono text-[11px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancel' : 'Add Beyblade'}
          </button>

          <div className="flex items-center gap-2 bg-[#1f1f1f] border border-[#603e39]/60 px-3 py-3">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#e2e2e2]/50">Beys/Player</span>
            <input
              type="number"
              min={1}
              max={3}
              value={numBeyblades}
              onChange={e => setNumBeyblades(Math.max(1, Math.min(3, Number(e.target.value))))}
              className="w-10 bg-transparent text-[#e2e2e2] font-mono text-[13px] text-center focus:outline-none"
            />
          </div>

          <button
            onClick={startRandomizer}
            disabled={isRandomizing || players.length === 0 || !enoughBeyblades}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#1f1f1f] border border-primary/60 text-primary font-mono text-[11px] tracking-[0.15em] uppercase hover:bg-primary hover:text-white active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">{isRandomizing ? 'hourglass_top' : 'shuffle'}</span>
            {isRandomizing ? 'Randomizing...' : 'Start Randomizer'}
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2]/60 font-mono text-[11px] tracking-[0.15em] uppercase hover:border-red-500/60 hover:text-red-400 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-wider text-[#e2e2e2]/30 uppercase">
              {players.length} players · {activeBeyblades.length}/{beyblades.length} active
              {!enoughBeyblades && players.length > 0 && (
                <span className="text-yellow-500/80 ml-2">({totalNeeded - activeBeyblades.length} more needed)</span>
              )}
            </span>
            {match && !isRandomizing && (
              <span className="font-mono text-[9px] tracking-wider text-green-400/70 uppercase border border-green-400/30 px-2 py-0.5">Match Active</span>
            )}
          </div>
        </div>

        {/* Add Beyblade Form */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 animate-fade-in">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-4">Add New Beyblade</p>
            <form onSubmit={handleAddBeyblade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="BEYBLADE NAME"
                  className="bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[12px] px-3 py-2.5 placeholder-[#e2e2e2]/20 focus:outline-none focus:border-primary transition-colors uppercase"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40">Serial</label>
                <input
                  type="text"
                  value={formSerial}
                  onChange={e => setFormSerial(e.target.value)}
                  placeholder="SERIAL CODE"
                  className="bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[12px] px-3 py-2.5 placeholder-[#e2e2e2]/20 focus:outline-none focus:border-primary transition-colors uppercase"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40">Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2] font-mono text-[12px] px-3 py-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {BEYBLADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40">System Line</label>
                <div className="flex gap-2">
                  {SYSTEM_LINES.map(sl => (
                    <button
                      key={sl}
                      type="button"
                      onClick={() => setFormSystemLine(sl)}
                      className={`flex-1 py-2.5 font-mono text-[12px] tracking-widest uppercase transition-all ${formSystemLine === sl ? 'bg-primary text-white' : 'bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2]/60 hover:border-primary/60 hover:text-primary'}`}
                    >
                      {sl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                <label className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40">Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 bg-[#1f1f1f] border border-[#603e39]/60 text-[#e2e2e2]/60 font-mono text-[10px] tracking-widest uppercase px-3 py-2.5 hover:border-primary/60 hover:text-primary transition-colors text-left truncate"
                  >
                    {formImage ? formImage.name : 'Choose Image...'}
                  </button>
                  {imagePreview && (
                    <div className="w-10 h-10 flex-shrink-0 border border-[#603e39]/40">
                      <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                {formError && <p className="font-mono text-[11px] text-red-400 tracking-wider flex-1">{formError}</p>}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-mono text-[11px] tracking-[0.15em] uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {formLoading ? 'Saving...' : 'Save Beyblade'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Two-column layout: Players + Beyblades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#e2e2e2]/60">Player List</p>
              {isRandomizing && (
                <span className="font-mono text-[9px] tracking-wider text-primary animate-blink uppercase">Randomizing in 5s...</span>
              )}
            </div>

            {loading ? (
              <p className="font-mono text-[11px] text-[#e2e2e2]/30 uppercase tracking-widest">Loading...</p>
            ) : players.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <span className="material-symbols-outlined text-[#e2e2e2]/20 text-[40px] mb-2 block">group</span>
                <p className="font-mono text-[11px] tracking-widest text-[#e2e2e2]/30 uppercase">No players registered yet</p>
                <Link href="/" className="font-mono text-[10px] text-primary/60 hover:text-primary transition-colors mt-2 inline-block">Go to homepage to register players →</Link>
              </div>
            ) : (
              <div className="glass-panel overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[#603e39]/40">
                      <th className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40 px-4 py-3 text-left w-8">#</th>
                      <th className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40 px-4 py-3 text-left">Player</th>
                      {Array.from({ length: numBeyblades }, (_, i) => (
                        <th key={i} className="font-mono text-[9px] tracking-widest uppercase text-[#e2e2e2]/40 px-4 py-3 text-left">
                          Beyblade {i + 1}{i === 2 ? ' (opt)' : ''}
                        </th>
                      ))}
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, idx) => {
                      const isEditing = editingPlayerId === player.id;
                      return (
                        <tr key={player.id} className="border-b border-[#603e39]/20 last:border-0 hover:bg-white/[0.02] transition-colors group">
                          <td className="font-mono text-[10px] text-[#e2e2e2]/30 px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  autoFocus
                                  value={editingName}
                                  onChange={e => { setEditingName(e.target.value); setEditError(''); }}
                                  onKeyDown={e => { if (e.key === 'Enter') handleEditPlayer(player.id); if (e.key === 'Escape') cancelEditPlayer(); }}
                                  className="bg-[#131313] border border-primary/60 text-[#e2e2e2] font-inter font-bold text-[13px] px-2 py-1 uppercase focus:outline-none w-full"
                                />
                                {editError && <p className="font-mono text-[9px] text-red-400">{editError}</p>}
                              </div>
                            ) : (
                              <span className="font-inter font-bold text-[13px] text-[#e2e2e2] uppercase">{player.name}</span>
                            )}
                          </td>
                          {Array.from({ length: numBeyblades }, (_, i) => {
                            const { name, isSlot, image } = getBeybladeDisplay(player.id, i);
                            const isTBA = name === 'TBA';
                            return (
                              <td key={i} className="px-4 py-2">
                                {isSlot ? (
                                  <span className="font-mono text-[11px] tracking-wider uppercase text-primary animate-slot inline-block">
                                    {name}
                                  </span>
                                ) : isTBA ? (
                                  <span className="font-mono text-[11px] tracking-wider uppercase text-[#e2e2e2]/20">TBA</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {image ? (
                                      <div className="w-8 h-8 flex-shrink-0 border border-[#603e39]/30">
                                        <img src={image} alt={name} className="w-full h-full object-contain" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[#603e39]/20">
                                        <span className="material-symbols-outlined text-[#e2e2e2]/15 text-[14px]">sports_martial_arts</span>
                                      </div>
                                    )}
                                    <span className="font-mono text-[11px] tracking-wider uppercase text-[#e2e2e2]">{name}</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditPlayer(player.id)}
                                  title="Save"
                                  className="text-green-400/70 hover:text-green-400 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </button>
                                <button
                                  onClick={cancelEditPlayer}
                                  title="Cancel"
                                  className="text-[#e2e2e2]/30 hover:text-[#e2e2e2] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditPlayer(player)}
                                  title="Edit"
                                  className="text-[#e2e2e2]/30 hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePlayer(player.id)}
                                  title="Remove"
                                  className="text-[#e2e2e2]/30 hover:text-red-400 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
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

          {/* Beyblades List */}
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#e2e2e2]/60 mb-4">
              Beyblades ({activeBeyblades.length} active / {beyblades.length} total)
            </p>
            {beyblades.length === 0 ? (
              <div className="glass-panel p-6 text-center">
                <span className="material-symbols-outlined text-[#e2e2e2]/20 text-[36px] mb-2 block">sports_martial_arts</span>
                <p className="font-mono text-[10px] tracking-widest text-[#e2e2e2]/30 uppercase">No beyblades added</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {beyblades.map(bey => {
                  const isActive = (bey.status ?? 'active') === 'active';
                  return (
                    <div
                      key={bey.id}
                      className={`glass-panel px-4 py-3 flex items-center gap-3 group transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    >
                      {bey.image ? (
                        <div className={`w-8 h-8 flex-shrink-0 ${!isActive ? 'grayscale' : ''}`}>
                          <img src={bey.image} alt={bey.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-[#603e39]/30">
                          <span className="material-symbols-outlined text-[#e2e2e2]/20 text-[16px]">sports_martial_arts</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-inter font-bold text-[12px] text-[#e2e2e2] uppercase truncate">{bey.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="font-mono text-[9px] text-[#e2e2e2]/40 tracking-wider">{bey.serial} · {bey.type} · <span className="text-primary">{bey.systemLine}</span></p>
                          <span className={`font-mono text-[8px] tracking-wider uppercase border px-1.5 py-px ${isActive ? 'border-green-500/40 text-green-400/70' : 'border-[#603e39]/40 text-[#e2e2e2]/30'}`}>
                            {isActive ? 'active' : 'inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleStatus(bey.id, bey.status ?? 'active')}
                          title={isActive ? 'Set Inactive' : 'Set Active'}
                          className={`transition-colors ${isActive ? 'text-green-400/60 hover:text-yellow-400' : 'text-[#e2e2e2]/20 hover:text-green-400'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{isActive ? 'toggle_on' : 'toggle_off'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBeyblade(bey.id)}
                          title="Delete"
                          className="text-[#e2e2e2]/20 hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
