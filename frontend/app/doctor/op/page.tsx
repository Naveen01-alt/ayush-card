import { getSession } from '@/lib/auth'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'

export default async function DoctorOPPage() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const opRegistrations: any[] = [];

  console.log('--- DOCTOR OP PAGE DEBUG ---')
  console.log('Session ID:', session.id)
  console.log('Session Email:', session.email)
  console.log('Session Role:', session.role)
  console.log('Today (gte):', today)
  console.log('OP Registrations count:', opRegistrations.length)
  console.log('----------------------------')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's OP</h1>
          <p className="text-slate-500">Patients registered for consultation today.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {opRegistrations.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No patients registered for OP today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="py-4 px-6">OP Number</th>
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">AYUSH ID</th>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Reason</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opRegistrations.map((op: any) => (
                  <tr key={op.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-mono text-sm text-slate-600">{op.opNumber}</td>
                    <td className="py-4 px-6 font-medium text-slate-900">{op.patient.name}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{op.patient.patientProfile?.ayushId}</td>
                    <td className="py-4 px-6 text-sm text-slate-500">{new Date(op.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{op.reason}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        op.status === 'WAITING' ? 'bg-amber-100 text-amber-700' :
                        op.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {op.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/doctor/patient/${op.patient.patientProfile?.ayushId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        Open <ChevronRight className="w-4 h-4" />
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
