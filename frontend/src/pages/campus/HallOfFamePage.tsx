import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Award } from 'lucide-react'
import { hallOfFameService } from '../../services/hallOfFameService'
import EmptyState from '../../components/common/EmptyState'

export default function HallOfFamePage() {
  const { data: hofDataRaw, isLoading } = useQuery({
    queryKey: ['hallOfFameData'],
    queryFn: hallOfFameService.getAll,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    )
  }

  const list = Array.isArray(hofDataRaw) ? hofDataRaw : (hofDataRaw?.data || [])

  if (list.length === 0) {
    return <EmptyState title="No Hall of Fame Honors" description="No campus achievements or Hall of Fame honors recorded in MongoDB yet." />
  }

  return (
    <div className="page-container space-y-6">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Hall of Fame & Campus Honors</h1>
        <p className="text-sm text-slate-400">Live MongoDB Campus Achievers, Hackathon Winners & Alumni Spotlights</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((item: any, idx: number) => (
          <motion.div
            key={item._id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card p-5 border-2 border-amber-500/20 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.achieverName} className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                    <Award size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">{item.achieverName} · {item.department} ({item.batch || '2026'})</p>
                </div>
              </div>
              <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-2xs text-slate-400 font-mono">
              <span>Award: {item.awardName || 'Honorable Mention'}</span>
              <span>{new Date(item.achievementDate || Date.now()).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
