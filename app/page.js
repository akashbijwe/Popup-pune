import Link from 'next/link';

export default function Home() {
  return (
    <main className="grain min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl mb-4">☕</div>
      <h1 className="font-display text-5xl text-espresso">Third Wave Cafe</h1>
      <p className="mt-3 text-roast italic font-display text-lg">Scan. Sip. Savour.</p>
      <p className="mt-8 max-w-xs text-roast/80">
        Please scan the QR code on your table to view the menu and place your order.
      </p>
      <Link href="/admin" className="mt-16 text-xs text-roast/50 hover:text-roast">Staff login</Link>
    </main>
  );
}
