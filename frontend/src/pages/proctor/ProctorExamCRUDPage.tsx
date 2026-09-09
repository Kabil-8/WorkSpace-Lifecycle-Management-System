import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Clock, X, Settings, HelpCircle, Save, CheckCircle2 } from 'lucide-react'
import { ProctorService } from '../../services/proctorService'

export default function ProctorExamCRUDPage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [description, setDescription] = useState('')

  // Questions State
  const [questions, setQuestions] = useState<any[]>([
    { id: 'q1', text: 'Explain the average time complexity of QuickSort vs MergeSort with memory overhead analysis.', type: 'short_answer', correctAnswer: 'QuickSort is O(N log N) average, MergeSort is O(N log N) guaranteed but takes O(N) auxiliary space.', points: 25 },
    { id: 'q2', text: 'Which data structure is optimal for implementing Breadth-First Search (BFS)?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Binary Search Tree'], correctAnswer: 'Queue', points: 25 },
    {
      id: 'q3',
      text: 'Write a function in Python to find Two Sum indices in an array.',
      type: 'coding',
      language: 'python',
      starterCode: 'def solution(nums, target):\n    # Write algorithm here\n    pass',
      visibleTestCases: [
        { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', isHidden: false }
      ],
      hiddenTestCases: [
        { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', isHidden: true },
        { input: 'nums = [3, 3], target = 6', output: '[0, 1]', isHidden: true }
      ],
      points: 50
    },
  ])

  // Real-Time Socket Integration
  useEffect(() => {
    loadExams()
    const socket = ProctorService.getSocket()

    socket.on('exam:created', (newExam: any) => {
      setExams(prev => [newExam, ...prev.filter(e => e._id !== newExam._id)])
    })

    socket.on('exam:updated', (updatedExam: any) => {
      setExams(prev => prev.map(e => e._id === updatedExam._id ? updatedExam : e))
    })

    socket.on('exam:deleted', (examId: string) => {
      setExams(prev => prev.filter(e => e._id !== examId))
    })

    return () => {
      socket.off('exam:created')
      socket.off('exam:updated')
      socket.off('exam:deleted')
    }
  }, [])

  const loadExams = async () => {
    setLoading(true)
    const data = await ProctorService.fetchExams()
    setExams(data)
    setLoading(false)
  }

  const handleOpenCreateModal = () => {
    setEditingExamId(null)
    setTitle('')
    setSubject('')
    setDepartment('Computer Science & Engineering')
    setDurationMinutes(60)
    setPassingScore(70)
    setDescription('')
    setQuestions([
      { id: 'q1', text: 'Explain key difference between TCP and UDP protocols.', type: 'short_answer', correctAnswer: 'TCP is connection-oriented, UDP is connectionless.', points: 25 },
      { id: 'q2', text: 'Which data structure is optimal for BFS?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Heap'], correctAnswer: 'Queue', points: 25 },
      {
        id: 'q3',
        text: 'Write a python function solution(nums) returning duplicate numbers.',
        type: 'coding',
        language: 'python',
        starterCode: 'def solution(nums):\n    # Return duplicate elements\n    return []',
        visibleTestCases: [{ input: '[1,2,3,1]', output: '[1]', isHidden: false }],
        hiddenTestCases: [{ input: '[1,1,1,3,3,4,3,2,4,2]', output: '[1, 3, 4, 2]', isHidden: true }],
        points: 50
      }
    ])
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (exam: any) => {
    setEditingExamId(exam._id)
    setTitle(exam.title)
    setSubject(exam.subject)
    setDepartment(exam.department || 'Computer Science & Engineering')
    setDurationMinutes(exam.durationMinutes || 60)
    setPassingScore(exam.passingScore || 70)
    setDescription(exam.description || '')
    setQuestions(exam.questions || [])
    setIsModalOpen(true)
  }

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q${prev.length + 1}`,
        text: 'Enter question prompt...',
        type: 'short_answer',
        correctAnswer: '',
        points: 25
      }
    ])
  }

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const handleQuestionTypeChange = (idx: number, type: string) => {
    const updated = [...questions]
    updated[idx].type = type
    if (type === 'multiple_choice' || type === 'true_false') {
      updated[idx].options = type === 'true_false' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D']
      updated[idx].correctAnswer = updated[idx].options[0]
    } else if (type === 'coding') {
      updated[idx].options = undefined
      updated[idx].language = updated[idx].language || 'python'
      updated[idx].starterCode = updated[idx].starterCode || 'def solution(nums):\n    # Write algorithm here\n    pass'
      updated[idx].visibleTestCases = updated[idx].visibleTestCases || [
        { input: '[2, 7, 11, 15], 9', output: '[0, 1]', isHidden: false }
      ]
      updated[idx].hiddenTestCases = updated[idx].hiddenTestCases || [
        { input: '[3, 2, 4], 6', output: '[1, 2]', isHidden: true },
        { input: '[3, 3], 6', output: '[0, 1]', isHidden: true }
      ]
    } else {
      updated[idx].options = undefined
    }
    setQuestions(updated)
  }

  const handleSaveExam = async () => {
    if (!title || !subject) return

    const payload = {
      title,
      subject,
      department,
      durationMinutes,
      passingScore,
      description,
      questions,
      proctorConfig: {
        eyeTrackingSensitivity: 8,
        maxWarningsAllowed: 3,
        allowedTabSwitches: 0,
        requireFacialVerification: true,
        requireAudioMonitoring: true
      }
    }

    const socket = ProctorService.getSocket()

    try {
      if (editingExamId) {
        const res = await fetch(`http://localhost:5000/api/proctor/exams/${editingExamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          socket.emit('exam:update', data.data)
        }
      } else {
        const res = await fetch('http://localhost:5000/api/proctor/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          socket.emit('exam:create', data.data)
        }
      }
    } catch (err) {
      console.warn('Backend API offline, emitting real-time event locally', err)
      const localExam = { _id: editingExamId || `exam-${Date.now()}`, ...payload }
      socket.emit(editingExamId ? 'exam:update' : 'exam:create', localExam)
    }

    setIsModalOpen(false)
    loadExams()
  }

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this proctored exam?')) return
    const socket = ProctorService.getSocket()
    try {
      await fetch(`http://localhost:5000/api/proctor/exams/${examId}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.warn('Backend API offline, deleting locally', err)
    }
    socket.emit('exam:delete', examId)
    setExams(prev => prev.filter(e => e._id !== examId))
  }

  return (
    <div className="page-container space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl border-2 border-indigo-500/30"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-2xs font-bold font-mono">
              PROCTORING MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">EduShield Examination CRUD Hub</h1>
          <p className="text-xs text-indigo-200">
            Create, edit, and configure live proctored exams with Question Pools, Coding Sandbox test cases, and AI Eye/Face verification rules.
          </p>
        </div>

        <button onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer">
          <Plus size={16} /> Create Proctored Exam
        </button>
      </motion.div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading Proctored Examinations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => (
            <motion.div key={exam._id} whileHover={{ y: -3 }} className="card p-6 flex flex-col justify-between space-y-4 border-2 border-indigo-500/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold px-3 py-1 rounded-full uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {exam.department}
                  </span>
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={14} /> {exam.durationMinutes} Mins
                  </span>
                </div>

                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{exam.title}</h3>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{exam.description}</p>

                <div className="flex items-center gap-4 text-xs font-semibold pt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>Questions: {exam.questions?.length || 0}</span>
                  <span>Passing Score: {exam.passingScore}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="text-2xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> AI Proctor Room Active
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEditModal(exam)}
                    className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/30">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteExam(exam._id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/30">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="card p-6 max-w-2xl w-full my-8 space-y-5 border-2 border-indigo-500/40 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--card)', color: 'var(--card-foreground)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--card-foreground)' }}>
                  <Settings className="text-indigo-500" /> {editingExamId ? 'Edit Proctored Exam' : 'Create New Proctored Exam'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-indigo-500 cursor-pointer"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-xs" style={{ color: 'var(--card-foreground)' }}>Exam Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CS401: Algorithms Exam" className="input p-3 w-full rounded-xl font-medium" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-xs" style={{ color: 'var(--card-foreground)' }}>Subject *</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Computer Science" className="input p-3 w-full rounded-xl font-medium" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-xs" style={{ color: 'var(--card-foreground)' }}>Duration (Minutes)</label>
                  <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="input p-3 w-full rounded-xl font-medium" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-xs" style={{ color: 'var(--card-foreground)' }}>Passing Score (%)</label>
                  <input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="input p-3 w-full rounded-xl font-medium" />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-xs" style={{ color: 'var(--card-foreground)' }}>Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Exam instructions and proctoring guidelines..." className="input p-3 text-xs w-full rounded-xl font-medium" />
              </div>

              {/* Questions Section Builder */}
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--card-foreground)' }}>
                    <HelpCircle size={14} className="text-indigo-500" /> Question Pool Builder ({questions.length})
                  </h4>
                  <button onClick={handleAddQuestion} className="btn btn-sm btn-primary cursor-pointer shadow-md">
                    + Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isMcq = q.type === 'multiple_choice' || q.type === 'true_false'
                    return (
                      <div key={idx} className="p-4 rounded-xl space-y-3 text-xs border shadow-sm" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-500">Q{idx + 1} Prompt:</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={q.type || 'short_answer'}
                              onChange={e => handleQuestionTypeChange(idx, e.target.value)}
                              className="input text-2xs p-1.5 rounded-lg font-semibold"
                              style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
                              <option value="multiple_choice">Multiple Choice (MCQ)</option>
                              <option value="true_false">True / False</option>
                              <option value="short_answer">Short Answer (Written)</option>
                              <option value="essay">Essay / Subjective</option>
                              <option value="coding">Coding Problem</option>
                            </select>
                            <button onClick={() => handleRemoveQuestion(idx)} className="text-red-500 text-2xs font-bold hover:underline cursor-pointer">Remove</button>
                          </div>
                        </div>

                        <input type="text" value={q.text} onChange={e => {
                          const updated = [...questions]
                          updated[idx].text = e.target.value
                          setQuestions(updated)
                        }} placeholder="Enter question prompt..." className="input p-2.5 w-full rounded-lg text-xs font-medium" />

                        {/* If MCQ */}
                        {isMcq && q.options && (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <input key={optIdx} type="text" value={opt} onChange={e => {
                                const updated = [...questions]
                                updated[idx].options[optIdx] = e.target.value
                                setQuestions(updated)
                              }} placeholder={`Option ${String.fromCharCode(65 + optIdx)}`} className="input p-2 text-2xs rounded-lg font-medium" />
                            ))}
                          </div>
                        )}

                        {/* If Coding Question */}
                        {q.type === 'coding' && (
                          <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-2xs block mb-1" style={{ color: 'var(--card-foreground)' }}>
                                  Target Language
                                </label>
                                <select
                                  value={q.language || 'python'}
                                  onChange={e => {
                                    const updated = [...questions]
                                    updated[idx].language = e.target.value
                                    setQuestions(updated)
                                  }}
                                  className="input text-2xs p-2 rounded-lg w-full font-mono"
                                  style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
                                  <option value="python">Python 3</option>
                                  <option value="javascript">JavaScript (Node.js)</option>
                                  <option value="cpp">C++ (GCC)</option>
                                  <option value="java">Java 17</option>
                                </select>
                              </div>

                              <div>
                                <label className="font-bold text-2xs block mb-1" style={{ color: 'var(--card-foreground)' }}>
                                  Question Points
                                </label>
                                <input
                                  type="number"
                                  value={q.points || 25}
                                  onChange={e => {
                                    const updated = [...questions]
                                    updated[idx].points = Number(e.target.value)
                                    setQuestions(updated)
                                  }}
                                  className="input text-2xs p-2 rounded-lg w-full font-medium"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-2xs block mb-1" style={{ color: 'var(--card-foreground)' }}>
                                Starter Code Template
                              </label>
                              <textarea
                                rows={3}
                                value={q.starterCode || ''}
                                onChange={e => {
                                  const updated = [...questions]
                                  updated[idx].starterCode = e.target.value
                                  setQuestions(updated)
                                }}
                                placeholder="e.g. def solution(nums, target):&#10;    # Write algorithm here&#10;    pass"
                                className="textarea p-2.5 w-full rounded-lg text-2xs font-mono"
                                style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                              />
                            </div>

                            {/* Visible Test Cases */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-2xs text-emerald-500">
                                  Visible Test Cases (Public to Student)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...questions]
                                    const vis = updated[idx].visibleTestCases || []
                                    updated[idx].visibleTestCases = [...vis, { input: '', output: '', isHidden: false }]
                                    setQuestions(updated)
                                  }}
                                  className="text-2xs font-bold text-emerald-500 hover:underline cursor-pointer">
                                  + Add Visible Case
                                </button>
                              </div>
                              {(q.visibleTestCases || []).map((tc: any, tcIdx: number) => (
                                <div key={tcIdx} className="grid grid-cols-12 gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Input: e.g. [2,7,11,15], 9"
                                    value={tc.input}
                                    onChange={e => {
                                      const updated = [...questions]
                                      updated[idx].visibleTestCases[tcIdx].input = e.target.value
                                      setQuestions(updated)
                                    }}
                                    className="col-span-5 input p-2 text-2xs font-mono rounded-lg"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Expected Output: e.g. [0,1]"
                                    value={tc.output}
                                    onChange={e => {
                                      const updated = [...questions]
                                      updated[idx].visibleTestCases[tcIdx].output = e.target.value
                                      setQuestions(updated)
                                    }}
                                    className="col-span-6 input p-2 text-2xs font-mono rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...questions]
                                      updated[idx].visibleTestCases = updated[idx].visibleTestCases.filter((_: any, i: number) => i !== tcIdx)
                                      setQuestions(updated)
                                    }}
                                    className="col-span-1 text-red-500 text-xs font-bold hover:underline cursor-pointer">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Hidden Test Cases */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-2xs text-purple-500">
                                  Hidden Test Cases (Grading / Automated Evaluation)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...questions]
                                    const hid = updated[idx].hiddenTestCases || []
                                    updated[idx].hiddenTestCases = [...hid, { input: '', output: '', isHidden: true }]
                                    setQuestions(updated)
                                  }}
                                  className="text-2xs font-bold text-purple-500 hover:underline cursor-pointer">
                                  + Add Hidden Case
                                </button>
                              </div>
                              {(q.hiddenTestCases || []).map((tc: any, tcIdx: number) => (
                                <div key={tcIdx} className="grid grid-cols-12 gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Hidden Input: e.g. [3,2,4], 6"
                                    value={tc.input}
                                    onChange={e => {
                                      const updated = [...questions]
                                      updated[idx].hiddenTestCases[tcIdx].input = e.target.value
                                      setQuestions(updated)
                                    }}
                                    className="col-span-5 input p-2 text-2xs font-mono rounded-lg"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Hidden Output: e.g. [1,2]"
                                    value={tc.output}
                                    onChange={e => {
                                      const updated = [...questions]
                                      updated[idx].hiddenTestCases[tcIdx].output = e.target.value
                                      setQuestions(updated)
                                    }}
                                    className="col-span-6 input p-2 text-2xs font-mono rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...questions]
                                      updated[idx].hiddenTestCases = updated[idx].hiddenTestCases.filter((_: any, i: number) => i !== tcIdx)
                                      setQuestions(updated)
                                    }}
                                    className="col-span-1 text-red-500 text-xs font-bold hover:underline cursor-pointer">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* If Non-MCQ & Non-Coding */}
                        {!isMcq && q.type !== 'coding' && (
                          <textarea rows={2} value={q.correctAnswer || ''} onChange={e => {
                            const updated = [...questions]
                            updated[idx].correctAnswer = e.target.value
                            setQuestions(updated)
                          }} placeholder="Model answer or key terms for evaluation..." className="input p-2.5 w-full rounded-lg text-2xs font-mono" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Modal Save Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSaveExam} className="btn btn-primary text-xs font-extrabold flex items-center gap-2 shadow-lg cursor-pointer">
                  <Save size={14} /> Save Proctored Exam
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
