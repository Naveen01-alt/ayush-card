import { getSession } from '@/lib/auth'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'

export default async function DoctorConsultationsPage() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const consultations = await prisma.consultation.findMany({
    where: { doctorId: session.id },
    include: {
      patient: { include: { patientProfile: true } },
      opRegistration: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation History</h1>
          <p className="text-slate-500">History of all consultations performed by you.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {consultations.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No consultations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">AYUSH ID</th>
                  <th className="py-4 px-6">Diagnosis</th>
                  <th className="py-4 px-6">OP Number</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultations.map((cons) => (
                  <tr key={cons.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">
                      {new Date(cons.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">{cons.patient.name}</td>
                    <td className="py-4 px-6 text-sm text-slate-500 font-mono">{cons.patient.patientProfile?.ayushId}</td>
                    <td className="py-4 px-6 text-sm text-slate-600 truncate max-w-[200px]">{cons.diagnosis || '-'}</td>
                    <td className="py-4 px-6 text-sm text-slate-500 font-mono">{cons.opRegistration?.opNumber || '-'}</td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/doctor/patient/${cons.patient.patientProfile?.ayushId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        Patient <ChevronRight className="w-4 h-4" />
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
