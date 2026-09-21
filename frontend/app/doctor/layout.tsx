import DoctorLayoutClient from './DoctorLayoutClient'
import { getSession } from '@/lib/auth'

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  return (
    <DoctorLayoutClient email={session?.email || 'Unknown'}>
      {children}
    </DoctorLayoutClient>
  )
}
