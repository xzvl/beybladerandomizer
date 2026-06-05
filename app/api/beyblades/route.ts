import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import { Beyblade } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(readData<Beyblade[]>('beyblades.json', []));
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = (formData.get('name') as string)?.trim();
  const serial = (formData.get('serial') as string)?.trim();
  const type = (formData.get('type') as string)?.trim();
  const systemLine = (formData.get('systemLine') as string)?.trim();
  const imageFile = formData.get('image') as File | null;

  if (!name || !serial || !type || !systemLine) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const id = randomUUID();
  let imagePath = '';

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const mime = imageFile.type || 'image/jpeg';
    imagePath = `data:${mime};base64,${buffer.toString('base64')}`;
  }

  const beyblade: Beyblade = {
    id,
    name,
    serial,
    type,
    systemLine: systemLine as 'BX' | 'UX' | 'CX',
    image: imagePath,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const beyblades = readData<Beyblade[]>('beyblades.json', []);
  beyblades.push(beyblade);
  writeData('beyblades.json', beyblades);
  return NextResponse.json(beyblade, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const beyblades = readData<Beyblade[]>('beyblades.json', []);
  const idx = beyblades.findIndex(b => b.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  beyblades[idx] = { ...beyblades[idx], status };
  writeData('beyblades.json', beyblades);
  return NextResponse.json(beyblades[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const beyblades = readData<Beyblade[]>('beyblades.json', []);
  const updated = beyblades.filter(b => b.id !== id);
  writeData('beyblades.json', updated);
  return NextResponse.json({ success: true });
}
