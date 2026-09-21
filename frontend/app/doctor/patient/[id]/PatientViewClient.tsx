'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, FileText, CheckCircle2, ShieldAlert, 
  Activity, Clock, RefreshCw, Send, Plus, Fingerprint, Lock, Timer
} from 'lucide-react'

type State = 'PATIENT_FOUND' | 'OTP_REQUIRED' | 'HISTORY_UNLOCKED' | 'CONSULTATION_MODE' | 'CONSULTATION_SAVED' | 'SESSION_EXPIRED'

export default function PatientViewClient({ 
  patientProfile, 
  doctor,
  consent,
  consentStatus: initialConsentStatus,
  history,
  initialOtpVerified,
  sessionExpiry
}: any) {
  const router = useRouter()
  const [state, setState] = useState<State>(initialOtpVerified ? 'HISTORY_UNLOCKED' : 'PATIENT_FOUND')
  const [consentStatus, setConsentStatus] = useState(initialConsentStatus)
  const [loading, setLoading] = useState(false)
  
  // OTP State
  const [demoOtp, setDemoOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  // Consultation State
  const [symptoms, setSymptoms] = useState('')
  const [vitals, setVitals] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [prescription, setPrescription] = useState('')

  // Local history state to instantly show new records
  const [localHistory, setLocalHistory] = useState(history || [])

  // Session Expiry Timer
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if ((state === 'HISTORY_UNLOCKED' || state === 'CONSULTATION_MODE') && sessionExpiry) {
      const updateTimer = () => {
        const remaining = Math.max(0, sessionExpiry - Date.now())
        setTimeLeft(remaining)
        if (remaining === 0) {
          setState('SESSION_EXPIRED')
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [state, sessionExpiry])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 1. Send OTP
  const handleSendOtp = async () => {
    setLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/doctor/otp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ayushId: patientProfile.ayushId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setDemoOtp(data.demoOtp)
      setState('OTP_REQUIRED')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify OTP
  const handleVerifyOtp = async () => {
    if (!enteredOtp) return
    setLoading(true)
    setOtpError('')
    try {
      const res = await fetch('/api/doctor/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ayushId: patientProfile.ayushId, otp: enteredOtp })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid OTP')
      }
      
      // Success! Need to refresh to fetch server-protected data
      router.refresh()
      setState('HISTORY_UNLOCKED')
    } catch (err: any) {
      setOtpError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. Save Consultation
  const handleSaveConsultation = async () => {
    if (!symptoms || !diagnosis) return alert('Symptoms and Diagnosis are required')
    setLoading(true)
    try {
      const res = await fetch('/api/doctor/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientProfile.userId,
          symptoms, vitals, diagnosis, treatment, prescription
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save consultation')
      }
      
      const data = await res.json()
      setLocalHistory([data.consultation, ...localHistory])
      
      // Clear form
      setSymptoms('')
      setVitals('')
      setDiagnosis('')
      setTreatment('')
      setPrescription('')

      router.refresh()
      setState('CONSULTATION_SAVED')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper to request consent if missing
  const handleRequestConsent = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctor/consent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientProfile.userId,
          permissions: ['Previous consultations', 'Prescriptions', 'Lab reports', 'Medical timeline']
        })
      })
      if (!res.ok) throw new Error('Failed to request consent')
      setConsentStatus('PENDING')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/doctor/scan" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-medium">
        <ArrowLeft className="w-5 h-5" /> Back to Scanner
      </Link>

      {/* STEP 1: PATIENT DETAILS (Always visible at top as a context card) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">Patient Identified</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold bg-white/10 px-3 py-1 rounded-lg">
            {patientProfile.ayushId}
          </span>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-700">
              {patientProfile.user.name.charAt(0)}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{patientProfile.user.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</p>
                <p className="font-medium text-slate-900 flex items-center gap-1">
                  <Activity className="w-4 h-4 text-red-500" /> {patientProfile.bloodGroup || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="font-medium text-slate-900">
                  {patientProfile.dateOfBirth ? new Date(patientProfile.dateOfBirth).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p>
                <p className="font-medium text-slate-900">{patientProfile.contact || '******4321'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATE MANAGER */}

      {state === 'PATIENT_FOUND' && (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-600 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Medical History is Protected</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Doctor verification is required to access the patient's previous records.
          </p>

          {consentStatus === 'APPROVED' ? (
            <button 
              onClick={handleSendOtp}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-slate-200"
            >
              <Fingerprint className="w-5 h-5" />
              {loading ? 'Processing...' : 'Verify & View Medical History'}
            </button>
          ) : consentStatus === 'PENDING' ? (
            <div className="inline-flex flex-col items-center">
              <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5" /> Consent Pending
              </span>
              <p className="text-sm text-slate-500 mb-4">Waiting for patient to approve via their app.</p>
              <button onClick={() => router.refresh()} className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh Status
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-600 mb-4 font-medium">Patient consent is required before verification.</p>
              <button 
                onClick={handleRequestConsent}
                disabled={loading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                <ShieldAlert className="w-5 h-5" />
                {loading ? 'Requesting...' : 'Request Patient Consent'}
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'OTP_REQUIRED' && (
        <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-200 max-w-md mx-auto animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Doctor Verification</h2>
          <p className="text-slate-500 text-sm mb-6">
            To access protected patient history, verify your identity. An OTP has been sent to your registered contact.
          </p>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 border border-blue-100">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Demo OTP</p>
            <p className="text-2xl font-mono font-bold tracking-[0.5em]">{demoOtp}</p>
          </div>

          {otpError && <p className="text-red-500 text-sm font-medium mb-4">{otpError}</p>}

          <div className="space-y-4">
            <input 
              type="text" 
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
            />
            <button 
              onClick={handleVerifyOtp}
              disabled={loading || enteredOtp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button onClick={handleSendOtp} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {state === 'HISTORY_UNLOCKED' && (
        <div className="animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-emerald-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">Doctor Verified</p>
                <p className="text-xs text-emerald-700 font-medium">History Access Authorized</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-rose-100 font-mono font-bold flex-1 md:flex-none justify-center">
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <button 
                onClick={() => setState('CONSULTATION_MODE')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-slate-200 w-full md:w-auto justify-center"
              >
                <Plus className="w-5 h-5" /> Start Consultation
              </button>
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" /> Medical Timeline
            </h3>

            {localHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No previous medical history found.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-10">
                {localHistory.map((record: any) => {
                  const isConsultation = record.symptoms !== undefined;
                  const isMedicine = record.type === 'MEDICINE_UPLOAD';
                  const isLab = record.type === 'LAB_REPORT';
                  
                  let title = 'Medical Record';
                  if (isConsultation) title = 'Consultation';
                  else if (isMedicine) title = 'Medicine Added';
                  else if (isLab) title = 'Lab Report';
                  else if (record.title) title = record.title;

                  let doctorName = 'Self Uploaded';
                  if (record.doctor?.name) doctorName = `Dr. ${record.doctor.name}`;

                  let iconColor = 'border-slate-300';
                  if (isConsultation) iconColor = 'border-blue-400';
                  else if (isMedicine) iconColor = 'border-amber-400';
                  else if (isLab) iconColor = 'border-emerald-400';

                  return (
                    <div key={record.id} className="relative pl-8">
                      <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 ${iconColor}`}></span>
                      
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm font-bold text-blue-600 mb-1">
                              {new Date(record.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {isMedicine && '💊 '}
                              {isLab && '🧪 '}
                              {isConsultation && '🩺 '}
                              {title}
                            </h4>
                            <p className="text-sm text-slate-500">{doctorName}</p>
                          </div>
                        </div>
                        
                        {isConsultation ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-200">
                            {record.symptoms && (
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Symptoms</p>
                                <p className="text-sm text-slate-700">{record.symptoms}</p>
                              </div>
                            )}
                            {record.diagnosis && (
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                                <p className="text-sm text-slate-700">{record.diagnosis}</p>
                              </div>
                            )}
                            {record.treatment && (
                              <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Treatment / Prescription</p>
                                <p className="text-sm text-slate-700">{record.treatment}</p>
                                {record.prescription && <p className="text-sm text-slate-700 mt-2 pt-2 border-t border-blue-100/50">{record.prescription}</p>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            {record.title && <p className="text-sm font-bold text-slate-800 mb-1">{record.title}</p>}
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.description}</p>
                            {record.fileUrl && (
                              <div className="mt-4">
                                <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                  <FileText className="w-4 h-4" /> View Attachment
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {state === 'CONSULTATION_MODE' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Current Consultation</h2>
              <p className="text-slate-500 mt-1">Entering present visit data for timeline.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-rose-100 font-mono font-bold flex-1 md:flex-none justify-center">
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <button onClick={() => setState('HISTORY_UNLOCKED')} className="text-sm text-slate-500 hover:text-slate-900 font-medium">Cancel</button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Symptoms *</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px]"
                  placeholder="E.g. High fever and continuous cough for 3 days"
                  value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Vitals</label>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="E.g. BP 120/80, Temp 98.6"
                  value={vitals} onChange={(e) => setVitals(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis *</label>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Primary diagnosis"
                  value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Treatment Plan</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px]"
                  placeholder="Clinical observations and treatment plan"
                  value={treatment} onChange={(e) => setTreatment(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Prescription</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px]"
                  placeholder="Medicine, Dosage, Frequency, Duration"
                  value={prescription} onChange={(e) => setPrescription(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveConsultation}
                disabled={loading || !symptoms || !diagnosis}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Consultation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {state === 'SESSION_EXPIRED' && (
        <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-rose-200 max-w-md mx-auto animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 text-rose-600 mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Expired</h2>
          <p className="text-slate-500 mb-8">
            Your 30-minute access window has closed. The patient's medical history is now locked.
          </p>
          <button 
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            {loading ? 'Processing...' : 'Re-authenticate via OTP'}
          </button>
        </div>
      )}

      {state === 'CONSULTATION_SAVED' && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-emerald-200 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Consultation Saved</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-lg">
            Today's consultation has been securely added to the patient's health timeline.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setState('HISTORY_UNLOCKED')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              View Updated Timeline
            </button>
            <Link href="/doctor/dashboard" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
