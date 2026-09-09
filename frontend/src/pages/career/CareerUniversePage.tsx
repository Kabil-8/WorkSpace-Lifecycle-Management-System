import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Zap, Clock, Briefcase, BookOpen, Star, ChevronRight, Target, Cpu
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface SkillNode {
  id: string
  label: string
  category: string
  status: 'mastered' | 'learning' | 'target' | 'locked'
  x: number
  y: number
  hoursToLearn?: number
  description: string
  relatedJobs: string[]
  resources: string[]
  connections: string[]
}

// ─── Skill Graph Data ─────────────────────────────────────────────────────────
const skillNodes: SkillNode[] = [
  // Core — center cluster
  { id: 'js', label: 'JavaScript', category: 'Frontend', status: 'mastered', x: 400, y: 300, description: 'Core web programming language. Essential for frontend and full-stack development.', relatedJobs: ['Frontend Dev', 'Full Stack Dev', 'React Dev'], resources: ['MDN Web Docs', 'JavaScript.info', 'Eloquent JS'], connections: ['react', 'node', 'ts'] },
  { id: 'ts', label: 'TypeScript', category: 'Frontend', status: 'mastered', x: 260, y: 220, description: 'Typed superset of JavaScript. Industry standard for large-scale apps.', relatedJobs: ['SDE II', 'Full Stack Dev', 'React Engineer'], resources: ['TypeScript Handbook', 'TS Deep Dive'], connections: ['js', 'react', 'node'] },
  { id: 'react', label: 'React 19', category: 'Frontend', status: 'mastered', x: 540, y: 200, description: 'Leading UI library. Powers apps at Facebook, Instagram, Airbnb, and thousands more.', relatedJobs: ['Frontend Dev', 'React Native Dev', 'UI Engineer'], resources: ['react.dev', 'Epic React', 'Scrimba React'], connections: ['js', 'ts', 'redux', 'nextjs'] },
  { id: 'css', label: 'CSS/Tailwind', category: 'Frontend', status: 'mastered', x: 280, y: 380, description: 'Styling the web. TailwindCSS is now the dominant utility-first approach.', relatedJobs: ['Frontend Dev', 'UI Designer', 'Full Stack'], resources: ['CSS Tricks', 'Tailwind Docs', 'Josh W Comeau'], connections: ['js', 'react'] },

  // Backend cluster
  { id: 'node', label: 'Node.js', category: 'Backend', status: 'mastered', x: 600, y: 360, description: 'JavaScript runtime for building scalable server-side applications and APIs.', relatedJobs: ['Backend Dev', 'Full Stack Dev', 'API Engineer'], resources: ['Node.js Docs', 'Fastify Guide', 'Node Best Practices'], connections: ['js', 'ts', 'mongodb', 'express'] },
  { id: 'express', label: 'Express.js', category: 'Backend', status: 'learning', x: 700, y: 270, description: 'Minimal and flexible Node.js web application framework for building REST APIs.', relatedJobs: ['Backend Dev', 'API Dev', 'Full Stack'], resources: ['Express Docs', 'REST API Design'], connections: ['node', 'mongodb'] },
  { id: 'mongodb', label: 'MongoDB', category: 'Database', status: 'learning', x: 740, y: 400, description: 'Document database for modern applications. Pairs naturally with Node.js.', relatedJobs: ['Backend Dev', 'Full Stack Dev', 'Database Engineer'], resources: ['MongoDB University', 'Mongoose Docs'], connections: ['node', 'express'] },

  // AI/ML cluster
  { id: 'python', label: 'Python', category: 'AI/ML', status: 'mastered', x: 180, y: 300, description: 'The language of Data Science and AI. Essential for ML roles at top companies.', relatedJobs: ['ML Engineer', 'Data Scientist', 'AI Researcher'], resources: ['Python.org', 'Real Python', 'Automate the Boring Stuff'], connections: ['sklearn', 'pytorch', 'pandas'] },
  { id: 'sklearn', label: 'Scikit-Learn', category: 'AI/ML', status: 'learning', x: 90, y: 220, description: 'Industry-standard ML library for classical algorithms and preprocessing pipelines.', relatedJobs: ['ML Engineer', 'Data Scientist'], resources: ['sklearn User Guide', 'ML Mastery'], connections: ['python', 'pandas'] },
  { id: 'pytorch', label: 'PyTorch', category: 'AI/ML', status: 'target', x: 100, y: 380, hoursToLearn: 120, description: 'Deep learning framework used at Meta, Tesla, and most top AI research labs.', relatedJobs: ['ML Engineer', 'AI Researcher', 'Deep Learning Eng'], resources: ['pytorch.org tutorials', 'Fast.ai', 'Deep Learning Book'], connections: ['python', 'sklearn'] },
  { id: 'pandas', label: 'Pandas/NumPy', category: 'AI/ML', status: 'mastered', x: 80, y: 300, description: 'Data manipulation and numerical computing. Foundational for all data work.', relatedJobs: ['Data Scientist', 'Data Analyst', 'ML Engineer'], resources: ['Pandas Docs', '10 min to Pandas'], connections: ['python', 'sklearn'] },

  // DevOps / Cloud
  { id: 'docker', label: 'Docker', category: 'DevOps', status: 'target', x: 660, y: 470, hoursToLearn: 40, description: 'Containerization platform. Required at virtually all modern engineering teams.', relatedJobs: ['DevOps Engineer', 'SRE', 'Full Stack Dev', 'Backend Dev'], resources: ['Docker Docs', 'Play with Docker', 'Docker Deep Dive'], connections: ['node', 'kubernetes'] },
  { id: 'kubernetes', label: 'Kubernetes', category: 'DevOps', status: 'locked', x: 740, y: 500, hoursToLearn: 80, description: 'Container orchestration at scale. Senior-level skill for cloud infrastructure roles.', relatedJobs: ['DevOps Engineer', 'SRE', 'Platform Engineer'], resources: ['k8s.io', 'KodeKloud', 'CKAD Prep'], connections: ['docker'] },
  { id: 'aws', label: 'AWS', category: 'DevOps', status: 'target', x: 580, y: 470, hoursToLearn: 60, description: 'World\'s largest cloud platform. AWS certifications are highly valued by recruiters.', relatedJobs: ['Cloud Engineer', 'Solutions Architect', 'DevOps', 'Backend Dev'], resources: ['AWS Free Tier', 'AWS Skill Builder', 'Adrian Cantrill'], connections: ['docker', 'node'] },

  // Advanced Frontend
  { id: 'nextjs', label: 'Next.js', category: 'Frontend', status: 'learning', x: 460, y: 120, description: 'React framework for production — SSR, SSG, API routes. FAANG companies use it.', relatedJobs: ['Senior Frontend', 'Full Stack', 'React Engineer'], resources: ['nextjs.org docs', 'Lee Rob tutorials'], connections: ['react', 'ts'] },
  { id: 'redux', label: 'Redux Toolkit', category: 'Frontend', status: 'mastered', x: 640, y: 150, description: 'State management at scale. Standard for complex React applications.', relatedJobs: ['Senior Frontend Dev', 'React Engineer'], resources: ['Redux Toolkit Docs', 'Redux Essentials'], connections: ['react', 'ts'] },

  // System Design
  { id: 'sysdesign', label: 'System Design', category: 'Architecture', status: 'target', x: 400, y: 500, hoursToLearn: 100, description: 'Designing scalable distributed systems. Required for Senior SDE and above interviews.', relatedJobs: ['Senior SDE', 'Staff Engineer', 'Solutions Architect'], resources: ['System Design Primer', 'Grokking SD', 'ByteByteGo'], connections: ['mongodb', 'docker', 'aws'] },

  // Testing
  { id: 'testing', label: 'Testing (Jest/Vitest)', category: 'Quality', status: 'learning', x: 300, y: 470, hoursToLearn: 25, description: 'Unit, integration, and E2E testing. Senior roles always require strong testing skills.', relatedJobs: ['QA Engineer', 'Frontend Dev', 'Full Stack Dev'], resources: ['Jest Docs', 'Testing Library', 'Cypress'], connections: ['react', 'node'] },
]

