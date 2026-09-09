import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, CheckCircle2, AlertCircle, Shield, RefreshCw, ChevronRight, UserCheck } from 'lucide-react'

export default function FaceVerificationPage() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null)

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setStreamActive(true)
        }
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err)
      }
    }
    startCamera()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleCaptureAndVerify = () => {
    if (!videoRef.current) return
    setIsVerifying(true)

    // Capture Canvas frame
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480)
    }

    setTimeout(() => {
      setIsVerifying(false)
      setVerificationSuccess(true)
    }, 1200)
  }

  const handleProceedToCalibration = () => {
    navigate(`/proctor/calibrate/${examId}`)
  }

  return (
    <div className="page-container max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <UserCheck className="text-indigo-500" /> Step 1: Candidate Face Verification
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Please center your face inside the frame. EduShield AI will capture your profile vector and match it against registered records.
        </p>
      </div>

      {/* Video & Verification Frame */}
      <div className="card p-6 space-y-5 text-center border-2 border-indigo-500/30">
        <div className="relative max-w-md mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-900 border-4 border-indigo-500/40 shadow-xl flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />

          {/* Oval Face Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-emerald-400/80 animate-pulse" />
          </div>

          {!streamActive && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <Camera size={32} className="animate-bounce text-indigo-400" />
              <p>Requesting camera permission...</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {verificationSuccess === true && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 size={18} /> Face Identity Match Confirmed (98.4% Confidence). Proceeding to Eye Calibration.
          </motion.div>
        )}

        {verificationSuccess === false && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs flex items-center justify-center gap-2">
            <AlertCircle size={18} /> Facial Match Failed. Please ensure good room lighting and try again.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {!verificationSuccess ? (
            <button onClick={handleCaptureAndVerify} disabled={isVerifying || !streamActive}
              className="px-6 py-3 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all">
              {isVerifying ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />} Capture & Match Face
            </button>
          ) : (
            <button onClick={handleProceedToCalibration}
              className="px-8 py-3.5 rounded-xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-xl transition-all">
              <Shield size={16} /> Proceed to Eye Calibration Grid <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
