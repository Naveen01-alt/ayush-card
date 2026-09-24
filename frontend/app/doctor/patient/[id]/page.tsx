import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PatientViewClient from './PatientViewClient'

export default async function DoctorPatientPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ayush-card-qj9n.vercel.app';

  let data: any = null;
  try {
    const res = await fetch(`${backendUrl}/api/doctor/patient/${encodeURIComponent(params.id)}`, {
      headers: {
        'Cookie': `auth_token=${token}`
      },
      cache: 'no-store'
    });

    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch patient data:', err);
  }

  if (!data || !data.patientProfile) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Not Found</h1>
          <p className="text-slate-500 mb-6">No patient matches ID "{params.id}".</p>
          <Link
            href="/doctor/scan"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition shadow-md"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Scanner
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PatientViewClient 
      patientProfile={data.patientProfile} 
      doctor={data.doctor}
      consent={data.consent}
      consentStatus={data.consentStatus}
      history={data.history || []}
      initialOtpVerified={data.otpVerified}
      sessionExpiry={data.sessionExpiry}
    />
  )
}
