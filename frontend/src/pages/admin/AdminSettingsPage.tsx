import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Sun, Moon, Monitor, Palette, Save, Sliders, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { setTheme, setAccentColor, addToast } from '../../store/uiSlice'
import type { ThemeMode, AccentColor } from '../../types'
import { adminService } from '../../services/adminService'

const ACCENTS: { value: AccentColor; color: string; label: string }[] = [
  { value: 'blue', color: '#2563EB', label: 'Blue' }, { value: 'purple', color: '#8B5CF6', label: 'Purple' },
  { value: 'cyan', color: '#06B6D4', label: 'Cyan' }, { value: 'green', color: '#10B981', label: 'Green' },
  { value: 'orange', color: '#F97316', label: 'Orange' }, { value: 'pink', color: '#EC4899', label: 'Pink' },
]

export default function AdminSettingsPage() {
  const dispatch = useAppDispatch()
  const { theme, accentColor } = useAppSelector(s => s.ui)

  // System Settings State
  const [siteName, setSiteName] = useState('EduSphere Academic OS')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)
  const [proctoringSensitivity, setProctoringSensitivity] = useState('high')
  const [aiCopilotEnabled, setAiCopilotEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: adminService.getSettings,
  })

  useEffect(() => {
    const s = settingsData?.data || settingsData
    if (s && s.siteName) {
      setSiteName(s.siteName)
      setMaintenanceMode(!!s.maintenanceMode)
      setAllowRegistration(!!s.allowRegistration)
      setMaxLoginAttempts(s.maxLoginAttempts || 5)
      setProctoringSensitivity(s.proctoringSensitivity || 'high')
      setAiCopilotEnabled(!!s.aiCopilotEnabled)
    }
  }, [settingsData])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await adminService.updateSettings({
        siteName,
        maintenanceMode,
        allowRegistration,
        maxLoginAttempts,
        proctoringSensitivity,
        aiCopilotEnabled,
      })
      dispatch(addToast({ type: 'success', title: 'Settings Saved', description: 'System Settings saved successfully to MongoDB Atlas!' }))
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Save Failed', description: err.message || 'Failed to save settings' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings & Preferences</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage platform-wide security thresholds, AI availability, and appearance</p>
      </motion.div>

      {/* System Administration Settings */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders size={18} className="text-emerald-500 dark:text-emerald-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white">System Administration & Security</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Platform Site Name</label>
              <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="input text-xs w-full mt-1 p-2.5" />
            </div>

            <div>
              <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Proctoring Sensitivity</label>
              <select value={proctoringSensitivity} onChange={e => setProctoringSensitivity(e.target.value)} className="input text-xs w-full mt-1 p-2.5">
                <option value="low">Low (Basic Focus Check)</option>
                <option value="medium">Medium (Standard Proctoring)</option>
                <option value="high">High (Strict AI Eye-Tracking & Head Pose)</option>
                <option value="strict">Strict (Zero Tolerance Locks)</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Max Login Attempts</label>
              <input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))} className="input text-xs w-full mt-1 p-2.5" />
            </div>

            <div className="flex flex-col justify-center space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-white font-medium">Maintenance Mode</span>
                <button onClick={() => setMaintenanceMode(p => !p)} className={`w-10 h-5 rounded-full relative transition-all ${maintenanceMode ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${maintenanceMode ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-white font-medium">Allow New Registration</span>
                <button onClick={() => setAllowRegistration(p => !p)} className={`w-10 h-5 rounded-full relative transition-all ${allowRegistration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${allowRegistration ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-white font-medium">EDEN AI Copilot System</span>
                <button onClick={() => setAiCopilotEnabled(p => !p)} className={`w-10 h-5 rounded-full relative transition-all ${aiCopilotEnabled ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${aiCopilotEnabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2 mb-4"><Palette size={18} className="text-purple-500 dark:text-purple-400" /><h2 className="font-semibold text-slate-900 dark:text-white">Appearance & Theme</h2></div>

        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['system', 'System', Monitor]] as [ThemeMode, string, React.ElementType][]).map(([val, label, Icon]) => (
              <button key={val} onClick={() => dispatch(setTheme(val))}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={theme === val
                  ? { background: 'color-mix(in srgb, var(--primary) 15%, transparent)', border: '2px solid color-mix(in srgb, var(--primary) 40%, transparent)', color: 'var(--primary)' }
                  : { background: 'var(--accent)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Accent Color</p>
          <div className="flex gap-3">
            {ACCENTS.map(({ value, color, label }) => (
              <button key={value} onClick={() => dispatch(setAccentColor(value))} title={label}
                className="w-8 h-8 rounded-full transition-all cursor-pointer hover:scale-110"
                style={{ background: color, outline: accentColor === value ? `3px solid ${color}` : 'none', outlineOffset: '3px' }} />
            ))}
          </div>
        </div>
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        disabled={saving}
        onClick={handleSaveSettings}
        className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        style={{ background: 'var(--accent-gradient)' }}>
        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Settings
      </motion.button>
    </div>
  )
}
