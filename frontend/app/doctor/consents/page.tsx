import { getSession } from '@/lib/auth'

import { redirect } from 'next/navigation'
import { Activity, Clock } from 'lucide-react'

export default async function DoctorConsentsPage() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') redirect('/')

  const consents: any[] = []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Consent Requests</h1>
            <p className="text-slate-500 mt-1">Track all your consent requests with patients.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {consents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p>No consent requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Patient Name</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Permissions Requested</th>
                  <th className="py-4 px-6">Requested On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consents.map((consent: any) => (
                  <tr key={consent.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {consent.patient.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        consent.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        consent.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {consent.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {consent.permissions || 'Standard Access'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(consent.requestedAt).toLocaleDateString()}
                      </div>
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
