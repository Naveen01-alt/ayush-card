import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AdminDashboardClient from './AdminDashboardClient'

type Props = {
  searchParams: { view?: string } | Promise<{ view?: string }>
}

export default async function AdminDashboard(props: Props) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/')
  }

  // Handle Next.js 14/15 searchParams resolution
  await Promise.resolve(props.searchParams)

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  // Fetch admin data from backend
  const res = await fetch('http://localhost:5000/api/admin/dashboard', {
    headers: {
      'Cookie': `auth_token=${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    return <div>Failed to load data</div>
  }

  const data = await res.json();

  return <AdminDashboardClient data={data} adminName={session.name} />
}
