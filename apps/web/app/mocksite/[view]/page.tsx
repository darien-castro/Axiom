import { notFound } from 'next/navigation';
import Dashboard, { type View } from '../components/Dashboard';
export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!['assignments', 'courses', 'history', 'simulation'].includes(view)) notFound();
  return <Dashboard view={view as View} />;
}
