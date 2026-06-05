import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginClient from './AdminLoginClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value === 'authenticated') {
    redirect('/admin/beyblade');
  }
  return <AdminLoginClient />;
}
