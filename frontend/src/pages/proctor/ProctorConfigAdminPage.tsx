import { useState } from 'react'
import { Settings, Sliders, Save, CheckCircle2, Video, Volume2 } from 'lucide-react'

export default function ProctorConfigAdminPage() {
  const [sensitivity, setSensitivity] = useState(8)
  const [headLimit, setHeadLimit] = useState(25)
  const [maxWarnings, setMaxWarnings] = useState(3)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [requireFace, setRequireFace] = useState(true)
  const [requireAudio, setRequireAudio] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSaveConfig = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-container max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Settings className="text-indigo-500" /> Admin EduShield AI Configuration
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Configure global AI proctoring sensitivity, warning thresholds, and security enforcement parameters.
        </p>
      </div>

      <div className="card p-6 space-y-6 border-2 border-indigo-500/30">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sliders size={16} className="text-indigo-400" /> System Sensitivity & Threshold Controls
        </h3>

        <div className="space-y-5 text-xs">
          {/* Eye Sensitivity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span style={{ color: 'var(--text-primary)' }}>MediaPipe Eye Tracking Sensitivity:</span>
              <span className="text-indigo-400 font-mono font-bold">{sensitivity} / 10</span>
            </div>
            <input type="range" min={1} max={10} value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
            <p className="text-2xs text-slate-400">Higher values detect subtle iris movements and off-screen glances instantly.</p>
          </div>

          {/* Head Pose Limit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span style={{ color: 'var(--text-primary)' }}>Head Pose Rotation Limit:</span>
              <span className="text-purple-400 font-mono font-bold">{headLimit}° Degrees</span>
            </div>
            <input type="range" min={10} max={45} value={headLimit} onChange={e => setHeadLimit(Number(e.target.value))} className="w-full accent-purple-600 cursor-pointer" />
          </div>

          {/* Max Warnings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Max Warnings Allowed</label>
              <select value={maxWarnings} onChange={e => setMaxWarnings(Number(e.target.value))} className="input p-3 w-full rounded-xl">
                <option value={1}>1 Warning (Strict)</option>
                <option value={2}>2 Warnings</option>
                <option value={3}>3 Warnings (Standard Default)</option>
                <option value={5}>5 Warnings (Relaxed)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Allowed Tab Switches</label>
              <select value={tabSwitches} onChange={e => setTabSwitches(Number(e.target.value))} className="input p-3 w-full rounded-xl">
                <option value={0}>0 Tab Switches (Zero Tolerance)</option>
                <option value={1}>1 Tab Switch Allowed</option>
                <option value={2}>2 Tab Switches</option>
              </select>
            </div>
          </div>

          {/* Security Enforcements Toggles */}
          <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Biometric & Audio Controls</h4>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-emerald-400" />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Mandatory Facial Recognition Pre-Exam</span>
              </div>
              <input type="checkbox" checked={requireFace} onChange={e => setRequireFace(e.target.checked)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-blue-400" />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Real-time Background Audio & Voice Detection</span>
              </div>
              <input type="checkbox" checked={requireAudio} onChange={e => setRequireAudio(e.target.checked)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          {saved && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 size={16} /> Global Proctor Settings Saved Successfully!
            </span>
          )}
          <button onClick={handleSaveConfig}
            className="ml-auto px-6 py-3 rounded-xl font-extrabold text-xs bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-lg transition-all">
            <Save size={16} /> Save Admin Settings
          </button>
        </div>
      </div>
    </div>
  )
}
