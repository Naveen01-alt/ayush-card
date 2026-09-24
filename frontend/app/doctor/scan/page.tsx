'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, ArrowLeft, Search, Fingerprint } from 'lucide-react'
import Link from 'next/link'

export default function DoctorScanPage() {
  const router = useRouter()
  const [manualToken, setManualToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'SELECT' | 'SCAN' | 'MANUAL'>('SELECT')

  useEffect(() => {
    if (mode !== 'SCAN') return;

    // Initialize scanner only when in SCAN mode
    let scanner: Html5QrcodeScanner | null = null;
    
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (token) => handleScanToken(token, scanner),
        (err) => console.log(err) // Ignore frequent scan failures
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [mode]);

  const handleScanToken = async (token: string, scannerInstance?: Html5QrcodeScanner | null) => {
    if (loading) return
    setLoading(true)
    setError('')

    const cleanToken = token.trim()
    if (!cleanToken) {
      setError('Please enter a valid AYUSH ID or scan a card.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/doctor/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrToken: cleanToken })
      })

      let data: any = {}
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        throw new Error(
          res.status === 404
            ? `Patient not found with ID "${cleanToken}". Please check the ID and try again.`
            : res.status === 401
            ? 'Session expired. Please log in again.'
            : 'Unable to reach the server. Please try again later.'
        )
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid token or patient not found')
      }
      
      if (scannerInstance) {
        scannerInstance.clear().catch(console.error)
      }

      router.push(`/doctor/patient/${data.ayushId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    handleScanToken(manualToken.trim())
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Link href="/doctor/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition font-medium">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center text-white">
          <h1 className="text-3xl font-bold mb-3">Access Patient</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Scan the patient's AYUSH Card or enter the AYUSH ID to securely access patient information.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {mode === 'SELECT' && (
            <div className="space-y-4">
              <button 
                onClick={() => setMode('SCAN')}
                className="w-full flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-4 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Option 1: Scan AYUSH Card</h3>
                    <p className="text-slate-500 text-sm">Use your camera to scan the secure QR token.</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setMode('MANUAL')}
                className="w-full flex items-center justify-between p-6 border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Fingerprint className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Option 2: Enter AYUSH ID</h3>
                    <p className="text-slate-500 text-sm">Manually type the Universal Health ID.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === 'SCAN' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Scan QR Token</h3>
                <button onClick={() => setMode('SELECT')} className="text-sm font-medium text-blue-600 hover:underline">Change Method</button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 overflow-hidden relative min-h-[300px]">
                <div id="reader" className="w-full h-full"></div>
              </div>
            </div>
          )}

          {mode === 'MANUAL' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Enter AYUSH ID</h3>
                <button onClick={() => setMode('SELECT')} className="text-sm font-medium text-blue-600 hover:underline">Change Method</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Patient AYUSH ID or Secure Token</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. AYUSH-100001"
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium text-lg"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !manualToken.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Find Patient'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
