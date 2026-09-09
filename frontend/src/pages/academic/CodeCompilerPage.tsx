import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { Play, Code, Terminal, CheckCircle2, AlertCircle, Sparkles, Copy, Check, RotateCcw, Cpu, Zap, FileCode, Clock } from 'lucide-react'
import { useAppDispatch } from '../../hooks/useStore'
import { setPageContextData } from '../../store/edenSlice'

const TEMPLATES = {
  javascript: `// EduSphere Interactive Code Compiler (Node.js)
console.log("Hello from EduSphere Code Compiler!");

const userProfile = { level: 8, xp: 2450 };
console.log("User Profile:", userProfile);

function calculateGPA(grades) {
  const sum = grades.reduce((acc, g) => acc + g, 0);
  return (sum / grades.length).toFixed(2);
}

console.log("Calculated GPA:", calculateGPA([90, 85, 92, 88, 95]));
`,
  python: `# EduSphere Interactive Code Compiler (Python 3.11)
print("Hello from EduSphere Code Compiler!")

def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("First 10 Fibonacci numbers:", fibonacci(10))
`,
  c: `// EduSphere Interactive Code Compiler (C GCC)
#include <stdio.h>

int main() {
    printf("Hello from EduSphere C Engine!\\n");
    int scores[] = {95, 88, 92, 98, 90};
    int count = sizeof(scores) / sizeof(scores[0]);
    int sum = 0;
    for(int i = 0; i < count; i++) {
        sum += scores[i];
    }
    printf("Average Score: %.2f\\n", (double)sum / count);
    return 0;
}
`,
  cpp: `// EduSphere Interactive Code Compiler (C++ GCC)
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from EduSphere C++ Compiler!" << std::endl;
    std::vector<int> scores = {95, 88, 92, 98, 90};
    double sum = std::accumulate(scores.begin(), scores.end(), 0);
    std::cout << "Average Score: " << (sum / scores.size()) << std::endl;
    return 0;
}
`,
  java: `// EduSphere Interactive Code Compiler (Java Engine)
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from EduSphere Java Engine!");
        int level = 8;
        int xp = 2450;
        System.out.println("User Level: " + level + " | XP: " + xp);
    }
}
`,
}

