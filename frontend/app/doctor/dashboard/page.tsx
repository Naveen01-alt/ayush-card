import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { QrCode, Users, Calendar, Activity, Clock, FilePlus, ChevronRight } from 'lucide-react'

export default async function DoctorDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    redirect('/')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  // Fetch doctor data from backend
  const res = await fetch('http://localhost:5000/api/doctor/dashboard', {
    headers: {
      'Cookie': `auth_token=${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    return <div>Failed to load data</div>
  }

  const { doctor, stats: dataStats, activeConsentsList } = await res.json();

  const stats = [
    { name: "Today's OP", value: dataStats.todaysOP, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: "Patients Seen", value: dataStats.patientsSeen, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: "Pending Consents", value: dataStats.pendingConsents, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: "Active Consents", value: dataStats.activeConsents, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {doctor?.name}</h1>
          <p className="text-slate-500 mt-1">
            {doctor?.doctorProfile?.specialization} | {doctor?.doctorProfile?.hospitalName} | {doctor?.doctorProfile?.licenseNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          
          <Link href="/doctor/scan" className="group flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm p-6 transition duration-300">
            <div className="flex items-center gap-4">
              <QrCode className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-semibold text-lg">Scan AYUSH Card</h3>
                <p className="text-blue-200 text-sm">Find patient & view records</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-300" />
          </Link>

          <Link href="/doctor/op" className="group flex items-center justify-between bg-white hover:bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 transition duration-300">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Today's OP</h3>
                <p className="text-slate-500 text-sm">Manage waiting patients</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          
          <Link href="/doctor/patients" className="group flex items-center justify-between bg-white hover:bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 transition duration-300">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900">My Patients</h3>
                <p className="text-slate-500 text-sm">View patient directory</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>

        {/* Recent Active Patients / Consents */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent Authorized Patients</h2>
              <Link href="/doctor/patients" className="text-sm text-blue-600 hover:underline font-medium">
                View all
              </Link>
            </div>
            
            {activeConsentsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <Activity className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">No active patient authorizations.</p>
                <p className="text-sm text-slate-400 mt-1">Scan a patient's AYUSH card to request access.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeConsentsList.map((consent) => (
                  <Link 
                    key={consent.id} 
                    href={`/doctor/patient/${consent.patient.patientProfile?.ayushId}`}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition bg-slate-50/50 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
                        {consent.patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{consent.patient.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{consent.patient.patientProfile?.ayushId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Active Access
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Updated {new Date(consent.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
