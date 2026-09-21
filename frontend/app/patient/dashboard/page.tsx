import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { QRCodeSVG } from 'qrcode.react'
import { FileText, Clock, ShieldAlert, CheckCircle, XCircle, Activity, Stethoscope, ClipboardList, LogOut, FileArchive, UserCheck, LayoutDashboard, Search, Bell, Mail, Calendar, User, Download, Share2, Upload } from 'lucide-react'
import Link from 'next/link'
import AyushCardView from './AyushCardView'
import PatientLayoutWrapper from './PatientLayoutWrapper'
import UploadMedicineForm from './UploadMedicineForm'
import BookOPForm from './BookOPForm'

type Props = {
  searchParams: { view?: string } | Promise<{ view?: string }>
}

export default async function PatientDashboard(props: Props) {
  const session = await getSession()
  if (!session || session.role !== 'PATIENT') {
    redirect('/')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  // Fetch patient data from backend
  const res = await fetch('http://localhost:5000/api/patient/dashboard', {
    headers: {
      'Cookie': `auth_token=${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    return <div>Failed to load data</div>
  }

  const { patient, availableDoctors } = await res.json();

  // Handle both Next.js 14 and 15 searchParams resolution
  const searchParams = await Promise.resolve(props.searchParams)
  const view = searchParams?.view || 'overview'

  if (!patient || !patient.patientProfile) {
    return <div>Profile not found</div>
  }

  const pendingConsents = patient.consentsGiven.filter((c: any) => c.status === 'PENDING')
  const activeConsentsCount = patient.consentsGiven.filter((c: any) => c.status === 'APPROVED').length
  
  // Base History
  let history = patient.records
  
  // Mock Data Injection for Demo as requested
  if (history.length === 0) {
    history = [
      {
        id: 'mock-1',
        title: 'General Checkup',
        type: 'CONSULTATION',
        description: 'Regular health checkup. Vitals normal. Advised to maintain hydration.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // This Week
        patientId: patient.id,
        doctorId: 'doc-1',
        updatedAt: new Date(),
        doctor: { id: 'doc-1', name: 'Sarah Jenkins', email: 'sarah@test.com', password: '', role: 'DOCTOR', createdAt: new Date(), updatedAt: new Date(), doctorProfile: { id: 'dp1', userId: 'doc-1', licenseNumber: 'L1', specialization: 'General Physician', hospitalName: 'City Care' } }
      },
      {
        id: 'mock-2',
        title: 'Complete Blood Count',
        type: 'LAB_REPORT',
        description: 'CBC and Lipid panel. All parameters within normal ranges.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // This Month
        patientId: patient.id,
        doctorId: 'doc-2',
        updatedAt: new Date(),
        doctor: { id: 'doc-2', name: 'Michael Chen', email: 'mike@test.com', password: '', role: 'DOCTOR', createdAt: new Date(), updatedAt: new Date(), doctorProfile: { id: 'dp2', userId: 'doc-2', licenseNumber: 'L2', specialization: 'Pathologist', hospitalName: 'City Care' } }
      },
      {
        id: 'mock-3',
        title: 'Orthopedic Consultation',
        type: 'CONSULTATION',
        description: 'Patient complained of knee pain. Prescribed mild physiotherapy.',
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // Last Year
        patientId: patient.id,
        doctorId: 'doc-3',
        updatedAt: new Date(),
        doctor: { id: 'doc-3', name: 'Robert Smith', email: 'rob@test.com', password: '', role: 'DOCTOR', createdAt: new Date(), updatedAt: new Date(), doctorProfile: { id: 'dp3', userId: 'doc-3', licenseNumber: 'L3', specialization: 'Orthopedics', hospitalName: 'Ortho Center' } }
      }
    ] as any
  }

  const opRegistrations = patient.opRegistrations || []
  const totalConsultations = history.filter((r: any) => r.type === 'CONSULTATION').length
  const totalReports = history.filter((r: any) => r.type === 'LAB_REPORT').length
  const opVisits = opRegistrations.length

  const navLinks = [
    { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { name: 'My AYUSH Card', icon: UserCheck, id: 'ayush-card' },
    { name: 'Health History', icon: Clock, id: 'history' },
    { name: 'Upload Medicine', icon: Upload, id: 'upload-medicine' },
    { name: 'OP Registrations', icon: ClipboardList, id: 'op-registrations' },
    { name: 'Consents', icon: ShieldAlert, id: 'consents' },
    { name: 'My Profile', icon: User, id: 'profile' },
  ]

  // View Components
  const renderOverview = () => (
    <div className="space-y-8 animate-fade-in-up">
      {/* 4 Colored Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-sm shadow-blue-500/30 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-3 rounded-xl"><Stethoscope className="w-6 h-6" /></div>
            <h3 className="text-4xl font-bold">{totalConsultations}</h3>
          </div>
          <p className="text-blue-100 font-medium">Consultations</p>
        </div>
        
        <div className="bg-emerald-400 rounded-2xl p-6 text-white shadow-sm shadow-emerald-400/30 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-3 rounded-xl"><FileArchive className="w-6 h-6" /></div>
            <h3 className="text-4xl font-bold">{totalReports}</h3>
          </div>
          <p className="text-emerald-50 font-medium">Lab Reports</p>
        </div>

        <div className="bg-purple-500 rounded-2xl p-6 text-white shadow-sm shadow-purple-500/30 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-3 rounded-xl"><UserCheck className="w-6 h-6" /></div>
            <h3 className="text-4xl font-bold">{activeConsentsCount}</h3>
          </div>
          <p className="text-purple-100 font-medium">Active Consents</p>
        </div>

        <div className="bg-[#00d0c4] rounded-2xl p-6 text-white shadow-sm shadow-cyan-500/30 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-3 rounded-xl"><Activity className="w-6 h-6" /></div>
            <h3 className="text-4xl font-bold">{opVisits}</h3>
          </div>
          <p className="text-cyan-50 font-medium">OP Visits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Snapshot Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900">Recent Health Timeline</h3>
              <Link href="?view=history" className="text-sm text-blue-600 font-medium hover:underline">See all</Link>
            </div>
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
              {history.slice(0, 3).map((record: any) => (
                <div key={record.id} className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 border-white ${
                    record.type === 'CONSULTATION' ? 'bg-blue-400' :
                    record.type === 'LAB_REPORT' ? 'bg-emerald-400' :
                    record.type === 'MEDICINE_UPLOAD' ? 'bg-amber-400' : 'bg-purple-400'
                  }`} />
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{record.title}</h4>
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{record.description}</p>
                    {record.fileUrl && (
                      <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> View Attachment
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick AYUSH Card */}
          <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
            <div className="relative z-10 flex flex-col items-center">
              <h3 className="font-bold text-lg mb-4 text-cyan-400">Digital AYUSH Card</h3>
              <div className="bg-white p-3 rounded-xl mb-4 shadow-lg group-hover:scale-105 transition-transform">
                <QRCodeSVG value={patient.patientProfile?.qrToken || ''} size={100} level="H" />
              </div>
              <p className="font-mono text-lg font-bold tracking-widest">{patient.patientProfile?.ayushId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHistory = () => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up min-h-[600px]">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold text-slate-900">Health History</h2>
      </div>

      <div className="space-y-12 pl-4">
        {[
          { label: 'This Week', filter: (d: Date) => (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000 },
          { label: 'This Month', filter: (d: Date) => { const diff = Date.now() - d.getTime(); return diff >= 7 * 24 * 60 * 60 * 1000 && diff < 30 * 24 * 60 * 60 * 1000; } },
          { label: 'Last Year', filter: (d: Date) => (Date.now() - d.getTime()) >= 30 * 24 * 60 * 60 * 1000 }
        ].map(group => {
          const items = history.filter((h: any) => group.filter(new Date(h.createdAt)))
          if (items.length === 0) return null;
          
          return (
            <div key={group.label} className="relative">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-4">
                {group.label} <div className="h-px bg-slate-100 flex-1"></div>
              </h3>
              <div className="space-y-6 border-l-2 border-slate-100 ml-2">
                {items.map((record: any) => (
                  <div key={record.id} className="relative pl-8 group">
                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1.5 border-4 border-white shadow-sm ${
                      record.type === 'CONSULTATION' ? 'bg-blue-500' :
                      record.type === 'LAB_REPORT' ? 'bg-emerald-500' : 
                      record.type === 'MEDICINE_UPLOAD' ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-slate-900">{record.title}</h4>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm">
                          {new Date(record.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-4">{record.description}</p>
                      {record.fileUrl && (
                        <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mb-4 block">
                          <Download className="w-4 h-4" /> View Attached File
                        </a>
                      )}
                      
                      {record.doctor ? (
                        <div className="flex items-center gap-3 text-sm border-t border-slate-200 pt-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {record.doctor.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-700">Dr. {record.doctor.name}</span>
                          <span className="text-slate-400 text-xs">({record.doctor.doctorProfile?.specialization})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm border-t border-slate-200 pt-3">
                           <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                             {patient.name.charAt(0)}
                           </div>
                           <span className="font-medium text-slate-700">Uploaded by Self</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderOpRegistrations = () => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up min-h-[600px]">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
          <h2 className="text-2xl font-bold text-slate-900">OP Registrations</h2>
        </div>
        <Link href="?view=book-op" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Book New OP</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500 uppercase tracking-wider">
              <th className="pb-4 font-semibold px-4">OP Number</th>
              <th className="pb-4 font-semibold px-4">Date</th>
              <th className="pb-4 font-semibold px-4">Department & Doctor</th>
              <th className="pb-4 font-semibold px-4">Token</th>
              <th className="pb-4 font-semibold px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {opRegistrations.length === 0 ? (
               <tr>
                 <td colSpan={5} className="py-8 text-center text-slate-500">No OP Registrations found.</td>
               </tr>
            ) : opRegistrations.map((op: any) => (
              <tr key={op.id} className="hover:bg-slate-50 transition group">
                <td className="py-4 px-4 font-mono font-medium text-slate-900">{op.opNumber}</td>
                <td className="py-4 px-4 text-slate-600">{new Date(op.createdAt).toLocaleDateString()}</td>
                <td className="py-4 px-4">
                  <p className="font-semibold text-slate-900">{op.department || op.doctor?.doctorProfile?.specialization || 'General'}</p>
                  <p className="text-xs text-slate-500">Dr. {op.doctor?.name}</p>
                </td>
                <td className="py-4 px-4">
                  <span className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-700 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition">
                    {op.visitType || '1'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    op.status === 'WAITING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {op.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up min-h-[600px] max-w-3xl">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><User className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-10 items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-lg flex items-center justify-center bg-slate-800 text-cyan-400 text-5xl font-bold">
            {patient.name.charAt(0)}
          </div>
          <button title="Photo upload coming soon!" className="text-sm font-semibold text-blue-600 hover:underline cursor-not-allowed">Change Photo</button>
        </div>

        <div className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 font-medium">{patient.name}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 font-medium">{patient.email}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact Number</label>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 font-medium">{patient.patientProfile?.contact || 'Not provided'}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date of Birth</label>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 font-medium">
                {patient.patientProfile?.dateOfBirth ? new Date(patient.patientProfile.dateOfBirth).toLocaleDateString() : 'Not provided'}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Blood Group</label>
              <div className="bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                <Activity className="w-4 h-4" /> {patient.patientProfile?.bloodGroup || 'Not specified'}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button title="Profile updates coming soon!" className="bg-[#00d0c4] text-[#0a192f] px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-teal-400 transition cursor-not-allowed">
              Update Profile Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAyushCard = () => (
    <AyushCardView
      patientName={patient.name}
      ayushId={patient.patientProfile?.ayushId || ''}
      qrToken={patient.patientProfile?.qrToken || ''}
    />
  )

  const renderConsents = () => (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up min-h-[600px]">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ShieldAlert className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold text-slate-900">Consent Management</h2>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            Pending Requests 
            {pendingConsents.length > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingConsents.length}</span>}
          </h3>
          {pendingConsents.length === 0 ? (
            <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">No pending consent requests at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingConsents.map(consent => (
                <div key={consent.id} className="border border-amber-200 rounded-2xl p-5 bg-amber-50">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold">
                      {consent.doctor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Dr. {consent.doctor.name}</p>
                      <p className="text-xs text-slate-600">{consent.doctor.doctorProfile?.specialization}</p>
                    </div>
                  </div>
                  <p className="text-sm text-amber-900 mb-4 font-medium">Requesting access to your health records for consultation.</p>
                  <div className="flex gap-2">
                    <form action={`/api/patient/consent`} method="POST" className="flex-1">
                      <input type="hidden" name="consentId" value={consent.id} />
                      <input type="hidden" name="action" value="APPROVE" />
                      <button className="w-full flex justify-center items-center gap-2 bg-[#0a192f] hover:bg-slate-800 text-white text-sm font-bold py-2 rounded-xl transition">
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                    </form>
                    <form action={`/api/patient/consent`} method="POST" className="flex-[0.5]">
                      <input type="hidden" name="consentId" value={consent.id} />
                      <input type="hidden" name="action" value="REJECT" />
                      <button className="w-full flex justify-center items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-bold py-2 rounded-xl transition">
                        Deny
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Active Consents</h3>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Doctor Name</th>
                  <th className="px-6 py-4 font-bold">Specialization</th>
                  <th className="px-6 py-4 font-bold">Granted On</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.consentsGiven.filter(c => c.status === 'APPROVED').map(consent => (
                  <tr key={consent.id} className="hover:bg-white transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {consent.doctor.name.charAt(0)}
                      </div>
                      Dr. {consent.doctor.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{consent.doctor.doctorProfile?.specialization}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(consent.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <form action={`/api/patient/consent`} method="POST">
                        <input type="hidden" name="consentId" value={consent.id} />
                        <input type="hidden" name="action" value="REVOKE" />
                        <button className="text-red-500 hover:text-red-700 text-sm font-bold hover:underline">Revoke Access</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (view) {
      case 'history': return renderHistory();
      case 'op-registrations': return renderOpRegistrations();
      case 'profile': return renderProfile();
      case 'ayush-card': return renderAyushCard();
      case 'consents': return renderConsents();
      case 'upload-medicine': return <UploadMedicineForm />;
      case 'book-op': return <BookOPForm doctors={availableDoctors} />;
      case 'overview':
      default: return renderOverview();
    }
  }

  return (
    <PatientLayoutWrapper
      patientName={patient.name}
      ayushId={patient.patientProfile.ayushId}
      view={view}
      pendingConsentsCount={pendingConsents.length}
    >
      {view === 'overview' && (
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome {patient.name}</h2>
            <p className="text-slate-500 text-sm">Have a nice day and stay healthy!</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}

      {renderContent()}
    </PatientLayoutWrapper>
  )
}
