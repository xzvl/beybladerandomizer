import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === 'admin' && password === 'admin') {
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_auth', 'authenticated', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return res;
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_auth');
  return res;
}
