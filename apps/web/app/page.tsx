'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectCanvasDemo } from '@/lib/axiom/api';
import './mocksite/mocksite.css';

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function enterDemo() {
    setBusy(true);
    await connectCanvasDemo();
    router.push('/mocksite');
  }
  return <main className="axiom login-page">
    <section className="connect-card">
      <div className="connect-heading"><div className="canvas-mark">C</div><div><h1>Connect to Canvas</h1><p>Your semester, with a clearer next step.</p></div></div>
      <label htmlFor="canvas-token">Canvas API key</label>
      <div className="token-input"><span aria-hidden="true">♧</span><input id="canvas-token" type="password" disabled placeholder="API connection coming soon" /></div>
      <button className="primary connect-button" onClick={enterDemo} disabled={busy}>{busy ? 'Opening your workspace…' : 'Explore the demo'} <span aria-hidden="true">→</span></button>
      <p className="connection-note">Demo mode · No API key required or stored</p>
    </section>
  </main>;
}
