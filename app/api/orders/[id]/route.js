import { NextResponse } from 'next/server';
import { getOrders, saveOrders } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// status: new -> prepared -> served
export async function PATCH(req, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { status } = await req.json();
  if (!['new', 'prepared', 'served'].includes(status))
    return NextResponse.json({ error: 'Bad status' }, { status: 400 });
  const orders = getOrders();
  const o = orders.find((x) => x.id === params.id);
  if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  o.status = status;
  if (status === 'prepared') o.preparedAt = Date.now();
  if (status === 'served') o.servedAt = Date.now();
  saveOrders(orders);
  return NextResponse.json(o);
}
