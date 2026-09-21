import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, ChevronRight, Search } from 'lucide-react'

export default async function DoctorPatientsPage() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  // Fetch patients with active consents from backend
  const res = await fetch('http://localhost:5000/api/doctor/patients', {
    headers: {
      'Cookie': `auth_token=${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    return <div>Failed to load data</div>
  }

  const consents = await res.json();

  console.log('--- DOCTOR PATIENTS PAGE DEBUG ---')
  console.log('Session ID:', session.id)
  console.log('Session Email:', session.email)
  console.log('Current Date (for gt):', new Date())
  console.log('Active Consents count:', consents.length)
  console.log('---------------------------------')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
            <p className="text-slate-500">Patients you currently have authorized access to.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {consents.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No active patient authorizations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">AYUSH ID</th>
                  <th className="py-4 px-6">Consent Updated</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consents.map((consent: any) => (
                  <tr key={consent.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {consent.patient.name.charAt(0)}
                      </div>
                      {consent.patient.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 font-mono">{consent.patient.patientProfile?.ayushId}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{new Date(consent.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/doctor/patient/${consent.patient.patientProfile?.ayushId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        View Record <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
