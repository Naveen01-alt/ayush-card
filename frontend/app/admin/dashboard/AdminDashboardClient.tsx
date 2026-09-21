'use client'

import { useState } from 'react'
import { 
  Users, Activity, FileText, Database, LayoutDashboard, 
  ShieldAlert, ClipboardList, LogOut, Search, UserCheck, 
  AlertTriangle, Clock, ActivityIcon, Menu, X, Upload
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AdminDashboardClient({ data, adminName }: { data: any, adminName: string }) {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'overview'

  const [patientSearch, setPatientSearch] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('ALL')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { name: 'Patient Management', icon: Users, id: 'patients' },
    { name: 'Doctor Management', icon: Activity, id: 'doctors' },
    { name: 'Upload Medicine', icon: Upload, id: 'upload-medicine' },
    { name: "Today's OP", icon: ClipboardList, id: 'op' },
    { name: 'Consent Activity', icon: UserCheck, id: 'consents' },
    { name: 'Audit Logs', icon: FileText, id: 'audit' },
  ]

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Patients', value: data.stats.totalPatients, icon: Users, color: 'bg-blue-500' },
          { label: 'Total Doctors', value: data.stats.totalDoctors, icon: Activity, color: 'bg-emerald-500' },
          { label: "Today's OP", value: data.stats.todayOPCount, icon: ClipboardList, color: 'bg-amber-500' },
          { label: 'Active Consents', value: data.stats.activeConsentsCount, icon: UserCheck, color: 'bg-purple-500' },
          { label: 'Consultations', value: data.stats.totalConsultations, icon: FileText, color: 'bg-[#00d0c4]' },
          { label: 'Security Events', value: data.stats.securityEventsCount, icon: ShieldAlert, color: 'bg-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className={`p-3 rounded-xl text-white mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-slate-900">Security Activity</h2>
          </div>
          <div className="space-y-4">
            {data.auditLogs
              .filter((log: any) => log.action === 'RECORD_ACCESS_DENIED' || log.action === 'DOCTOR_LOGIN_FAILED' || log.action === 'CONSENT_EXPIRED_ATTEMPT')
              .slice(0, 5)
              .map((log: any) => (
                <div key={log.id} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-rose-800 text-sm">WARNING: {log.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-rose-600 font-semibold">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-rose-900 font-medium">{log.actor.name} ({log.actor.role}) {log.details}</p>
                  {log.action === 'RECORD_ACCESS_DENIED' && (
                    <div className="mt-1 text-xs text-rose-700 bg-white/50 p-2 rounded">
                      <span className="font-bold">Reason:</span> Access denied by system policy (Consent missing or expired).
                    </div>
                  )}
                </div>
              ))}
            {data.stats.securityEventsCount === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No recent security events detected.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Clock className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
            {data.auditLogs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="relative pl-6">
                <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 border-white ${
                  log.action.includes('DENIED') || log.action.includes('FAILED') ? 'bg-rose-500' : 'bg-indigo-400'
                }`} />
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{log.actor.name}</h4>
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-bold mb-1">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPatients = () => {
    const filtered = data.patients.filter((p: any) => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.patientProfile?.ayushId.toLowerCase().includes(patientSearch.toLowerCase())
    )

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Patient Management</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name or AYUSH ID..." 
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4 font-semibold rounded-tl-lg">Patient Name</th>
                <th className="py-3 px-4 font-semibold">AYUSH ID</th>
                <th className="py-3 px-4 font-semibold">Reg Date</th>
                <th className="py-3 px-4 font-semibold rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((patient: any) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{patient.name}</td>
                  <td className="py-3 px-4 font-mono text-sm text-cyan-600">{patient.patientProfile?.ayushId}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{new Date(patient.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">No patients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderDoctors = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Doctor Management</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-4 font-semibold rounded-tl-lg">Doctor Name</th>
              <th className="py-3 px-4 font-semibold">License ID</th>
              <th className="py-3 px-4 font-semibold">Specialization</th>
              <th className="py-3 px-4 font-semibold">Hospital</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.doctors.map((doctor: any) => (
              <tr key={doctor.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">Dr. {doctor.name}</td>
                <td className="py-3 px-4 font-mono text-sm text-slate-600">{doctor.doctorProfile?.licenseNumber}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{doctor.doctorProfile?.specialization}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{doctor.doctorProfile?.hospitalName || '-'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Active</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-xs font-bold text-blue-600 hover:underline mr-3">View</button>
                  <button className="text-xs font-bold text-rose-600 hover:underline">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderOP = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Today's OP Registrations</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-4 font-semibold rounded-tl-lg">OP Number</th>
              <th className="py-3 px-4 font-semibold">Patient</th>
              <th className="py-3 px-4 font-semibold">Doctor</th>
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Reason</th>
              <th className="py-3 px-4 font-semibold rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.todayOP.map((op: any) => (
              <tr key={op.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono text-sm font-bold text-slate-900">{op.opNumber}</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-700">{op.patient.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">Dr. {op.doctor.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{new Date(op.createdAt).toLocaleTimeString()}</td>
                <td className="py-3 px-4 text-sm text-slate-500 truncate max-w-xs">{op.reason || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    op.status === 'WAITING' ? 'bg-amber-100 text-amber-700' : 
                    op.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {op.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.todayOP.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">No OP registrations today</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderConsents = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Consent Activity</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-4 font-semibold rounded-tl-lg">Patient</th>
              <th className="py-3 px-4 font-semibold">Doctor</th>
              <th className="py-3 px-4 font-semibold">Requested Access</th>
              <th className="py-3 px-4 font-semibold">Created Time</th>
              <th className="py-3 px-4 font-semibold">Expiry Time</th>
              <th className="py-3 px-4 font-semibold rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.consents.map((consent: any) => (
              <tr key={consent.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-sm font-semibold text-slate-900">{consent.patient.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">Dr. {consent.doctor.name}</td>
                <td className="py-3 px-4 text-sm text-slate-500">Full Medical History</td>
                <td className="py-3 px-4 text-sm text-slate-500">{new Date(consent.createdAt).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{consent.expiresAt ? new Date(consent.expiresAt).toLocaleString() : '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    consent.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                    consent.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    consent.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {consent.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAuditLogs = () => {
    const filtered = data.auditLogs.filter((log: any) => {
      const matchesSearch = log.actor.name.toLowerCase().includes(auditSearch.toLowerCase()) || 
                            (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase()))
      const matchesAction = auditActionFilter === 'ALL' || log.action === auditActionFilter
      return matchesSearch && matchesAction
    })

    const actions = Array.from(new Set(data.auditLogs.map((log: any) => log.action)))

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Audit Logs</h2>
        
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Actor or Details..." 
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
            />
          </div>
          <select 
            value={auditActionFilter} 
            onChange={(e) => setAuditActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none text-slate-700 font-semibold"
          >
            <option value="ALL">All Actions</option>
            {actions.map((action: any) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4 font-semibold rounded-tl-lg">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold rounded-tr-lg">Result & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-xs font-semibold text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">{log.actor.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{log.actor.role}</span>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-indigo-600">{log.action}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 truncate max-w-md">{log.details || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No logs match criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderUploadMedicine = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in-up min-h-[600px]">
      <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600"/> Upload Medicine Record</h2>
      <form action="/api/upload-medicine" method="POST" encType="multipart/form-data" className="max-w-2xl space-y-6" onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement
        btn.disabled = true
        btn.innerText = 'Uploading...'
        try {
          const res = await fetch('/api/upload-medicine', { method: 'POST', body: new FormData(form) })
          if (res.ok) {
            alert('Medicine details uploaded successfully!')
            form.reset()
          } else {
            const data = await res.json()
            alert(data.error || 'Failed to upload')
          }
        } catch(err) {
          alert('An error occurred')
        } finally {
          btn.disabled = false
          btn.innerText = 'Upload Medicine'
        }
      }}>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Select Patient *</label>
          <select name="patientId" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <option value="">-- Select Patient --</option>
            {data.patients.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} (AYUSH ID: {p.patientProfile?.ayushId})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Medicine Name / Title *</label>
          <input type="text" name="title" required placeholder="e.g. Daily Vitamins" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Description & Dosage Details *</label>
          <textarea name="description" required rows={4} placeholder="Enter details..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"></textarea>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Upload File (Optional)</label>
          <input type="file" name="file" accept="image/*,.pdf" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2">
          Upload Medicine
        </button>
      </form>
    </div>
  )

  const renderContent = () => {
    switch (view) {
      case 'patients': return renderPatients()
      case 'doctors': return renderDoctors()
      case 'upload-medicine': return renderUploadMedicine()
      case 'op': return renderOP()
      case 'consents': return renderConsents()
      case 'audit': return renderAuditLogs()
      case 'overview':
      default: return renderOverview()
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col h-full z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Admin<span className="text-blue-400">Panel</span></span>
          </div>
          <button className="md:hidden p-1 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center py-8 border-b border-white/10">
          <div className="w-20 h-20 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-3xl font-bold text-blue-400 mb-3 relative">
            {adminName.charAt(0)}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <h3 className="font-bold text-lg">{adminName}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1">System Admin</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = view === link.id
            return (
              <Link 
                key={link.id} 
                href={`?view=${link.id}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <Icon className="w-5 h-5" /> {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action="/api/auth/logout" method="POST">
            <button className="flex items-center gap-3 text-slate-400 hover:text-rose-400 px-4 py-3 w-full font-bold transition-colors rounded-xl hover:bg-white/5">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">{view.replace('-', ' ')}</h1>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700">
              <ActivityIcon className="w-4 h-4 text-emerald-500" />
              System Operational
            </div>
          </header>

          {renderContent()}
          
        </div>
      </main>
    </div>
  )
}
