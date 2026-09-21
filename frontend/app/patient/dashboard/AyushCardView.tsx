'use client'

import { QRCodeSVG } from 'qrcode.react'
import { ShieldAlert, Download, Share2 } from 'lucide-react'
import * as htmlToImage from 'html-to-image'
import { useRef, useState } from 'react'

type Props = {
  patientName: string
  ayushId: string
  qrToken: string
}

export default function AyushCardView({ patientName, ayushId, qrToken }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (cardRef.current && !isDownloading) {
      try {
        setIsDownloading(true)
        const image = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 })
        const link = document.createElement('a')
        link.href = image
        link.download = `Ayush_Card_${patientName.replace(/\s+/g, '_')}.png`
        link.click()
      } catch (err) {
        console.error('Failed to download image', err)
      } finally {
        setIsDownloading(false)
      }
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My AYUSH Card',
          text: `My Universal Health ID: ${ayushId}`,
        })
      } catch (err) {
        console.log('Share was cancelled or failed', err)
      }
    } else {
      alert('Sharing is not supported on this browser.')
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-fade-in-up min-h-[600px] flex flex-col items-center justify-center">
      <div ref={cardRef} className="max-w-md w-full bg-slate-900 rounded-3xl shadow-2xl p-2 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-pink-500/30 opacity-60" />
        <div className="bg-slate-900 rounded-[22px] p-8 relative z-10 text-white flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-lg">AYUSH<span className="text-cyan-400">Card</span></span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Valid ID</p>
              <p className="font-bold text-emerald-400 text-sm">Active</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl shadow-cyan-500/20 transform hover:scale-105 transition-transform duration-500">
            <QRCodeSVG value={qrToken || ''} size={200} level="H" />
          </div>
          
          <div className="text-center w-full bg-white/5 rounded-2xl p-6 backdrop-blur-md border border-white/10">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Universal Health ID</p>
            <p className="font-mono text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {ayushId}
            </p>
            <p className="text-lg font-medium text-white mt-4">{patientName}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
        >
          <Download className="w-5 h-5" /> {isDownloading ? 'Downloading...' : 'Download'}
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 bg-[#00d0c4] hover:bg-teal-400 text-[#0a192f] px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition"
        >
          <Share2 className="w-5 h-5" /> Share ID
        </button>
      </div>
    </div>
  )
}
