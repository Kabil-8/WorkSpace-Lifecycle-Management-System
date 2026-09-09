import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Calendar, Plus, Trash2, X, Check } from 'lucide-react'
import { api } from '../../services/api'
import { useAppSelector } from '../../hooks/useStore'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const SECTIONS = ['Section A', 'Section B', 'Section C']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const TYPES = ['Lecture', 'Lab', 'Tutorial']
const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#EF4444']

const ROW_HEIGHT = 48 // Compact 48px height per hour slot

export default function TimetablePage() {
  const { user } = useAppSelector(s => s.auth)
  const isFacultyOrAdmin = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')

  const [selectedSection, setSelectedSection] = useState(user?.section || 'Section A')
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 7)
  const [selectedDept, setSelectedDept] = useState(user?.department || 'Computer Science')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state for allocating period slot
  const [day, setDay] = useState(0)
  const [startPeriod, setStartPeriod] = useState(0)
  const [duration, setDuration] = useState(1)
  const [subject, setSubject] = useState('')
  const [room, setRoom] = useState('')
  const [type, setType] = useState<'Lecture' | 'Lab' | 'Tutorial'>('Lecture')
  const [color, setColor] = useState('#2563EB')
  const [instructorName, setInstructorName] = useState(user?.name || '')

  const today = new Date().getDay() - 1 // 0=Mon...4=Fri

  const { data: timetableData, isLoading, refetch } = useQuery({
    queryKey: ['timetable', selectedDept, selectedSemester, selectedSection],
    queryFn: async () => {
      const res: any = await api.get(`/timetable?department=${encodeURIComponent(selectedDept)}&semester=${selectedSemester}&section=${encodeURIComponent(selectedSection)}`)
      return res?.data || res || []
    },
  })

  const classes = Array.isArray(timetableData) ? timetableData : (timetableData?.data || [])

  const handleAllocateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !room.trim()) {
      setFormError('Subject title and room/lab name are required.')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError('')
      await api.post('/timetable', {
        department: selectedDept,
        semester: selectedSemester,
        section: selectedSection,
        day,
        startPeriod,
        duration,
        subject,
        room,
        type,
        color,
        instructorName,
      })

      setIsModalOpen(false)
      setSubject('')
      setRoom('')
      refetch()
    } catch (err: any) {
      setFormError(err?.message || 'Failed to allocate period slot.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this period slot?')) return
    try {
      await api.delete(`/timetable/${id}`)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--indigo)' }} />
        <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>Loading Section Schedule…</p>
      </div>
    )
  }

  return (
    <div className="page-container space-y-4 pb-8">
      {/* Sleek Compact Header & Controls Bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs border"
        style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
        
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
            style={{ background: 'linear-gradient(135deg, var(--indigo), #4338CA)' }}>
            <Calendar size={16} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              Class Schedule
              {user?.isClassTeacher && (
                <span className="px-2 py-0.5 rounded-full text-3xs font-bold font-mono"
                  style={{ background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}>
                  Class Teacher ({selectedSection})
                </span>
              )}
            </h1>
            <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>
              {selectedDept} · Semester {selectedSemester} · {selectedSection}
            </p>
          </div>
        </div>

        {/* Right Filter Selectors & Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-3xs font-bold" style={{ color: 'var(--muted-foreground)' }}>Dept:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <option value="Computer Science">Computer Science</option>
              <option value="AI & ML">AI &amp; ML</option>
              <option value="Data Science">Data Science</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-3xs font-bold" style={{ color: 'var(--muted-foreground)' }}>Sem:</span>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(parseInt(e.target.value, 10))}
              className="text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {SEMESTERS.map(sem => (
                <option key={sem} value={sem}>Sem {sem}</option>
              ))}
            </select>
          </div>

          {isFacultyOrAdmin && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {SECTIONS.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className="px-2.5 py-0.5 rounded text-3xs font-bold transition-all cursor-pointer"
                  style={selectedSection === sec
                    ? { background: 'var(--indigo)', color: '#FFFFFF' }
                    : { color: 'var(--muted-foreground)' }
                  }
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          {isFacultyOrAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg font-bold text-xs text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              style={{ background: 'var(--indigo)' }}
            >
              <Plus size={14} /> Allocate Slot
            </button>
          )}
        </div>
      </motion.div>

      {/* High-Density Timetable Schedule Canvas */}
      {classes.length === 0 ? (
        <div className="p-8 rounded-2xl text-center space-y-2 border border-dashed"
          style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
          <Calendar size={32} className="mx-auto" style={{ color: 'var(--indigo)', opacity: 0.6 }} />
          <h3 className="text-sm font-extrabold" style={{ color: 'var(--foreground)' }}>No Timetable Allocated Yet</h3>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Schedule not published for <strong>{selectedSection}</strong> ({selectedDept} - Semester {selectedSemester}).
          </p>
          {isFacultyOrAdmin && (
            <button onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer mt-2"
              style={{ background: 'var(--indigo)' }}>
              <Plus size={14} /> Allocate Period Slot
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-2xl overflow-x-auto border shadow-xs"
          style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
          <div className="min-w-[760px]">
            
            {/* Day Column Headers */}
            <div className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}>
              <div />
              {DAYS.map((dayName, i) => (
                <div key={dayName} className="text-center py-1.5 rounded-lg text-2xs font-bold transition-all"
                  style={{
                    background: i === today ? 'var(--indigo-muted)' : 'var(--card)',
                    color: i === today ? 'var(--indigo)' : 'var(--foreground)',
                    border: i === today ? '1px solid color-mix(in srgb, var(--indigo) 40%, transparent)' : '1px solid var(--border)',
                  }}>
                  {dayName.slice(0, 3)}
                  {i === today && <span className="inline-block w-1.5 h-1.5 rounded-full ml-1" style={{ background: 'var(--indigo)' }} />}
                </div>
              ))}
            </div>

            {/* Hourly Time Grid */}
            {PERIODS.map((period, periodIdx) => (
              <div key={period} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '60px repeat(6, 1fr)', height: `${ROW_HEIGHT}px` }}>
                
                {/* Time Label */}
                <div className="flex items-center justify-end pr-2">
                  <span className="text-3xs font-mono font-bold" style={{ color: 'var(--muted-foreground)' }}>{period}</span>
                </div>

                {/* Day Columns */}
                {DAYS.map((_, dayIdx) => {
                  const classItem = classes.find((c: any) => c.day === dayIdx && (c.startPeriod ?? c.start) === periodIdx)
                  const isCoveredByPrevious = classes.some((c: any) => c.day === dayIdx && (c.startPeriod ?? c.start) < periodIdx && (c.startPeriod ?? c.start) + c.duration > periodIdx)

                  return (
                    <div key={dayIdx} className="relative rounded-lg border"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', height: `${ROW_HEIGHT}px` }}>
                      
                      {classItem && !isCoveredByPrevious && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-x-0 top-0 rounded-lg p-1.5 z-10 flex flex-col justify-between group shadow-sm overflow-hidden"
                          style={{
                            background: `color-mix(in srgb, ${classItem.color || '#2563EB'} 16%, var(--card))`,
                            border: `1.5px solid ${classItem.color || '#2563EB'}`,
                            height: `${classItem.duration * ROW_HEIGHT + (classItem.duration - 1) * 4}px`,
                          }}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-3xs font-extrabold truncate" style={{ color: 'var(--foreground)' }}>
                                {classItem.subject}
                              </p>
                              {isFacultyOrAdmin && (
                                <button
                                  onClick={() => handleDeleteSlot(classItem._id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity cursor-pointer flex-shrink-0"
                                  title="Delete Slot"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] font-mono truncate" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                              <span className="font-bold truncate">📍 {classItem.room}</span>
                            </div>
                            
                            {classItem.duration > 1 && (
                              <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                                👤 {classItem.instructorName || 'Faculty'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded text-white uppercase tracking-wider"
                              style={{ background: classItem.color || '#2563EB' }}>
                              {classItem.type}
                            </span>
                            <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--muted-foreground)' }}>
                              {classItem.duration}h
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Allocate Class Period Slot */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 w-full max-w-md space-y-3 relative rounded-2xl border shadow-xl"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                  <Plus style={{ color: 'var(--indigo)' }} size={16} /> Allocate Slot — {selectedSection}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <p className="text-3xs font-mono p-2 rounded-lg border"
                  style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)', borderColor: 'color-mix(in srgb, var(--destructive) 30%, transparent)' }}>
                  {formError}
                </p>
              )}

              <form onSubmit={handleAllocateSlot} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Day of Week</label>
                    <select
                      value={day}
                      onChange={e => setDay(parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border outline-none font-bold text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      {DAYS.map((d, idx) => (
                        <option key={d} value={idx}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Start Time</label>
                    <select
                      value={startPeriod}
                      onChange={e => setStartPeriod(parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border outline-none font-bold text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      {PERIODS.map((p, idx) => (
                        <option key={p} value={idx}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Subject Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Systems"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full p-1.5 rounded-lg border outline-none text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Room / Lab Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CS-201 or AI-Lab"
                      value={room}
                      onChange={e => setRoom(e.target.value)}
                      className="w-full p-1.5 rounded-lg border outline-none text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Class Type</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as any)}
                      className="w-full p-1.5 rounded-lg border outline-none font-bold text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      {TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Duration</label>
                    <select
                      value={duration}
                      onChange={e => setDuration(parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border outline-none font-bold text-xs"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={3}>3 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Card Color</label>
                    <div className="flex items-center gap-1 pt-1">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className="w-4 h-4 rounded-full cursor-pointer transition-transform"
                          style={{
                            background: c,
                            transform: color === c ? 'scale(1.25)' : 'scale(1)',
                            border: color === c ? '2px solid white' : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-bold mb-1" style={{ color: 'var(--foreground)' }}>Instructor Name</label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={e => setInstructorName(e.target.value)}
                    className="w-full p-1.5 rounded-lg border outline-none text-xs"
                    style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg font-bold text-xs text-white flex items-center gap-1 cursor-pointer shadow-xs"
                    style={{ background: 'var(--indigo)' }}
                  >
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Allocate Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
