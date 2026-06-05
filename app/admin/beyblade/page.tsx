import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminBeybladeClient from './AdminBeybladeClient';

export default async function AdminBeybladePage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
    redirect('/admin');
  }
  return <AdminBeybladeClient />;
}
