'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ShieldAlert, LogOut, Search, Bell, Menu, X,
  LayoutDashboard, UserCheck, Clock, ClipboardList, User, Upload 
} from 'lucide-react'

export default function PatientLayoutWrapper({ 
  children, 
  patientName, 
  ayushId, 
  view,
  pendingConsentsCount 
}: any) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { name: 'My AYUSH Card', icon: UserCheck, id: 'ayush-card' },
    { name: 'Health History', icon: Clock, id: 'history' },
    { name: 'Upload Medicine', icon: Upload, id: 'upload-medicine' },
    { name: 'OP Registrations', icon: ClipboardList, id: 'op-registrations' },
    { name: 'Consents', icon: ShieldAlert, id: 'consents' },
    { name: 'My Profile', icon: User, id: 'profile' },
  ]

  return (
    <div className="flex h-screen bg-[#eef2f6] font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .main-scroll::-webkit-scrollbar { width: 6px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#0a192f]/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0a192f] text-white flex flex-col h-full z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#0a192f]" />
            </div>
            <span className="font-bold text-xl tracking-tight">AYUSH<span className="text-cyan-400">Card</span></span>
          </div>
          <button className="md:hidden p-1 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center py-8 border-b border-white/5">
          <div className="w-20 h-20 rounded-full border-[3px] border-cyan-400 p-1 mb-3 relative">
            <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-cyan-400">
              {patientName.charAt(0)}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0a192f] rounded-full"></div>
          </div>
          <h3 className="font-bold text-lg">{patientName}</h3>
          <p className="text-xs text-cyan-400 mt-1 uppercase tracking-widest font-mono">{ayushId}</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((link: any) => {
            const Icon = link.icon
            const isActive = view === link.id
            return (
              <Link 
                key={link.id} 
                href={`?view=${link.id}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive ? 'bg-[#00d0c4] text-[#0a192f] shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <Icon className="w-5 h-5" /> {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <form action="/api/auth/logout" method="POST">
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 px-4 py-3 w-full font-bold transition-colors rounded-xl hover:bg-white/5">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto main-scroll p-4 md:p-8 bg-[#f3f4f6]">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">{view.replace('-', ' ')}</h1>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64 hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              </div>
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-auto md:ml-0">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition relative">
                  <Bell className="w-4 h-4" />
                  {pendingConsentsCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
              </div>
            </div>
          </header>

          {children}
          
        </div>
      </main>
    </div>
  )
}
