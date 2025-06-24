import { redirect } from 'next/navigation';

export default async function HomePage() {
  redirect('/dashboard');
  // This return is never reached but needed for TypeScript
  return null;
} 