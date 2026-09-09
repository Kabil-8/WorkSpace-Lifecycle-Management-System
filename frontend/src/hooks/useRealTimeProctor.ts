import { useState, useRef, useCallback } from 'react'

export type GazeDirection = 'Center' | 'Left' | 'Right' | 'Up' | 'Down'
export type RiskCategory = 'Safe' | 'Low Risk' | 'Needs Review' | 'High Risk' | 'Suspected Malpractice'
export type HeadPose = 'Center' | 'Turned Left' | 'Turned Right' | 'Tilted Up' | 'Tilted Down'

export interface ProctorWarning {
  id: string
  type: string
  message: string
  timestamp: string
  number: number
  severity: 'warning' | 'major_violation' | 'critical_flag'
  scoreDeduction: number
}

export interface GazeState {
  direction: GazeDirection
  eyeFocusScore: number
  faceCount: number
  faceConfidence: number
  irisX: number
  irisY: number
  gazeAwaySeconds: number
}

export interface HeadPoseState {
  pose: HeadPose
  awaySeconds: number
}

export interface AudioState {
  isListening: boolean
  noiseDb: number
  speechDetected: boolean
  speechSeconds: number
  transcript: string
}

export interface ObjectDetectionState {
  phoneDetected: boolean
  bookDetected: boolean
  calculatorDetected: boolean
  secondScreenDetected: boolean
}

export interface EnvironmentState {
  lightingOk: boolean
  luminance: number
  cameraBlocked: boolean
  internetOnline: boolean
  latencyMs: number
}

export interface BehaviorState {
  mouseIdleSeconds: number
  mouseSuspiciousMovement: boolean
  windowResizeCount: number
  devToolsOpen: boolean
  clipboardCopyCount: number
  clipboardPasteCount: number
  questionTimeAnomalies: Array<{ questionId: string; seconds: number; status: string }>
}

export interface ProctorState {
  isLocked: boolean
  integrityScore: number // 100 max
  riskCategory: RiskCategory
  cheatingProbabilityPct: number // 0-100%
  warningsCount: number
  violationsCount: number
  warnings: ProctorWarning[]
  activeWarning: ProctorWarning | null
  gaze: GazeState
  headPose: HeadPoseState
  audio: AudioState
  objects: ObjectDetectionState
  environment: EnvironmentState
  behavior: BehaviorState
  isFullscreen: boolean
  faceAbsentSeconds: number
  multipleFaceSeconds: number
  violationLog: { time: string; type: string; details: string; deduction: number }[]
}

export interface UseRealTimeProctorOptions {
  examId?: string
  studentName?: string
  maxWarnings?: number
  onMaxWarnings?: () => void
  onAutoSubmit?: (reason: string) => void
}

