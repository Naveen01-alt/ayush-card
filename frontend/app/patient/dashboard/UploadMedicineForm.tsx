'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadMedicineForm({ patientId }: { patientId?: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    if (patientId) {
      formData.append('patientId', patientId)
    }

    try {
      const res = await fetch('/api/upload-medicine', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        form.reset()
      } else {
        setError(data.error || 'Failed to upload medicine')
      }
    } catch (err) {
      setError('An error occurred during upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Upload className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold text-slate-900">Upload Medicine Details</h2>
      </div>

      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-200">
          <CheckCircle className="w-5 h-5" />
          <p className="font-semibold">Medicine details uploaded successfully! They are now visible in the timeline.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Medicine Name / Title *</label>
          <input 
            type="text" 
            name="title" 
            required 
            placeholder="e.g. Daily Vitamins"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Description & Dosage Details *</label>
          <textarea 
            name="description" 
            required 
            rows={4}
            placeholder="Enter details like dosage, frequency, and any specific instructions..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
          ></textarea>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Upload Prescription or Medicine Photo</label>
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer">
            <input 
              type="file" 
              name="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept="image/*,.pdf"
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : (
              <>
                <Upload className="w-5 h-5" />
                Upload Medicine
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
