'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CURRENCY } from '@/lib/brand';

function Inner() {
  const p = useSearchParams();
  const table = p.get('table');
  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="w-24 h-24 rounded-full bg-sage/15 flex items-center justify-center text-5xl fade-in">✅</div>
      <h1 className="font-display text-4xl mt-6">Order placed!</h1>
      <p className="mt-2 text-roast">Order <b>#{p.get('n')}</b> · Table <b>{table}</b></p>
      <p className="mt-6 max-w-xs text-roast/80">
        Thank you! Our team is preparing your order and will bring it to your table shortly.
      </p>
      <p className="mt-2 text-sm text-roast/60">Total to pay: {CURRENCY}{p.get('total')}</p>
      <Link
        href={`/menu?table=${table}`}
        className="mt-10 rounded-full bg-espresso text-foam px-8 py-3 font-medium shadow-lg"
      >
        Order something more
      </Link>
    </main>
  );
}
export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
