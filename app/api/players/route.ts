import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import { Player } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(await readData<Player[]>('players.json', []));
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const players = await readData<Player[]>('players.json', []);
  if (players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return NextResponse.json({ error: 'Player already registered' }, { status: 400 });
  }
  const player: Player = { id: randomUUID(), name: name.trim(), registeredAt: new Date().toISOString() };
  players.push(player);
  await writeData('players.json', players);
  return NextResponse.json(player, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, name } = await req.json();
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
  }
  const players = await readData<Player[]>('players.json', []);
  const idx = players.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  const duplicate = players.some(p => p.id !== id && p.name.toLowerCase() === name.trim().toLowerCase());
  if (duplicate) return NextResponse.json({ error: 'Name already taken' }, { status: 400 });
  players[idx] = { ...players[idx], name: name.trim() };
  await writeData('players.json', players);
  return NextResponse.json(players[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const players = await readData<Player[]>('players.json', []);
  await writeData('players.json', players.filter(p => p.id !== id));
  return NextResponse.json({ success: true });
}
