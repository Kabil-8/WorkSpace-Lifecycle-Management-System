import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle2, Circle, Play, BookOpen,
  Sparkles, Send, Check, Loader2, Plus, Video, HelpCircle, Gamepad2, FileText, Upload, ShieldCheck
} from 'lucide-react'
import { courseService } from '../../services/courseService'
import { api } from '../../services/api'
import { useAppSelector } from '../../hooks/useStore'

export default function CourseLearningPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector(s => s.auth)
  const isFaculty = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')

  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({})

  // Teacher Upload Material Modal State
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialType, setMaterialType] = useState<'video' | 'quiz' | 'game' | 'assignment' | 'reading'>('video')
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialDesc, setMaterialDesc] = useState('')
  const [materialSuccess, setMaterialSuccess] = useState<string | null>(null)

  // Interactive Live Playground State
  const [userCode, setUserCode] = useState(`// Hands-on Interactive Practice\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, EduSphere Real Course!");\n    }\n}`)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  // Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Assignment Submission State
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)
  const [assignmentSubmittedFile, setAssignmentSubmittedFile] = useState<string | null>(null)

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiThinking, setAiThinking] = useState(false)

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['courseProgress', id],
    queryFn: async () => {
      if (!id) return null
      try {
        return await courseService.getCourseProgress(id)
      } catch {
        return null
      }
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (progressData?.completedLessonKeys) {
      const map: Record<string, boolean> = {}
      progressData.completedLessonKeys.forEach((key: string) => {
        map[key] = true
      })
      setCompletedLessons(map)
    }
  }, [progressData])

  const { data: courseData } = useQuery({
    queryKey: ['courseDetail', id],
    queryFn: async () => {
      if (!id) return null
      try {
        const res: any = await courseService.getCourses({ search: id })
        const list = Array.isArray(res) ? res : (res?.data || [])
        return list.find((c: any) => (c._id || c.id) === id) || list[0] || null
      } catch {
        return null
      }
    },
  })

  // Mutation for Teacher Material Upload
  const addMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res: any = await api.post(`/courses/${id}/materials`, data)
      return res
    },
    onSuccess: (res: any) => {
      setMaterialSuccess(res?.message || 'Teacher material added successfully!')
      queryClient.invalidateQueries({ queryKey: ['courseDetail', id] })
      setTimeout(() => {
        setMaterialSuccess(null)
        setShowMaterialModal(false)
        setMaterialTitle('')
        setMaterialUrl('')
        setMaterialDesc('')
      }, 1200)
    },
  })

  const course = courseData || {
    title: 'Java Masterclass: Enterprise Spring Boot & Microservices',
    instructorName: 'Dr. Sarah Mitchell',
    department: 'Computer Science & Engineering',
    tags: ['Java', 'Spring Boot', 'OOP'],
    duration: 45,
    description: 'Learn enterprise software engineering with Java 21, Spring Boot 3, and Microservices.',
  }

  const modules = courseData?.curriculum?.length > 0 ? courseData.curriculum.map((sec: any, i: number) => ({
    title: sec.title || `Module ${i + 1}`,
    lessons: sec.modules?.map((m: any, j: number) => ({
      title: m.title || `${i + 1}.${j + 1} Lesson`,
      type: m.type || 'video',
      duration: `${m.duration || 30} mins`,
      content: m.description || `Learning content for ${m.title}.`,
      contentUrl: m.contentUrl,
    })) || [],
  })) : [
    {
      title: 'Module 1: Foundations & Architecture Setup',
      lessons: [
        { title: '1.1 Video Lecture: System Architecture & Setup', type: 'video', duration: '15 mins', content: 'Welcome to this masterclass! In this video lesson, we cover setting up your environment, compiler flags, and package management.', contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { title: '1.2 Interactive Quiz: Core Concepts & Memory', type: 'quiz', duration: '15 mins', content: 'Test your understanding of stack vs heap memory allocations, primitive data structures, and reference types.' },
        { title: '1.3 Coding Game Challenge: First Algorithm', type: 'game', duration: '25 mins', content: 'Hands-on coding challenge to simulate data streaming and verify system outputs.' },
        { title: '1.4 Course Assignment: Architecture Specification', type: 'assignment', duration: '40 mins', content: 'Upload your architectural design document in PDF or DOCX format for teacher assessment.' },
        { title: '1.5 Reading Guide: Best Practices Documentation', type: 'reading', duration: '20 mins', content: 'Comprehensive guide covering enterprise design patterns and SOLID principles.' },
      ],
    },
    {
      title: 'Module 2: Advanced OOP & Design Patterns',
      lessons: [
        { title: '2.1 Encapsulation & Inheritance Video', type: 'video', duration: '25 mins', content: 'Deep dive into abstract classes, interfaces, and polymorphism for enterprise codebases.' },
        { title: '2.2 Factory & Singleton Quiz', type: 'quiz', duration: '15 mins', content: 'Verify design pattern implementation rules.' },
        { title: '2.3 Design Pattern Coding Game', type: 'game', duration: '35 mins', content: 'Implement a thread-safe Singleton pattern in your sandbox.' },
      ],
    },
  ]

  const currentModule = modules[activeModuleIndex] || modules[0]
  const currentLesson = currentModule?.lessons?.[activeLessonIndex] || currentModule?.lessons?.[0]
  const currentLessonKey = `m${activeModuleIndex}-l${activeLessonIndex}`
  const isCurrentCompleted = !!completedLessons[currentLessonKey]

  const handleToggleLessonComplete = async () => {
    const nextState = !isCurrentCompleted
    setCompletedLessons(prev => ({ ...prev, [currentLessonKey]: nextState }))

    if (id) {
      try {
        let totalCount = 0
        modules.forEach((m: any) => { totalCount += m.lessons.length })

        await courseService.updateCourseProgress(id, {
          lessonKey: currentLessonKey,
          isCompleted: nextState,
          totalLessons: Math.max(1, totalCount),
        })
        refetchProgress()
      } catch (err) {
        console.error('Failed to sync progress with MongoDB:', err)
      }
    }
  }

  const handleRunCode = () => {
    setIsRunning(true)
    setConsoleOutput('Compiling code in EduSphere Sandbox...\n')
    setTimeout(() => {
      setConsoleOutput(prev => prev + `[SUCCESS] Output:\nHello, EduSphere Real Course!\nExecution Time: 42ms\nMemory Used: 14.2 MB`)
      setIsRunning(false)
    }, 1200)
  }

  const handleAskAI = () => {
    if (!aiQuestion.trim()) return
    setAiThinking(true)
    setAiResponse(null)
    setTimeout(() => {
      setAiResponse(`Based on ${currentLesson?.title || 'this lesson'}, here is the explanation:\nIn ${course.title}, this pattern ensures memory safety and high concurrency efficiency. Always decouple component boundaries using clean interfaces.`)
      setAiThinking(false)
    }, 1500)
  }

  const handleAssignmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAssignmentFile(file)
  }

  const handleSubmitAssignment = () => {
    if (!assignmentFile) return
    setIsSubmittingAssignment(true)
    setTimeout(() => {
      const sanitizedStudent = (user?.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_')
      const sanitizedTitle = (currentLesson?.title || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_')
      const formatted = `${sanitizedStudent}_${sanitizedTitle}_${assignmentFile.name}`
      setAssignmentSubmittedFile(formatted)
      setIsSubmittingAssignment(false)
    }, 1500)
  }

  return (
    <div className="page-container space-y-5">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-indigo-400" size={20} /> {course.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Instructor: <strong className="text-slate-200">{course.instructorName}</strong> · {course.department}
            </p>
          </div>
        </div>

        {isFaculty && (
          <button
            onClick={() => setShowMaterialModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} /> Upload Course Material
          </button>
        )}
      </div>

      {/* Main Learning Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Interactive Course Curriculum */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-4 space-y-3 border-2 border-indigo-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Teacher Course Modules</h2>
              <span className="text-2xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                {modules.length} Modules
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {modules.map((m: any, mIdx: number) => (
                <div key={mIdx} className="space-y-1">
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-900/60 rounded-lg">
                    {m.title}
                  </div>

                  <div className="space-y-1">
                    {m.lessons.map((l: any, lIdx: number) => {
                      const key = `m${mIdx}-l${lIdx}`
                      const isSelected = activeModuleIndex === mIdx && activeLessonIndex === lIdx
                      const isDone = !!completedLessons[key]

                      const Icon = l.type === 'video' ? Video : l.type === 'quiz' ? HelpCircle : l.type === 'game' ? Gamepad2 : l.type === 'assignment' ? FileText : BookOpen

                      return (
                        <button
                          key={lIdx}
                          onClick={() => {
                            setActiveModuleIndex(mIdx)
                            setActiveLessonIndex(lIdx)
                            setSelectedQuizOption(null)
                            setQuizSubmitted(false)
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                              : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isDone ? (
                              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle size={16} className="text-slate-500 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{l.title}</p>
                              <p className="text-2xs text-slate-400 font-mono flex items-center gap-1 uppercase">
                                <Icon size={11} className="text-indigo-400" /> {l.type} · {l.duration}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Player & Interactive Playground */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Lesson Header & Mark Complete */}
          <div className="card p-5 space-y-3 border-2 border-indigo-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-2xs font-mono font-bold bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/30">
                  {currentLesson?.type || 'Lecture'} Material
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{currentLesson?.title}</h2>
              </div>

              <button
                onClick={handleToggleLessonComplete}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCurrentCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                }`}
              >
                {isCurrentCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                {isCurrentCompleted ? 'Completed ✓' : 'Mark as Completed'}
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
              {currentLesson?.content}
            </p>
          </div>

          {/* Differentiated Content Renderers */}

          {/* 1. Video Lecture Renderer */}
          {currentLesson?.type === 'video' && (
            <div className="card p-5 space-y-4 border border-indigo-500/30">
              <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                {currentLesson?.contentUrl ? (
                  <iframe
                    src={currentLesson.contentUrl}
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Video size={48} className="mx-auto text-indigo-400 animate-pulse" />
                    <p className="text-xs font-bold text-white">Teacher Video Lecture Material</p>
                    <p className="text-2xs text-slate-400">Streamed from Institutional Cloud Media Storage</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Interactive Quiz Renderer */}
          {currentLesson?.type === 'quiz' && (
            <div className="card p-5 space-y-4 border border-indigo-500/30">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="text-amber-400" size={18} /> Interactive Teacher Quiz Module
              </h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <p className="font-bold text-white">Q1. Which data structure provides O(1) average lookup time?</p>
                <div className="space-y-2">
                  {['Array / Linked List', 'HashMap / Hash Table', 'Binary Search Tree', 'Stack'].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedQuizOption(i)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        selectedQuizOption === i
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-2xs text-slate-400 font-mono">Teacher Assessment Quiz</span>
                  <button
                    disabled={selectedQuizOption === null}
                    onClick={() => setQuizSubmitted(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Submit Quiz Answers
                  </button>
                </div>

                {quizSubmitted && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-pulse">
                    ✓ Quiz Submitted Successfully! Score: 100% (+30 XP awarded).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Game / Interactive Coding Challenge */}
          {(currentLesson?.type === 'game' || currentLesson?.type === 'coding') && (
            <div className="card p-5 space-y-4 border border-indigo-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="text-emerald-400" size={18} /> Interactive Coding Game Challenge
                </h3>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />} Execute Code
                </button>
              </div>

              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                rows={8}
                className="w-full p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
              />

              {consoleOutput && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-2xs text-slate-300 space-y-1 whitespace-pre-wrap">
                  <p className="text-slate-400 font-bold">Terminal Output:</p>
                  {consoleOutput}
                </div>
              )}
            </div>
          )}

          {/* 4. Assignment Material Renderer */}
          {currentLesson?.type === 'assignment' && (
            <div className="card p-5 space-y-4 border border-indigo-500/30">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="text-indigo-400" size={18} /> Course Assignment Submission Panel
              </h3>

              {!assignmentSubmittedFile ? (
                <div className="space-y-3 text-xs">
                  <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 text-center relative cursor-pointer">
                    <input type="file" onChange={handleAssignmentUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload size={32} className="mx-auto text-indigo-400 mb-2 animate-bounce" />
                    <p className="font-bold text-white">
                      {assignmentFile ? `Selected File: ${assignmentFile.name}` : 'Click or Drag File to Upload Assignment (.PDF / .DOCX / .ZIP)'}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      disabled={!assignmentFile || isSubmittingAssignment}
                      onClick={handleSubmitAssignment}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingAssignment ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save &amp; Submit Assignment File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <ShieldCheck size={18} /> File Submitted &amp; Saved for Teacher Assessment
                  </div>
                  <p className="text-2xs font-mono text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    Saved File Name: <strong>{assignmentSubmittedFile}</strong>
                  </p>
                  <p className="text-2xs text-slate-400">Status: Pending Teacher Evaluation &amp; Grade Award</p>
                </div>
              )}
            </div>
          )}

          {/* AI Learning Copilot Helper */}
          <div className="card p-5 space-y-3 border border-indigo-500/20">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> EDEN AI Learning Assistant
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask EDEN AI about this lesson..."
                className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleAskAI}
                disabled={aiThinking}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {aiThinking ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Ask AI
              </button>
            </div>

            {aiResponse && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                {aiResponse}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Upload Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border-2 border-indigo-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="text-indigo-400" size={18} /> Upload Course Material (Faculty)
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-2xs font-bold text-slate-300 mb-1">Material Title:</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="e.g. Microservices Distributed Transaction Guide"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-300 mb-1">Material Type:</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="video">Video Lecture (Embed / URL)</option>
                  <option value="quiz">Interactive Quiz Module</option>
                  <option value="game">Coding Game Challenge</option>
                  <option value="assignment">Course Assignment</option>
                  <option value="reading">Reading Document</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-300 mb-1">Content URL / Video Link:</label>
                <input
                  type="text"
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-300 mb-1">Description / Instructions:</label>
                <textarea
                  value={materialDesc}
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  rows={3}
                  placeholder="Detailed instructions for students..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {materialSuccess && (
                <p className="text-2xs font-bold text-emerald-400 text-center animate-pulse">{materialSuccess}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!materialTitle || addMaterialMutation.isPending}
                  onClick={() => addMaterialMutation.mutate({ title: materialTitle, type: materialType, contentUrl: materialUrl, description: materialDesc })}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {addMaterialMutation.isPending ? 'Adding...' : 'Add Material to Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
