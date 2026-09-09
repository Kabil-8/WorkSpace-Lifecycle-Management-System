import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { Play, Code, Terminal, Clock, CheckCircle2, AlertCircle, X, Copy, Check } from 'lucide-react'

interface CodeCompilerModalProps {
  isOpen: boolean
  onClose: () => void
  initialLanguage?: 'javascript' | 'python' | 'cpp' | 'java'
  initialCode?: string
}

const TEMPLATES = {
  javascript: `// EduSphere Interactive JS Engine
console.log("Hello from EduSphere Code Compiler! 🚀");

const userProfile = { level: 8, xp: 2450 };
console.log("User Profile:", userProfile);

function calculateGPA(grades) {
  const sum = grades.reduce((acc, g) => acc + g, 0);
  return (sum / grades.length).toFixed(2);
}

console.log("Calculated GPA:", calculateGPA([90, 85, 92, 88, 95]));
`,
  python: `# EduSphere Interactive Python Engine
print("Hello from EduSphere Code Compiler! 🚀")

def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("First 10 Fibonacci numbers:", fibonacci(10))
`,
  cpp: `// EduSphere C++ Compiler Engine
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from EduSphere C++ Engine! 🚀" << std::endl;
    std::vector<int> scores = {95, 88, 92, 98, 90};
    double sum = std::accumulate(scores.begin(), scores.end(), 0);
    std::cout << "Average Score: " << (sum / scores.size()) << std::endl;
    return 0;
}
`,
  java: `// EduSphere Java Engine
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from EduSphere Java Engine! 🚀");
        int level = 8;
        int xp = 2450;
        System.out.println("User Level: " + level + " | XP: " + xp);
    }
}
`,
}

export default function CodeCompilerModal({ isOpen, onClose, initialLanguage = 'javascript', initialCode }: CodeCompilerModalProps) {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java'>(initialLanguage)
  const [code, setCode] = useState(initialCode || TEMPLATES[initialLanguage])
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [stderr, setStderr] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'timeout'>('idle')
  const [execTime, setExecTime] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (initialCode) setCode(initialCode)
    else setCode(TEMPLATES[language])
  }, [language, initialCode])

  useEffect(() => {
    // Connect to Socket.IO backend on port 5000
    const socket = io('http://localhost:5000', {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
    })
    socketRef.current = socket

    socket.on('compile:chunk', (chunk: { type: 'stdout' | 'stderr'; text: string }) => {
      if (chunk.type === 'stdout') {
        setOutput(prev => prev + chunk.text)
      } else {
        setStderr(prev => prev + chunk.text)
      }
    })

    socket.on('compile:result', (result: { status: 'success' | 'error' | 'timeout'; stdout: string; stderr: string; executionTimeMs: number }) => {
      setStatus(result.status)
      setOutput(result.stdout)
      setStderr(result.stderr)
      setExecTime(result.executionTimeMs)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleRun = () => {
    setStatus('running')
    setOutput('')
    setStderr('')
    setExecTime(null)

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('compile:run', {
        language,
        code,
        input,
        timeoutMs: 5000,
      })
    } else {
      // Fallback via HTTP REST API
      fetch('http://localhost:5000/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input, timeoutMs: 5000 }),
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            setStatus(resData.data.status)
            setOutput(resData.data.stdout)
            setStderr(resData.data.stderr)
            setExecTime(resData.data.executionTimeMs)
          } else {
            setStatus('error')
            setStderr(resData.message || 'Execution error')
          }
        })
        .catch(err => {
          setStatus('error')
          setStderr(`Backend server unreachable: ${err.message}`)
        })
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #8B5CF6)' }}>
                <Code size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  EduSphere Real-Time Code Compiler
                  <span className="text-2xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}>
                    ● Socket.IO Live Streaming
                  </span>
                </h2>
                <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Multi-language execution engine (Node.js, Python, C++, Java)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white outline-none cursor-pointer"
              >
                <option value="javascript" className="bg-slate-900 text-white">JavaScript (Node.js v24)</option>
                <option value="python" className="bg-slate-900 text-white">Python 3.11</option>
                <option value="cpp" className="bg-slate-900 text-white">C++ (GCC g++ 13)</option>
                <option value="java" className="bg-slate-900 text-white">Java 21 (OpenJDK)</option>
              </select>

              <button onClick={copyCode} className="p-2 rounded-xl text-xs flex items-center gap-1 bg-white/5 border border-white/10" style={{ color: 'var(--text-secondary)' }}>
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body: Split Code Editor + Terminal Output */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Left: Code Input */}
            <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b text-2xs font-semibold text-slate-400" style={{ borderColor: 'var(--border)' }}>
                <span>Source Code ({language.toUpperCase()})</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 p-4 bg-transparent text-sm font-mono text-cyan-300 outline-none resize-none leading-relaxed"
                style={{ fontFamily: 'Consolas, Monaco, "Fira Code", monospace' }}
                placeholder="Type your code here..."
                spellCheck={false}
              />
            </div>

            {/* Right: Input & Output Panel */}
            <div className="w-full md:w-[420px] flex flex-col" style={{ background: '#090D16' }}>
              {/* STDIN Panel */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <label className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Custom Input (STDIN)</label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none resize-none"
                  placeholder="Optional input passed to stdout..."
                />
              </div>

              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b text-2xs font-semibold text-slate-400" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <Terminal size={14} className="text-purple-400" />
                  <span>Execution Output</span>
                </div>
                {execTime !== null && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Clock size={12} /> {execTime}ms
                  </span>
                )}
              </div>

              {/* Output Content */}
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2" style={{ background: '#05070D' }}>
                {status === 'running' && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                    <span>Compiling & executing code...</span>
                  </div>
                )}

                {output && (
                  <div className="text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {output}
                  </div>
                )}

                {stderr && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 whitespace-pre-wrap font-mono">
                    <div className="flex items-center gap-1.5 font-bold mb-1"><AlertCircle size={14} /> Error Output</div>
                    {stderr}
                  </div>
                )}

                {!output && !stderr && status !== 'running' && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                    <Terminal size={32} className="mb-2 opacity-40" />
                    <p>Click "Run Code" to compile & view real-time output</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-2 text-xs">
              {status === 'success' && <span className="flex items-center gap-1 text-emerald-400 font-semibold"><CheckCircle2 size={14} /> Execution Success ({execTime}ms)</span>}
              {status === 'error' && <span className="flex items-center gap-1 text-red-400 font-semibold"><AlertCircle size={14} /> Execution Failed</span>}
              {status === 'timeout' && <span className="flex items-center gap-1 text-yellow-400 font-semibold"><Clock size={14} /> Timeout Exceeded</span>}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5">
                Close
              </button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleRun}
                disabled={status === 'running'}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
              >
                {status === 'running' ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="white" />
                    Run Code (Ctrl+Enter)
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
