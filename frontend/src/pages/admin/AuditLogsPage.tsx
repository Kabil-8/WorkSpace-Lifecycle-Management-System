import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../lib/utils'
import { useAppDispatch } from '../../hooks/useStore'
import { addToast } from '../../store/uiSlice'

const SEVERITY_COLORS: Record<string, string> = { info: '#2563EB', warning: '#F59E0B', error: '#EF4444', critical: '#DC2626' }

export default function AuditLogsPage() {
  const dispatch = useAppDispatch()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [clearing, setClearing] = useState(false)

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['adminAuditLogs', page, severityFilter],
    queryFn: () => adminService.getAuditLogs({
      page,
      severity: severityFilter !== 'all' ? severityFilter : undefined,
    }),
  })

  const logs = Array.isArray(logsData) ? logsData : (logsData?.data || [])
  const total = logsData?.total || logs.length || 500

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all non-critical audit logs?')) return
    setClearing(true)
    try {
      await adminService.clearAuditLogs()
      dispatch(addToast({ type: 'success', title: 'Logs Cleared', description: 'Non-critical audit logs cleared successfully!' }))
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error Clearing Logs', description: err.message || 'Failed to clear logs' }))
    }
 finally {
      setClearing(false)
    }
  }

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} Real Audit Log entries recorded in MongoDB</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input text-xs w-36 capitalize">
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          <button onClick={handleClearLogs} disabled={clearing} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500/30">
            {clearing ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Clear Old Logs
          </button>
        </div>
      </motion.div>

      <div className="card overflow-hidden border border-slate-200 dark:border-white/10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Description</th><th>IP Address</th><th>Severity</th></tr>
            </thead>
            <tbody>
              {logs.map((log: any, i: number) => (
                <tr key={log._id || log.id || i} style={{ borderLeft: `3px solid ${SEVERITY_COLORS[log.severity] || '#2563EB'}` }}>
                  <td className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(new Date(log.createdAt || Date.now()))}</td>
                  <td>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{log.actorName || 'System'}</p>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 capitalize">{log.actorRole || 'system'}</p>
                  </td>
                  <td>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {(log.action || 'ACTION').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate">{log.description}</td>
                  <td className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  <td>
                    <span className="text-2xs px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: `${SEVERITY_COLORS[log.severity] || '#2563EB'}15`, color: SEVERITY_COLORS[log.severity] || '#2563EB' }}>
                      {log.severity || 'info'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