export default function CodeCompilerPage() {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'c' | 'java'>('javascript')
  const [code, setCode] = useState(TEMPLATES.javascript)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [stderr, setStderr] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'timeout'>('idle')
  const [execTime, setExecTime] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const dispatch = useAppDispatch()

  // Sync state with EDEN Copilot
  useEffect(() => {
    dispatch(setPageContextData({
      currentTool: 'EduSphere Interactive Code Compiler',
      selectedLanguage: language,
      currentCode: code,
      executionStatus: status,
      terminalOutput: output || stderr || 'No output yet'
    }))
    
    return () => {
      dispatch(setPageContextData(null))
    }
  }, [language, code, status, output, stderr, dispatch])

  useEffect(() => {
    setCode(TEMPLATES[language])
  }, [language])

  useEffect(() => {
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

  const autoDetectLanguage = (codeStr: string): 'javascript' | 'python' | 'cpp' | 'c' | 'java' | null => {
    const trimmed = codeStr.trim()
    if (trimmed.includes('public class ') || trimmed.includes('import java.') || trimmed.includes('System.out.print')) {
      return 'java'
    }
    if (trimmed.includes('#include <iostream>') || trimmed.includes('std::cout') || trimmed.includes('using namespace std;')) {
      return 'cpp'
    }
    if (trimmed.includes('#include <stdio.h>') || trimmed.includes('printf(')) {
      return 'c'
    }
    if (trimmed.startsWith('def ') || (trimmed.includes('print(') && !trimmed.includes('console.log') && !trimmed.includes('System.out.'))) {
      return 'python'
    }
    return null
  }

  const handleRun = () => {
    let targetLang = language
    const detected = autoDetectLanguage(code)
    if (detected && detected !== language) {
      targetLang = detected
      setLanguage(detected)
    }

    setStatus('running')
    setOutput('')
    setStderr('')
    setExecTime(null)

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('compile:run', {
        language: targetLang,
        code,
        input,
        timeoutMs: 5000,
      })
    } else {
      fetch('http://localhost:5000/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: targetLang, code, input, timeoutMs: 5000 }),
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
          setStderr(`Backend compiler server unreachable: ${err.message}`)
        })
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetTemplate = () => {
    setCode(TEMPLATES[language])
    setOutput('')
    setStderr('')
    setStatus('idle')
    setExecTime(null)
  }

  const lineNumbers = code.split('\n').map((_, i) => i + 1)

  return (
    <div className="page-container flex flex-col space-y-4 pb-6 min-h-[calc(100vh-5rem)]">
      {/* Top Header Bar — Theme aware & High contrast */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <Code size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--foreground)' }}>
                Code Compiler Studio
              </h1>
              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Zap size={10} /> Live WebSocket Compiler Engine
              </span>
            </div>
            <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
              Multi-language IDE with real-time process execution, STDIN, and EDEN AI code evaluation
            </p>
          </div>
        </div>

        {/* IDE Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3.11</option>
            <option value="c">C (GCC Compiler)</option>
            <option value="cpp">C++ (GCC g++)</option>
            <option value="java">Java Engine</option>
          </select>

          <button onClick={resetTemplate} title="Reset to template"
            className="p-2 rounded-xl text-xs border transition-all cursor-pointer hover:opacity-80"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <RotateCcw size={15} />
          </button>

          <button onClick={copyCode} title="Copy code"
            className="p-2 rounded-xl text-xs border transition-all cursor-pointer hover:opacity-80"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRun}
            disabled={status === 'running'}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer disabled:opacity-50 ml-auto"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
          >
            {status === 'running' ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Play size={14} fill="white" />
                Run Code
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Main IDE Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
        
        {/* Left Column: Premium Dark Code Editor Canvas (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl overflow-hidden border shadow-lg"
          style={{ background: '#0B0F19', borderColor: '#1E293B' }}>
          
          {/* Editor Header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b text-xs font-mono"
            style={{ background: '#0F172A', borderColor: '#1E293B' }}>
            <span className="flex items-center gap-2 font-bold text-slate-300">
              <FileCode size={14} className="text-emerald-400" />
              main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'c' ? 'c' : language === 'cpp' ? 'cpp' : 'java'}
            </span>
            <div className="flex items-center gap-3 text-3xs text-slate-400">
              <span>{code.split('\n').length} Lines</span>
              <span className="uppercase">{language}</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative font-mono text-sm">
            {/* Line Numbers Bar */}
            <div className="py-4 px-3 text-right select-none font-mono text-xs border-r"
              style={{ background: '#080C14', color: '#475569', borderColor: '#1E293B', minWidth: '42px' }}>
              {lineNumbers.map(num => (
                <div key={num} className="leading-6">{num}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 py-4 px-4 bg-transparent outline-none resize-none leading-6 font-mono text-emerald-300 tracking-wide"
              style={{ fontFamily: 'Consolas, Monaco, "Fira Code", monospace', tabSize: 2 }}
              placeholder="Type or paste your code here..."
              spellCheck={false}
            />
          </div>

          {/* Editor Footer Status */}
          <div className="px-4 py-1.5 flex items-center justify-between text-3xs font-mono border-t"
            style={{ background: '#080C14', borderColor: '#1E293B', color: '#64748B' }}>
            <span>Status: Ready</span>
            <span>Spaces: 2</span>
          </div>
        </div>

        {/* Right Column: Terminal & STDIN Output (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl overflow-hidden border shadow-lg"
          style={{ background: '#050811', borderColor: '#1E293B' }}>
          
          {/* STDIN Input Header & Box */}
          <div className="p-3.5 border-b space-y-2" style={{ background: '#0A0F1D', borderColor: '#1E293B' }}>
            <div className="flex items-center justify-between">
              <label className="text-3xs font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cpu size={12} className="text-indigo-400" /> Custom Input (STDIN)
              </label>
              <span className="text-3xs text-slate-500 font-mono">Optional</span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Provide STDIN input arguments for main() or input()..."
              rows={2}
              className="w-full p-2.5 text-xs font-mono rounded-xl outline-none border transition-all text-slate-200"
              style={{ background: '#050811', borderColor: '#1E293B' }}
            />
          </div>

          {/* Console Terminal Header */}
          <div className="px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono"
            style={{ background: '#080C14', borderColor: '#1E293B' }}>
            <span className="flex items-center gap-2 font-bold text-slate-300">
              <Terminal size={14} className="text-indigo-400" /> Console Terminal Output
            </span>

            {/* Execution status badges */}
            <div className="flex items-center gap-2">
              {execTime !== null && (
                <span className="text-3xs font-mono font-bold text-indigo-400 flex items-center gap-1">
                  <Clock size={10} /> {execTime}ms
                </span>
              )}

              {status === 'success' && (
                <span className="px-2 py-0.5 rounded text-3xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Exit Code 0
                </span>
              )}

              {status === 'error' && (
                <span className="px-2 py-0.5 rounded text-3xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <AlertCircle size={10} /> Error
                </span>
              )}

              {status === 'running' && (
                <span className="px-2 py-0.5 rounded text-3xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Executing
                </span>
              )}
            </div>
          </div>

          {/* Console Terminal Stream Window */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed space-y-2 select-text"
            style={{ fontFamily: 'Consolas, Monaco, "Fira Code", monospace' }}>
            
            {status === 'idle' && !output && !stderr && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-600">
                <Terminal size={32} className="opacity-40" />
                <p className="font-bold text-xs text-slate-400">Terminal Ready</p>
                <p className="text-3xs">Click "Run Code" to compile and stream output live.</p>
              </div>
            )}

            {output && (
              <div className="whitespace-pre-wrap text-emerald-400 font-mono">
                {output}
              </div>
            )}

            {stderr && (
              <div className="whitespace-pre-wrap text-red-400 font-mono p-2.5 rounded-xl bg-red-950/30 border border-red-500/20">
                {stderr}
              </div>
            )}
          </div>

          {/* EDEN AI Code Advisor Prompt Bar */}
          <div className="p-3 border-t flex items-center justify-between gap-3 text-2xs"
            style={{ background: '#0A0F1D', borderColor: '#1E293B' }}>
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Sparkles size={13} />
              <span>EDEN AI Code Advisor</span>
            </div>
            <span className="text-3xs text-slate-500 font-mono">Synced with Copilot</span>
          </div>
        </div>
      </div>
    </div>
  )
}