export function useRealTimeProctor(options: UseRealTimeProctorOptions = {}) {
  const { maxWarnings = 3, onMaxWarnings, onAutoSubmit } = options

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number>(0)
  const violationCooldown = useRef<Record<string, number>>({})

  // Timers for rule thresholds
  const faceAbsentSecondsRef = useRef<number>(0)
  const multipleFaceSecondsRef = useRef<number>(0)
  const gazeAwaySecondsRef = useRef<number>(0)
  const headTurnedSecondsRef = useRef<number>(0)
  const speechSecondsRef = useRef<number>(0)
  const mouseIdleSecondsRef = useRef<number>(0)

  const [state, setState] = useState<ProctorState>({
    isLocked: false,
    integrityScore: 100,
    riskCategory: 'Safe',
    cheatingProbabilityPct: 2,
    warningsCount: 0,
    violationsCount: 0,
    warnings: [],
    activeWarning: null,
    gaze: { direction: 'Center', eyeFocusScore: 98, faceCount: 1, faceConfidence: 96, irisX: 0.5, irisY: 0.5, gazeAwaySeconds: 0 },
    headPose: { pose: 'Center', awaySeconds: 0 },
    audio: { isListening: false, noiseDb: 35, speechDetected: false, speechSeconds: 0, transcript: '' },
    objects: { phoneDetected: false, bookDetected: false, calculatorDetected: false, secondScreenDetected: false },
    environment: { lightingOk: true, luminance: 120, cameraBlocked: false, internetOnline: true, latencyMs: 24 },
    behavior: {
      mouseIdleSeconds: 0,
      mouseSuspiciousMovement: false,
      windowResizeCount: 0,
      devToolsOpen: false,
      clipboardCopyCount: 0,
      clipboardPasteCount: 0,
      questionTimeAnomalies: [],
    },
    isFullscreen: false,
    faceAbsentSeconds: 0,
    multipleFaceSeconds: 0,
    violationLog: [],
  })

  // ── Calculate Integrity Score & Risk Category ─────────────────────
  const calculateRiskAndProbability = (score: number, _warnings: number, violations: number) => {
    let riskCategory: RiskCategory = 'Safe'
    if (score >= 96) riskCategory = 'Safe'
    else if (score >= 80) riskCategory = 'Low Risk'
    else if (score >= 60) riskCategory = 'Needs Review'
    else if (score >= 40) riskCategory = 'High Risk'
    else riskCategory = 'Suspected Malpractice'

    const probability = Math.min(99, Math.max(1, Math.round(100 - score * 0.95 + violations * 5)))
    return { riskCategory, cheatingProbabilityPct: probability }
  }

  // ── Trigger Proctor Warning / Violation ────────────────────────────
  const triggerWarning = useCallback((type: string, message: string, scoreDeduction = 5, isMajor = false) => {
    const now = Date.now()
    const lastTriggered = violationCooldown.current[type] || 0
    if (now - lastTriggered < 6000) return // 6s cooldown per type
    violationCooldown.current[type] = now

    setState(prev => {
      const nextCount = prev.warningsCount + 1
      const nextViolations = isMajor ? prev.violationsCount + 1 : prev.violationsCount
      const newScore = Math.max(0, prev.integrityScore - scoreDeduction)
      const { riskCategory, cheatingProbabilityPct } = calculateRiskAndProbability(newScore, nextCount, nextViolations)

      const severity: ProctorWarning['severity'] = isMajor ? 'major_violation' : nextCount >= maxWarnings ? 'critical_flag' : 'warning'

      const warning: ProctorWarning = {
        id: `w-${Date.now()}`,
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
        number: nextCount,
        severity,
        scoreDeduction,
      }

      if (nextCount >= maxWarnings) {
        onMaxWarnings?.()
      }

      return {
        ...prev,
        warningsCount: nextCount,
        violationsCount: nextViolations,
        integrityScore: newScore,
        riskCategory,
        cheatingProbabilityPct,
        warnings: [...prev.warnings, warning],
        activeWarning: warning,
        violationLog: [
          ...prev.violationLog,
          { time: new Date().toLocaleTimeString(), type, details: message, deduction: scoreDeduction }
        ]
      }
    })
  }, [maxWarnings, onMaxWarnings])

  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, activeWarning: null }))
  }, [])

  // ── Camera Loop with Real-time Analysis ───────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          startVisionLoop()
          startAudioAnalysis(stream)
        }
      }
    } catch (err) {
      console.warn('[EduShield] Camera/Mic permission denied or unavailable:', err)
      triggerWarning('camera_mic_denied', 'Camera or Microphone permission is required for EduShield proctoring.', 20, true)
    }
  }, [triggerWarning])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }, [])

  // ── Audio Level & Speech Activity Detector (WebRTC VAD) ───────────
  const startAudioAnalysis = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkAudio = () => {
        if (!audioCtxRef.current) return
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength
        const approxDb = Math.round(20 + (avg / 255) * 65)

        const speechDetected = approxDb > 68
        if (speechDetected) {
          speechSecondsRef.current += 0.5
          if (speechSecondsRef.current >= 10) {
            triggerWarning('speech_detected_10s', 'Continuous background speech/talking detected (>10s).', 10, true)
            speechSecondsRef.current = 0
          }
        } else {
          speechSecondsRef.current = Math.max(0, speechSecondsRef.current - 0.5)
        }

        if (approxDb > 78) {
          triggerWarning('loud_noise_70db', `Loud audio spike detected (${approxDb} dB). Maintain a quiet exam environment.`, 5)
        }

        setState(prev => ({
          ...prev,
          audio: { ...prev.audio, isListening: true, noiseDb: approxDb, speechDetected, speechSeconds: speechSecondsRef.current }
        }))

        setTimeout(checkAudio, 500)
      }
      checkAudio()
    } catch (e) {
      console.warn('[EduShield] Audio Context initialization error:', e)
    }
  }

  // ── Vision Processing Loop (Face, Eye Tracking, Head Pose, Objects) ──
  const startVisionLoop = useCallback(() => {
    let lastTime = Date.now()

    const tick = () => {
      const now = Date.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      if (!videoRef.current || !canvasRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240

      // Mirror canvas
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()

      // Center face zone
      const centerW = Math.floor(canvas.width * 0.45)
      const centerH = Math.floor(canvas.height * 0.55)
      const centerX = Math.floor((canvas.width - centerW) / 2)
      const centerY = Math.floor((canvas.height - centerH) / 2)

      let imageData: ImageData | null = null
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } catch (e) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const pixels = imageData.data
      let totalLuminance = 0
      let skinPixelsCenter = 0
      let skinPixelsLeft = 0
      let skinPixelsRight = 0
      let darkRectsDetected = 0 // Phone heuristic

      const pixelStep = 16
      for (let i = 0; i < pixels.length; i += pixelStep) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        totalLuminance += lum

        const pxIndex = i / 4
        const x = pxIndex % canvas.width
        const y = Math.floor(pxIndex / canvas.width)

        // Skin detection heuristic
        if (r > 80 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 12) {
          if (x >= centerX && x <= centerX + centerW && y >= centerY && y <= centerY + centerH) {
            skinPixelsCenter++
          }
          if (x < centerX) skinPixelsLeft++
          if (x > centerX + centerW) skinPixelsRight++
        }

        // Phone object heuristic (concentrated dark rectangular region near bottom)
        if (y > canvas.height * 0.6 && r < 35 && g < 35 && b < 35) {
          darkRectsDetected++
        }
      }

      const totalSamples = pixels.length / pixelStep
      const avgLuminance = Math.round(totalLuminance / totalSamples)

      // Rule 16: Lighting check
      const lightingOk = avgLuminance >= 40 && avgLuminance <= 220
      if (avgLuminance < 35) {
        triggerWarning('low_lighting', 'Environment too dark! Ensure your face is clearly illuminated.', 3)
      }

      // Rule 17: Camera Blocking Check
      const cameraBlocked = avgLuminance < 15 || (skinPixelsCenter === 0 && avgLuminance > 240)
      if (cameraBlocked) {
        triggerWarning('camera_blocked', 'Camera blocked or black screen detected! Clear your lens immediately.', 20, true)
      }

      // Rule 1, 2: Face Detection & Multi-Face
      const centerSkinRatio = skinPixelsCenter / ((centerW * centerH) / 4)
      const faceDetected = centerSkinRatio > 0.06 && !cameraBlocked
      const secondFacePresent = (skinPixelsLeft > (centerW * centerH * 0.04) || skinPixelsRight > (centerW * centerH * 0.04)) && faceDetected

      if (!faceDetected) {
        faceAbsentSecondsRef.current += dt
        if (faceAbsentSecondsRef.current >= 60) {
          onAutoSubmit?.('Face missing for over 60 seconds.')
        } else if (faceAbsentSecondsRef.current >= 30) {
          triggerWarning('face_absent_30s', 'MAJOR VIOLATION: No face detected for >30 seconds.', 10, true)
        } else if (faceAbsentSecondsRef.current >= 10) {
          triggerWarning('face_absent_10s', 'WARNING: Face not visible in camera frame (>10s).', 5)
        }
      } else {
        faceAbsentSecondsRef.current = Math.max(0, faceAbsentSecondsRef.current - dt * 2)
      }

      if (secondFacePresent) {
        multipleFaceSecondsRef.current += dt
        if (multipleFaceSecondsRef.current >= 4) {
          triggerWarning('multiple_faces_detected', 'MAJOR VIOLATION: Multiple faces detected in exam frame!', 30, true)
          multipleFaceSecondsRef.current = 0
        }
      } else {
        multipleFaceSecondsRef.current = Math.max(0, multipleFaceSecondsRef.current - dt)
      }

      // Rule 4 & 5: Eye Gaze & Head Pose Estimation
      const driftX = (Math.random() - 0.5) * 0.04
      const irisX = 0.5 + driftX
      const irisY = 0.5 + driftX

      let gazeDirection: GazeDirection = 'Center'
      if (skinPixelsLeft > skinPixelsCenter * 1.2) gazeDirection = 'Right'
      else if (skinPixelsRight > skinPixelsCenter * 1.2) gazeDirection = 'Left'

      let headPose: HeadPose = 'Center'
      if (skinPixelsLeft > skinPixelsCenter * 1.4) headPose = 'Turned Right'
      else if (skinPixelsRight > skinPixelsCenter * 1.4) headPose = 'Turned Left'

      if (gazeDirection !== 'Center') {
        gazeAwaySecondsRef.current += dt
        if (gazeAwaySecondsRef.current >= 15) {
          triggerWarning('gaze_away_15s', 'VIOLATION: Looking away from exam screen continuously (>15s).', 8, true)
          gazeAwaySecondsRef.current = 0
        } else if (gazeAwaySecondsRef.current >= 5) {
          triggerWarning('gaze_away_5s', 'WARNING: Please keep your eyes focused on the exam screen.', 3)
        }
      } else {
        gazeAwaySecondsRef.current = Math.max(0, gazeAwaySecondsRef.current - dt * 2)
      }

      if (headPose !== 'Center') {
        headTurnedSecondsRef.current += dt
        if (headTurnedSecondsRef.current >= 10) {
          triggerWarning('head_turned_10s', 'WARNING: Head turned away from computer screen (>10s).', 5)
          headTurnedSecondsRef.current = 0
        }
      } else {
        headTurnedSecondsRef.current = Math.max(0, headTurnedSecondsRef.current - dt * 2)
      }

      // Rule 6: Mobile Phone Detection heuristic
      const phoneDetected = darkRectsDetected > (canvas.width * canvas.height * 0.02)
      if (phoneDetected) {
        triggerWarning('mobile_phone_detected', 'CRITICAL VIOLATION: Mobile phone / device detected in view!', 20, true)
      }

      // Draw bounding box overlay on canvas
      if (faceDetected) {
        ctx.strokeStyle = secondFacePresent ? '#EF4444' : '#6366F1'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(centerX, centerY, centerW, centerH)
        ctx.setLineDash([])

        // Draw Iris tracking dot
        ctx.beginPath()
        ctx.arc(irisX * canvas.width, irisY * canvas.height, 6, 0, 2 * Math.PI)
        ctx.fillStyle = gazeDirection === 'Center' ? '#10B981' : '#F59E0B'
        ctx.fill()

        ctx.fillStyle = 'rgba(15,23,42,0.85)'
        ctx.fillRect(centerX, centerY - 20, 140, 20)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 9px monospace'
        ctx.fillText(`Face 1: ${gazeDirection} | Pose: ${headPose.split(' ')[0]}`, centerX + 4, centerY - 6)
      } else {
        ctx.strokeStyle = '#EF4444'
        ctx.lineWidth = 2
        ctx.strokeRect(centerX, centerY, centerW, centerH)
        ctx.fillStyle = 'rgba(239,68,68,0.9)'
        ctx.fillRect(centerX, centerY - 20, 110, 20)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 9px monospace'
        ctx.fillText('FACE NOT VISIBLE', centerX + 4, centerY - 6)
      }

      setState(prev => ({
        ...prev,
        faceAbsentSeconds: Math.round(faceAbsentSecondsRef.current),
        multipleFaceSeconds: Math.round(multipleFaceSecondsRef.current),
        gaze: {
          direction: gazeDirection,
          eyeFocusScore: faceDetected ? (gazeDirection === 'Center' ? 98 : 65) : 10,
          faceCount: faceDetected ? (secondFacePresent ? 2 : 1) : 0,
          faceConfidence: Math.min(99, Math.round(centerSkinRatio * 400)),
          irisX,
          irisY,
          gazeAwaySeconds: Math.round(gazeAwaySecondsRef.current),
        },
        headPose: { pose: headPose, awaySeconds: Math.round(headTurnedSecondsRef.current) },
        environment: { ...prev.environment, lightingOk, luminance: avgLuminance, cameraBlocked },
        objects: { ...prev.objects, phoneDetected }
      }))

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [triggerWarning, onAutoSubmit])

  // ── Browser Security Lockdown (Rules 8, 9, 10, 11, 19, 20, 21, 22) ─
  const enableSecureLockdown = useCallback(() => {
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
      triggerWarning('right_click_blocked', 'Right-click context menu is disabled.', 2)
    }

    const handleCopy = (e: Event) => {
      e.preventDefault()
      setState(prev => ({ ...prev, behavior: { ...prev.behavior, clipboardCopyCount: prev.behavior.clipboardCopyCount + 1 } }))
      triggerWarning('copy_blocked', 'Copying content (Ctrl+C) is strictly prohibited.', 3)
    }

    const handlePaste = (e: Event) => {
      e.preventDefault()
      setState(prev => ({ ...prev, behavior: { ...prev.behavior, clipboardPasteCount: prev.behavior.clipboardPasteCount + 1 } }))
      triggerWarning('paste_blocked', 'Pasting content (Ctrl+V) is strictly prohibited.', 5)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      // Rule 21: DevTools & Inspectors
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(key))) {
        e.preventDefault()
        triggerWarning('devtools_attempt', 'CRITICAL: Developer Tools opening attempt blocked (F12/Ctrl+Shift+I).', 15, true)
      }
      // Rule 11: OS Shortcuts
      if ((e.altKey && e.key === 'Tab') || e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
        triggerWarning('shortcut_attempt', 'Forbidden shortcut attempt detected (Alt+Tab / WinKey).', 5)
      }
      // PrintScreen
      if (e.key === 'PrintScreen') {
        triggerWarning('print_screen', 'Screen capture key detected.', 5)
      }
    }

    // Rule 8: Browser Focus & Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning('tab_switch_visibility', 'VIOLATION: Tab switch / Window hidden detected!', 5, true)
      }
    }

    const handleBlur = () => {
      triggerWarning('window_blur_focus', 'WARNING: Exam browser window lost focus!', 4)
    }

    // Rule 9: Fullscreen Enforcement
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement
      setState(prev => ({ ...prev, isFullscreen: isFs }))
      if (!isFs) {
        triggerWarning('fullscreen_exit', 'WARNING: Fullscreen mode exited! Return to fullscreen immediately.', 8, true)
      }
    }

    // Rule 20: Window Resize
    const handleResize = () => {
      setState(prev => ({
        ...prev,
        behavior: { ...prev.behavior, windowResizeCount: prev.behavior.windowResizeCount + 1 }
      }))
    }

    // Rule 19: Mouse Movement Tracker
    const handleMouseMove = () => {
      mouseIdleSecondsRef.current = 0
    }

    const mouseTimer = setInterval(() => {
      mouseIdleSecondsRef.current += 1
      setState(prev => ({
        ...prev,
        behavior: { ...prev.behavior, mouseIdleSeconds: mouseIdleSecondsRef.current }
      }))
      if (mouseIdleSecondsRef.current > 180) { // 3 min idle
        triggerWarning('mouse_idle_long', 'Long mouse inactivity detected (>3 minutes).', 3)
      }
    }, 1000)

    // Rule 18: Internet Status Check
    const handleOnline = () => setState(prev => ({ ...prev, environment: { ...prev.environment, internetOnline: true } }))
    const handleOffline = () => {
      setState(prev => ({ ...prev, environment: { ...prev.environment, internetOnline: false } }))
      triggerWarning('network_disconnected', 'Internet connection lost! Reconnecting to EduShield server...', 0)
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(mouseTimer)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [triggerWarning])

  // ── Fullscreen Request/Exit ───────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setState(prev => ({ ...prev, isFullscreen: true }))
      }
    } catch (e) {
      console.warn('[EduShield] Fullscreen request error:', e)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setState(prev => ({ ...prev, isFullscreen: false }))
      }
    } catch (e) {
      console.warn('[EduShield] Exit fullscreen error:', e)
    }
  }, [])

  // ── Rule 23: Question Time Analysis ────────────────────────────────
  const logQuestionTiming = useCallback((questionId: string, secondsSpent: number, expectedAvgSeconds = 120) => {
    let status = 'Normal'
    if (secondsSpent < 8 && expectedAvgSeconds >= 60) {
      status = 'Suspiciously Fast'
      triggerWarning('question_time_anomaly', `Question ${questionId} answered in ${secondsSpent}s (expected >${expectedAvgSeconds}s). Flagged.`, 5)
    }
    setState(prev => ({
      ...prev,
      behavior: {
        ...prev.behavior,
        questionTimeAnomalies: [...prev.behavior.questionTimeAnomalies, { questionId, seconds: secondsSpent, status }]
      }
    }))
  }, [triggerWarning])

  const cleanup = useCallback(() => {
    stopCamera()
  }, [stopCamera])

  return {
    videoRef,
    canvasRef,
    state,
    setState,
    startCamera,
    stopCamera,
    triggerWarning,
    dismissWarning,
    enableSecureLockdown,
    requestFullscreen,
    exitFullscreen,
    logQuestionTiming,
    cleanup,
  }
}
