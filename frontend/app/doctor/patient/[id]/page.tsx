import { getSession } from '@/lib/auth'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import PatientViewClient from './PatientViewClient'

export default async function DoctorPatientPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const patientProfile: any = null;

  if (!patientProfile) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Not Found</h1>
        <p className="text-slate-500 mb-6">No patient matches this AYUSH ID.</p>
      </div>
    )
  }

  const doctor: any = null;

  const consent: any = null;

  let consentStatus = consent?.status || 'NONE'
  if (consentStatus === 'APPROVED' && consent?.expiresAt && consent.expiresAt < new Date()) {
    consentStatus = 'EXPIRED'
  }
  const hasActiveConsent = consentStatus === 'APPROVED'

  // SERVER-SIDE OTP PROTECTION
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(`otp_verified_${patientProfile.ayushId}`)?.value
  const sessionExpiry = cookieValue ? parseInt(cookieValue) : null
  const otpVerified = sessionExpiry ? sessionExpiry > Date.now() : false

  let history: any[] = []
  
  // Only release history if consent is active AND OTP is verified for this session
  if (hasActiveConsent && otpVerified) {
    const consultations: any[] = [];
    const patientRecords: any[] = [];

    console.log('--- DOCTOR PATIENT VIEW ---')
    console.log('patientId:', patientProfile.userId)
    console.log('AYUSH ID:', patientProfile.ayushId)
    console.log('consultation records count:', consultations.length)
    console.log('medicine/patient records count:', patientRecords.length)
    
    // Combine and sort descending
    history = [...consultations, ...patientRecords].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    console.log('total history records:', history.length)
  }

  return (
    <PatientViewClient 
      patientProfile={patientProfile} 
      doctor={doctor}
      consent={consent}
      consentStatus={consentStatus}
      history={history}
      initialOtpVerified={otpVerified}
      sessionExpiry={sessionExpiry}
    />
  )
}
