import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';
import { Match } from '@/types';

export async function GET() {
  return NextResponse.json(readData<Match | null>('matches.json', null));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  writeData('matches.json', body);
  return NextResponse.json(body, { status: 201 });
}

export async function DELETE() {
  writeData('matches.json', null);
  return NextResponse.json({ success: true });
}
