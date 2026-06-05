import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, uploadImage } from '@/lib/data';
import { Beyblade } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  return NextResponse.json(await readData<Beyblade[]>('beyblades.json', []));
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
    const ext = imageFile.name.split('.').pop() || 'jpg';
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    imagePath = await uploadImage(id, ext, buffer);
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

  const beyblades = await readData<Beyblade[]>('beyblades.json', []);
  beyblades.push(beyblade);
  await writeData('beyblades.json', beyblades);
  return NextResponse.json(beyblade, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const beyblades = await readData<Beyblade[]>('beyblades.json', []);
  const idx = beyblades.findIndex(b => b.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  beyblades[idx] = { ...beyblades[idx], status };
  await writeData('beyblades.json', beyblades);
  return NextResponse.json(beyblades[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const beyblades = await readData<Beyblade[]>('beyblades.json', []);
  await writeData('beyblades.json', beyblades.filter(b => b.id !== id));
  return NextResponse.json({ success: true });
}
