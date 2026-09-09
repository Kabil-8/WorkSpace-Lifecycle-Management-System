import { io, Socket } from 'socket.io-client'

export interface ProctorTelemetry {
  examId: string
  studentId: string
  studentName: string
  integrityScore: number
  riskCategory: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'Suspicious' | 'High Risk'
  eyeFocusScore: number
  headOrientation: string
  warningsCount: number
}

export class ProctorService {
  private static socket: Socket | null = null

  static getSocket(): Socket {
    if (!this.socket) {
      this.socket = io('http://localhost:5000', {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
      })
    }
    return this.socket
  }

  /**
   * Initializes Secure Browser Mode (Disables right-click, copy, paste, select, shortcuts, and tracks tab switches)
   */
  static enableSecureBrowserLockdown(
    onViolation: (type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical') => void
  ) {
    const preventAction = (e: Event, type: string, msg: string) => {
      e.preventDefault()
      e.stopPropagation()
      onViolation(type, msg, 'high')
      return false
    }

    const handleContextMenu = (e: MouseEvent) => preventAction(e, 'right_click', 'Right click disabled during exam lockdown')
    const handleCopy = (e: ClipboardEvent) => preventAction(e, 'clipboard_copy', 'Copying content disabled during exam lockdown')
    const handlePaste = (e: ClipboardEvent) => preventAction(e, 'clipboard_paste', 'Pasting content disabled during exam lockdown')
    const handleSelectStart = (e: Event) => preventAction(e, 'text_selection', 'Text selection disabled during exam lockdown')

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Alt+Tab, PrintScreen
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault()
        e.stopPropagation()
        onViolation('devtools_open', 'Developer tools / screenshot shortcut detected', 'critical')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation('tab_switch', 'Tab switch or window minimize detected!', 'critical')
      }
    }

    const handleWindowBlur = () => {
      onViolation('window_blur', 'Exam window lost focus!', 'high')
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onViolation('fullscreen_exit', 'Exited fullscreen exam lockdown mode!', 'high')
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }

  /**
   * Request Fullscreen Mode
   */
  static async requestFullscreen(): Promise<boolean> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        return true
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
    return false
  }

  /**
   * Evaluates Eye Tracking & Head Pose Gaze Simulation
   */
  static estimateGazeAndHeadPose(canvasWidth: number, canvasHeight: number, faceX: number, faceY: number) {
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    const diffX = faceX - centerX
    const diffY = faceY - centerY

    let gazeDirection: 'Center' | 'Left' | 'Right' | 'Up' | 'Down' = 'Center'
    let orientation: 'Forward' | 'Left' | 'Right' | 'Up' | 'Down' = 'Forward'

    if (diffX < -60) {
      gazeDirection = 'Left'
      orientation = 'Left'
    } else if (diffX > 60) {
      gazeDirection = 'Right'
      orientation = 'Right'
    } else if (diffY < -50) {
      gazeDirection = 'Up'
      orientation = 'Up'
    } else if (diffY > 50) {
      gazeDirection = 'Down'
      orientation = 'Down'
    }

    const dist = Math.sqrt(diffX * diffX + diffY * diffY)
    const eyeFocusScore = Math.max(20, Math.min(100, Math.round(100 - dist * 0.25)))

    return {
      gazeDirection,
      orientation,
      eyeFocusScore,
      pitch: Math.round(diffY * 0.4),
      yaw: Math.round(diffX * 0.4),
      roll: 0,
    }
  }

  /**
   * API: Get Exams
   */
  static async fetchExams() {
    try {
      const res = await fetch('http://localhost:5000/api/proctor/exams')
      if (res.ok) {
        const data = await res.json()
        return data.data
      }
    } catch (err) {
      console.warn('Backend exams API offline, returning mock proctored exams', err)
    }
    return [
      {
        _id: 'exam-101',
        title: 'CS401: Advanced Data Structures & Algorithms',
        subject: 'Computer Science',
        department: 'Computer Science & Engineering',
        description: 'Comprehensive 60-minute proctored assessment covering Trees, Graphs, Dynamic Programming, and System Design.',
        durationMinutes: 45,
        passingScore: 70,
        totalPoints: 100,
        questions: [
          { id: 'q1', text: 'Which data structure is optimal for implementing Breadth-First Search (BFS)?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Binary Search Tree'], correctAnswer: 'Queue', points: 25 },
          { id: 'q2', text: 'Explain the average time complexity of QuickSort vs MergeSort.', type: 'short_answer', correctAnswer: 'QuickSort is O(N log N) average, MergeSort is O(N log N) guaranteed.', points: 25 },
          { id: 'q3', text: 'In a Binary Search Tree, left child is always strictly less than parent node.', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', points: 25 },
          { id: 'q4', text: 'What is the worst-case space complexity of Depth-First Search (DFS) on a tree of height H?', type: 'multiple_choice', options: ['O(1)', 'O(H)', 'O(N^2)', 'O(N log N)'], correctAnswer: 'O(H)', points: 25 }
        ],
        proctorConfig: { eyeTrackingSensitivity: 8, maxWarningsAllowed: 3, allowedTabSwitches: 0 }
      },
      {
        _id: 'exam-102',
        title: 'CS502: Cloud Architecture & DevOps Microservices',
        subject: 'Cloud Computing',
        department: 'Computer Science & Engineering',
        description: 'AI Proctored examination covering Docker, Kubernetes, Terraform, and Redis connection pooling.',
        durationMinutes: 60,
        passingScore: 75,
        totalPoints: 100,
        questions: [
          { id: 'q1', text: 'Which Docker command compiles a container image from a Dockerfile?', type: 'multiple_choice', options: ['docker run', 'docker build', 'docker exec', 'docker compose'], correctAnswer: 'docker build', points: 50 },
          { id: 'q2', text: 'Kubernetes Pods can contain multiple tightly-coupled containers.', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', points: 50 }
        ],
        proctorConfig: { eyeTrackingSensitivity: 9, maxWarningsAllowed: 3, allowedTabSwitches: 0 }
      }
    ]
  }
}
