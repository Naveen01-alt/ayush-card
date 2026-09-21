'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, User, FileText, CheckCircle } from 'lucide-react'

export default function BookOPForm({ doctors }: { doctors: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [doctorId, setDoctorId] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId) return alert('Please select a doctor')

    setLoading(true)
    try {
      const res = await fetch('/api/patient/op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, reason })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to book OP')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('?view=op-registrations')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-emerald-200 animate-fade-in-up max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">OP Booked Successfully!</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto text-lg">
          Your Outpatient registration has been confirmed. You will be redirected to your OP list shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up max-w-3xl">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calendar className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold text-slate-900">Book New OP</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Select Doctor *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none"
            >
              <option value="" disabled>Choose a doctor...</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} - {doc.doctorProfile?.specialization}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Reason for Visit (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g. Fever for 2 days"
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            ></textarea>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex gap-4 justify-end">
          <button 
            type="button" 
            onClick={() => router.push('?view=op-registrations')}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? 'Booking...' : 'Book OP'}
          </button>
        </div>
      </form>
    </div>
  )
}
