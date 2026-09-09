import mongoose, { Schema, Document } from 'mongoose'

export interface IEyeLog {
  timestamp: string
  gazeDirection: 'Center' | 'Left' | 'Right' | 'Up' | 'Down'
  irisRatio: number
  eyeFocusScore: number
}

export interface IHeadLog {
  timestamp: string
  orientation: 'Forward' | 'Left' | 'Right' | 'Up' | 'Down' | 'Tilt'
  pitch: number
  yaw: number
  roll: number
}

export interface IBrowserEventLog {
  timestamp: string
  eventType: 'tab_switch' | 'fullscreen_exit' | 'window_blur' | 'devtools_open' | 'clipboard_copy' | 'clipboard_paste' | 'keyboard_shortcut'
  details: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface IWarningLog {
  timestamp: string
  warningNumber: number
  type: 'Looking Away' | 'Face Missing' | 'Multiple Faces' | 'Browser Switched' | 'Audio Detected' | 'DevTools Opened'
  message: string
}

export interface IProctorLog extends Document {
  attemptId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  examId: mongoose.Types.ObjectId
  eyeTrackingLogs: IEyeLog[]
  headMovementLogs: IHeadLog[]
  browserEvents: IBrowserEventLog[]
  warningLogs: IWarningLog[]
  integrityHistory: { timestamp: string; score: number }[]
  createdAt: Date
  updatedAt: Date
}

const ProctorLogSchema = new Schema<IProctorLog>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'StudentAttempt', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    eyeTrackingLogs: [{
      timestamp: String,
      gazeDirection: String,
      irisRatio: Number,
      eyeFocusScore: Number,
    }],
    headMovementLogs: [{
      timestamp: String,
      orientation: String,
      pitch: Number,
      yaw: Number,
      roll: Number,
    }],
    browserEvents: [{
      timestamp: String,
      eventType: String,
      details: String,
      severity: String,
    }],
    warningLogs: [{
      timestamp: String,
      warningNumber: Number,
      type: { type: String },
      message: String,
    }],
    integrityHistory: [{
      timestamp: String,
      score: Number,
    }],
  },
  { timestamps: true }
)

export const ProctorLog = mongoose.model<IProctorLog>('ProctorLog', ProctorLogSchema)
