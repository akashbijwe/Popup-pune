import { NextResponse } from 'next/server';
import { ADMIN_USER, ADMIN_PASS } from '@/lib/config';
import { COOKIE, makeToken, isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: isAuthed() }, { status: isAuthed() ? 200 : 401 });
}

export async function POST(req) {
  const { username, password } = await req.json();
  if (username !== ADMIN_USER || password !== ADMIN_PASS)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