// ─── Color Maps ───────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  mastered: '#F59E0B',
  learning: '#6366F1',
  target: '#3B82F6',
  locked: '#334155',
}

const statusBg: Record<string, string> = {
  mastered: 'rgba(245,158,11,0.15)',
  learning: 'rgba(99,102,241,0.15)',
  target: 'rgba(59,130,246,0.15)',
  locked: 'rgba(51,65,85,0.3)',
}

const categoryColor: Record<string, string> = {
  Frontend: '#6366F1',
  Backend: '#10B981',
  'AI/ML': '#EC4899',
  Database: '#F59E0B',
  DevOps: '#3B82F6',
  Architecture: '#8B5CF6',
  Quality: '#14B8A6',
}

// ─── Legend Item ──────────────────────────────────────────────────────────────
function LegendItem({ status, label }: { status: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ background: statusColor[status] }} />
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ─── Node Component ───────────────────────────────────────────────────────────
function SkillNodeCircle({
  node, selected, onSelect, scale
}: {
  node: SkillNode
  selected: boolean
  onSelect: (n: SkillNode) => void
  scale?: number
}) {
  const r = selected ? Math.round(28 * (scale ? Math.max(0.8, Math.min(1.2, scale)) : 1)) : 22
  const isLocked = node.status === 'locked'

  return (
    <g
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
      onClick={() => !isLocked && onSelect(node)}
    >
      {/* Outer glow ring */}
      {selected && (
        <circle
          cx={node.x} cy={node.y} r={r + 8}
          fill="none"
          stroke={statusColor[node.status]}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.6}
        >
          <animateTransform
            attributeName="transform" type="rotate"
            from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`}
            dur="8s" repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Pulse ring for learning status */}
      {node.status === 'learning' && !selected && (
        <circle cx={node.x} cy={node.y} r={r + 4} fill="none" stroke={statusColor[node.status]} strokeWidth={1} opacity={0.3}>
          <animate attributeName="r" values={`${r + 4};${r + 12};${r + 4}`} dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main circle */}
      <circle
        cx={node.x} cy={node.y} r={r}
        fill={statusBg[node.status]}
        stroke={statusColor[node.status]}
        strokeWidth={selected ? 2.5 : 1.5}
        opacity={isLocked ? 0.4 : 1}
      />

      {/* Mastered star */}
      {node.status === 'mastered' && (
        <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={14} fill="#F59E0B">⭐</text>
      )}
      {node.status === 'locked' && (
        <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={14} fill="#475569">🔒</text>
      )}
      {node.status === 'target' && (
        <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#60A5FA">🎯</text>
      )}
      {node.status === 'learning' && (
        <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#818CF8">⚡</text>
      )}

      {/* Label below */}
      <text
        x={node.x} y={node.y + r + 14}
        textAnchor="middle"
        fontSize={10}
        fontWeight={selected ? 700 : 500}
        fill={selected ? statusColor[node.status] : 'rgba(255,255,255,0.7)'}
      >
        {node.label}
      </text>

      {/* Category pill */}
      {selected && (
        <rect
          x={node.x - 28} y={node.y + r + 22}
          width={56} height={14}
          rx={7} fill={`${categoryColor[node.category]}30`}
        />
      )}
      {selected && (
        <text
          x={node.x} y={node.y + r + 31}
          textAnchor="middle"
          fontSize={8}
          fill={categoryColor[node.category]}
          fontWeight={600}
        >
          {node.category}
        </text>
      )}
    </g>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CareerUniversePage() {
  const [selected, setSelected] = useState<SkillNode | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [filter, setFilter] = useState<string>('All')
  const svgRef = useRef<SVGSVGElement>(null)

  const categories = ['All', 'Frontend', 'Backend', 'AI/ML', 'Database', 'DevOps', 'Architecture', 'Quality']

  const visibleNodes = filter === 'All' ? skillNodes : skillNodes.filter(n => n.category === filter)
  const visibleIds = new Set(visibleNodes.map(n => n.id))

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('g')) return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const onMouseUp = useCallback(() => setDragging(false), [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.min(2.5, Math.max(0.4, s - e.deltaY * 0.001)))
  }, [])

  // Mastered count
  const masteredCount = skillNodes.filter(n => n.status === 'mastered').length
  const learningCount = skillNodes.filter(n => n.status === 'learning').length
  const targetCount = skillNodes.filter(n => n.status === 'target').length

  return (
    <div className="page-container space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #0a0016 0%, #130030 60%, #1e004e 100%)', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className="text-violet-400" />
              <h1 className="text-2xl font-bold text-white">Career Universe</h1>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Your interactive skill constellation map. Click any node to explore learning paths and career outcomes.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}>
                ⭐ {masteredCount} Mastered
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC' }}>
                ⚡ {learningCount} Learning
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93C5FD' }}>
                🎯 {targetCount} Targeted
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.2)' }}>
              🤖 <strong>EDEN Life GPS:</strong> At your current pace, you'll qualify for Senior Dev roles in ~14 months. Add Docker & PyTorch to accelerate by 3 months.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: filter === cat
                ? (cat === 'All' ? 'linear-gradient(135deg, #7C3AED, #6366F1)' : `${categoryColor[cat]}25`)
                : 'rgba(255,255,255,0.05)',
              color: filter === cat
                ? (cat === 'All' ? '#fff' : (categoryColor[cat] || '#fff'))
                : 'rgba(255,255,255,0.5)',
              border: `1px solid ${filter === cat ? (cat === 'All' ? 'rgba(124,58,237,0.4)' : `${categoryColor[cat]}40`) : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* SVG Canvas */}
        <div className="flex-1 relative rounded-2xl overflow-hidden"
          style={{ height: 520, background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, rgba(0,0,0,0) 70%), rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Legend */}
          <div className="absolute top-3 left-3 flex gap-3 flex-wrap z-10 bg-black/40 backdrop-blur-sm rounded-xl p-2.5">
            <LegendItem status="mastered" label="Mastered" />
            <LegendItem status="learning" label="Learning" />
            <LegendItem status="target" label="Target" />
            <LegendItem status="locked" label="Locked" />
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 left-3 z-10 flex gap-2">
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
              className="w-8 h-8 rounded-lg text-white text-lg font-bold flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>+</button>
            <button onClick={() => setScale(s => Math.max(0.4, s - 0.15))}
              className="w-8 h-8 rounded-lg text-white text-lg font-bold flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>−</button>
            <button onClick={() => { setPan({ x: 0, y: 0 }); setScale(1) }}
              className="h-8 px-3 rounded-lg text-xs text-white font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>Reset</button>
          </div>

          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
              {/* Edges */}
              {skillNodes.map(node =>
                node.connections.map(targetId => {
                  const target = skillNodes.find(n => n.id === targetId)
                  if (!target) return null
                  if (!visibleIds.has(node.id) || !visibleIds.has(targetId)) return null
                  const isHighlighted = selected?.id === node.id || selected?.id === targetId
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={node.x} y1={node.y}
                      x2={target.x} y2={target.y}
                      stroke={isHighlighted ? statusColor[node.status] : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '0' : '4 4'}
                      opacity={isHighlighted ? 0.7 : 0.5}
                    />
                  )
                })
              )}

              {/* Nodes */}
              {visibleNodes.map(node => (
                <SkillNodeCircle
                  key={node.id}
                  node={node}
                  selected={selected?.id === node.id}
                  onSelect={setSelected}
                  scale={scale}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 300 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="rounded-2xl flex-shrink-0 overflow-hidden"
              style={{ width: 300, background: 'rgba(255,255,255,0.03)', border: `1px solid ${statusColor[selected.status]}30` }}
            >
              <div className="p-5 space-y-4 overflow-y-auto h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor[selected.status] }} />
                      <span className="text-xs font-medium capitalize" style={{ color: statusColor[selected.status] }}>
                        {selected.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selected.label}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ background: `${categoryColor[selected.category]}15`, color: categoryColor[selected.category] }}>
                      {selected.category}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <X size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {selected.description}
                </p>

                {/* Hours to learn */}
                {selected.hoursToLearn && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Clock size={14} className="text-blue-400 flex-shrink-0" />
                    <span className="text-xs" style={{ color: '#93C5FD' }}>
                      ~{selected.hoursToLearn} hours to learn
                    </span>
                  </div>
                )}

                {/* Related Jobs */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Briefcase size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Related Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.relatedJobs.map(job => (
                      <span key={job} className="text-2xs px-2 py-1 rounded-lg"
                        style={{ background: `${statusColor[selected.status]}10`, color: statusColor[selected.status], border: `1px solid ${statusColor[selected.status]}20` }}>
                        {job}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Learning Resources */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Top Resources</span>
                  </div>
                  <div className="space-y-1.5">
                    {selected.resources.map(res => (
                      <div key={res} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Star size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Skills */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Connected Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.connections.map(connId => {
                      const connNode = skillNodes.find(n => n.id === connId)
                      if (!connNode) return null
                      return (
                        <button key={connId}
                          onClick={() => setSelected(connNode)}
                          className="text-2xs px-2 py-1 rounded-lg transition-all hover:scale-105"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {connNode.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* CTA */}
                {selected.status !== 'mastered' && (
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${statusColor[selected.status]}, ${statusColor[selected.status]}80)` }}>
                    {selected.status === 'target' ? (
                      <><Target size={14} /> Start Learning</>
                    ) : (
                      <><ChevronRight size={14} /> Continue Learning</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom tip */}
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        🖱 Drag to pan · Scroll to zoom · Click nodes to explore · Locked nodes unlock as you progress
      </p>
    </div>
  )
}
