import { NextResponse } from 'next/server';
import { getMenu, saveMenu } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getMenu());
}

// admin: replace the whole menu
export async function PUT(req) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  saveMenu(await req.json());
  return NextResponse.json({ ok: true });
}
