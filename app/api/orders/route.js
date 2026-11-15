import { NextResponse } from 'next/server';
import { getMenu, getOrders, saveOrders } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// admin/waiter: list orders (?scope=active | served)
export async function GET(req) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const scope = new URL(req.url).searchParams.get('scope') || 'active';
  const orders = getOrders().filter((o) => (scope === 'served' ? o.status === 'served' : o.status !== 'served'));
  orders.sort((a, b) => (scope === 'served' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
  return NextResponse.json(orders);
}

// customer: place order. Prices are recomputed server-side from the menu.
export async function POST(req) {
  const body = await req.json();
  const table = String(body.table || '').trim();
  if (!table || !Array.isArray(body.items) || !body.items.length)
    return NextResponse.json({ error: 'Table and items required' }, { status: 400 });

  const menu = getMenu();
  const items = [];
  for (const line of body.items) {
    const m = menu.items.find((i) => i.id === line.itemId);
    if (!m || !m.available)
      return NextResponse.json({ error: `${line.name || 'An item'} is no longer available` }, { status: 400 });
    const qty = Math.max(1, Math.min(20, parseInt(line.qty) || 1));
    let unit;
    let size = null;
    if (m.type === 'beverage') {
      size = ['S', 'M', 'L'].includes(line.size) ? line.size : 'M';
      unit = m.prices[size];
      if (m.milk) unit += menu.options.milk.find((x) => x.name === line.milk)?.price || 0;
      if (m.shot && line.extraShot) unit += menu.options.extraShotPrice;
    } else unit = m.price;
    items.push({
      itemId: m.id, name: m.name, type: m.type, size, qty, unitPrice: unit,
      sugar: m.sugar ? line.sugar || 'Regular' : null,
      milk: m.milk ? line.milk || 'Regular milk' : null,
      extraShot: !!(m.shot && line.extraShot),
      note: String(line.note || '').slice(0, 200),
    });
  }

  const orders = getOrders();
  const number = orders.reduce((mx, o) => Math.max(mx, o.number), 0) + 1;
  const order = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    number, table, items,
    total: items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    status: 'new', createdAt: Date.now(),
  };
  orders.push(order);
  saveOrders(orders);
  return NextResponse.json({ number: order.number, table, total: order.total });
}
