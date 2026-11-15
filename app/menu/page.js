'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CAFE_NAME, CURRENCY } from '@/lib/brand';

const SIZES = { S: 'Small', M: 'Medium', L: 'Large' };

function unitPrice(item, sel, opts) {
  if (item.type === 'food') return item.price;
  let p = item.prices[sel.size];
  if (item.milk) p += opts.milk.find((m) => m.name === sel.milk)?.price || 0;
  if (item.shot && sel.extraShot) p += opts.extraShotPrice;
  return p;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        active ? 'bg-espresso text-foam border-espresso' : 'bg-foam text-roast border-latte/50 hover:border-roast'
      }`}
    >
      {children}
    </button>
  );
}

function Customizer({ item, opts, onClose, onAdd }) {
  const [sel, setSel] = useState({
    size: 'M', sugar: 'Regular', milk: 'Regular milk', extraShot: false, qty: 1, note: '',
  });
  const set = (k, v) => setSel((s) => ({ ...s, [k]: v }));
  const total = unitPrice(item, sel, opts) * sel.qty;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 fade-in" onClick={onClose}>
      <div
        className="slide-up w-full max-w-lg max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl p-6 pb-28 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-5 top-5 w-9 h-9 rounded-full bg-foam text-roast">✕</button>
        <div className="text-6xl">{item.emoji}</div>
        <h2 className="font-display text-3xl mt-2">{item.name}</h2>
        <p className="text-roast/80 mt-1">{item.desc}</p>

        {item.type === 'beverage' && (
          <>
            <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SIZES).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => set('size', k)}
                  className={`rounded-2xl py-3 border text-center transition ${
                    sel.size === k ? 'bg-espresso text-foam border-espresso' : 'bg-foam border-latte/50'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs opacity-70">{CURRENCY}{item.prices[k]}</div>
                </button>
              ))}
            </div>

            {item.sugar && (
              <>
                <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">Sugar</h3>
                <div className="flex flex-wrap gap-2">
                  {opts.sugar.map((s) => (
                    <Chip key={s} active={sel.sugar === s} onClick={() => set('sugar', s)}>{s}</Chip>
                  ))}
                </div>
              </>
            )}
            {item.milk && (
              <>
                <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">Milk</h3>
                <div className="flex flex-wrap gap-2">
                  {opts.milk.map((m) => (
                    <Chip key={m.name} active={sel.milk === m.name} onClick={() => set('milk', m.name)}>
                      {m.name}{m.price ? ` +${CURRENCY}${m.price}` : ''}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {item.shot && (
              <>
                <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">Add-ons</h3>
                <Chip active={sel.extraShot} onClick={() => set('extraShot', !sel.extraShot)}>
                  Extra espresso shot +{CURRENCY}{opts.extraShotPrice}
                </Chip>
              </>
            )}
          </>
        )}

        <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">Special request</h3>
        <input
          value={sel.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="e.g. less ice, extra spicy…"
          className="w-full rounded-2xl bg-foam border border-latte/50 px-4 py-3 outline-none focus:border-roast"
        />

        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-lg bg-cream/95 backdrop-blur p-4 flex items-center gap-3 pointer-events-auto border-t border-latte/40">
            <div className="flex items-center bg-foam rounded-full border border-latte/50">
              <button className="w-10 h-10 text-xl" onClick={() => set('qty', Math.max(1, sel.qty - 1))}>−</button>
              <span className="w-8 text-center font-semibold">{sel.qty}</span>
              <button className="w-10 h-10 text-xl" onClick={() => set('qty', Math.min(20, sel.qty + 1))}>+</button>
            </div>
            <button
              onClick={() => onAdd({ ...sel, itemId: item.id, unit: unitPrice(item, sel, opts) })}
              className="flex-1 rounded-full bg-espresso text-foam py-3 font-semibold shadow-lg"
            >
              Add to order · {CURRENCY}{total}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function describe(item, l) {
  const parts = [];
  if (l.size) parts.push(SIZES[l.size]);
  if (item.sugar) parts.push(l.sugar);
  if (item.milk) parts.push(l.milk);
  if (l.extraShot) parts.push('Extra shot');
  if (l.note) parts.push(`“${l.note}”`);
  return parts.join(' · ');
}

function MenuInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState(null);
  const [cat, setCat] = useState(null);
  const [custom, setCustom] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = params.get('table');
    if (t) { sessionStorage.setItem('twc_table', t); setTable(t); }
    else setTable(sessionStorage.getItem('twc_table') || '');
    fetch('/api/menu').then((r) => r.json()).then((m) => { setMenu(m); setCat(m.categories[0]); });
  }, [params]);

  const itemOf = (id) => menu.items.find((i) => i.id === id);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.unit * l.qty, 0);

  const grouped = useMemo(() => {
    if (!menu) return [];
    return menu.categories
      .map((c) => ({ c, items: menu.items.filter((i) => i.category === c && i.available) }))
      .filter((g) => g.items.length);
  }, [menu]);

  function scrollTo(c) {
    setCat(c);
    document.getElementById('cat-' + c)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function place() {
    setPlacing(true); setErr('');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, items: cart }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Something went wrong'); setPlacing(false); return; }
    setCart([]);
    router.push(`/order-placed?n=${String(data.number).padStart(3, '0')}&table=${table}&total=${data.total}`);
  }

  if (table === '')
    return (
      <main className="grain min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">📱</div>
        <h1 className="font-display text-3xl">Scan your table's QR</h1>
        <p className="mt-3 text-roast/80 max-w-xs">We couldn't find your table number. Please scan the QR code on your table to order.</p>
      </main>
    );
  if (!menu || table === null)
    return <main className="min-h-screen flex items-center justify-center text-roast">Brewing the menu…</main>;

  return (
    <main className="pb-32">
      <header className="grain relative bg-espresso text-foam px-6 pt-10 pb-8 rounded-b-[2.5rem] overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-caramel/30 blur-2xl" />
        <div className="relative max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-foam/10 border border-foam/20 rounded-full px-3 py-1 text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" /> Table {table}
          </div>
          <h1 className="font-display text-4xl mt-4">{CAFE_NAME}</h1>
          <p className="font-display italic text-latte mt-1">Scan. Sip. Savour.</p>
        </div>
      </header>

      <nav className="sticky top-0 z-30 bg-cream/90 backdrop-blur border-b border-latte/30">
        <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {grouped.map((g) => (
            <Chip key={g.c} active={cat === g.c} onClick={() => scrollTo(g.c)}>{g.c}</Chip>
          ))}
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4">
        {grouped.map((g) => (
          <section key={g.c} id={'cat-' + g.c} className="pt-8 scroll-mt-16">
            <h2 className="font-display text-2xl mb-4">{g.c}</h2>
            <div className="space-y-3">
              {g.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setCustom(it)}
                  className="w-full text-left flex items-center gap-4 bg-foam rounded-3xl p-4 border border-latte/30 shadow-sm active:scale-[.99] transition"
                >
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-latte/40 to-caramel/20 flex items-center justify-center text-3xl">
                    {it.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {it.type === 'food' && (
                        <span className={`w-3 h-3 border ${it.veg ? 'border-green-700' : 'border-red-700'} flex items-center justify-center`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${it.veg ? 'bg-green-700' : 'bg-red-700'}`} />
                        </span>
                      )}
                      <h3 className="font-semibold truncate">{it.name}</h3>
                    </div>
                    <p className="text-sm text-roast/70 line-clamp-2">{it.desc}</p>
                    <p className="mt-1 text-sm font-semibold text-caramel">
                      {it.type === 'beverage' ? `from ${CURRENCY}${it.prices.S}` : `${CURRENCY}${it.price}`}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-espresso text-foam flex items-center justify-center text-xl">+</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {count > 0 && !showCart && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-40 flex justify-center">
          <button
            onClick={() => setShowCart(true)}
            className="w-full max-w-lg bg-espresso text-foam rounded-full px-6 py-4 flex items-center justify-between shadow-2xl"
          >
            <span className="font-semibold">🛒 {count} item{count > 1 ? 's' : ''}</span>
            <span className="font-semibold">View order · {CURRENCY}{total}</span>
          </button>
        </div>
      )}

      {custom && (
        <Customizer
          item={custom}
          opts={menu.options}
          onClose={() => setCustom(null)}
          onAdd={(l) => { setCart((c) => [...c, l]); setCustom(null); }}
        />
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 fade-in" onClick={() => setShowCart(false)}>
          <div className="slide-up w-full max-w-lg max-h-[90vh] overflow-y-auto bg-cream rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-display text-3xl">Your order</h2>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-foam text-roast">✕</button>
            </div>
            <p className="text-sm text-roast/70">Table {table}</p>
            <div className="mt-4 divide-y divide-latte/30">
              {cart.map((l, idx) => {
                const it = itemOf(l.itemId);
                return (
                  <div key={idx} className="py-3 flex gap-3">
                    <div className="text-2xl">{it.emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{l.qty} × {it.name}</div>
                      <div className="text-xs text-roast/70">{describe(it, l)}</div>
                      <button
                        className="text-xs text-red-700 mt-1"
                        onClick={() => setCart((c) => c.filter((_, i) => i !== idx))}
                      >Remove</button>
                    </div>
                    <div className="font-semibold">{CURRENCY}{l.unit * l.qty}</div>
                  </div>
                );
              })}
            </div>
            {cart.length === 0 && <p className="py-8 text-center text-roast/60">Your cart is empty.</p>}
            <div className="flex justify-between text-lg font-semibold mt-4 pt-4 border-t border-latte/40">
              <span>Total</span><span>{CURRENCY}{total}</span>
            </div>
            {err && <p className="text-red-700 text-sm mt-3">{err}</p>}
            <button
              disabled={placing || !cart.length}
              onClick={place}
              className="mt-5 w-full rounded-full bg-espresso text-foam py-4 font-semibold shadow-lg disabled:opacity-50"
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return <Suspense><MenuInner /></Suspense>;
}
