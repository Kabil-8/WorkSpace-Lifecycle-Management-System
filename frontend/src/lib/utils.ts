import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

// ── Class Name Utility ──────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date Formatting ─────────────────────────────────────────────────────
export function formatDate(date: Date | string, fmt = 'MMM d, yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

// ── Number Formatting ────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// ── String Utilities ─────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function titleCase(str: string): string {
  return str.split(/[\s_-]+/).map(capitalize).join(' ')
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str
}

export function generateInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Color Utilities ──────────────────────────────────────────────────────
export function getGradeColor(grade: string): string {
  const g = grade.toUpperCase()
  if (['S', 'A+', 'A'].includes(g)) return '#10B981'
  if (['B+', 'B'].includes(g)) return '#2563EB'
  if (['C+', 'C'].includes(g)) return '#F59E0B'
  if (['D'].includes(g)) return '#F97316'
  return '#EF4444'
}

export function getScoreColor(score: number): string {
  if (score >= 85) return '#10B981'
  if (score >= 70) return '#2563EB'
  if (score >= 55) return '#F59E0B'
  if (score >= 40) return '#F97316'
  return '#EF4444'
}

export function getAttendanceColor(pct: number): string {
  if (pct >= 85) return '#10B981'
  if (pct >= 75) return '#F59E0B'
  return '#EF4444'
}

// ── Random Utilities ─────────────────────────────────────────────────────
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ── Avatar Color ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#2563EB', '#1D4ED8'], ['#8B5CF6', '#7C3AED'], ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'], ['#EF4444', '#DC2626'], ['#06B6D4', '#0891B2'],
  ['#EC4899', '#DB2777'], ['#84CC16', '#65A30D'],
]

export function getAvatarGradient(name: string): [string, string] {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  const pair = AVATAR_COLORS[idx]
  return [pair[0], pair[1]]
}

// ── Countdown ────────────────────────────────────────────────────────────
export function getCountdown(targetDate: Date): { days: number; hours: number; minutes: number; seconds: number } {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

// ── XP Level Calculator ───────────────────────────────────────────────────
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export function levelToXp(level: number): number {
  return ((level - 1) ** 2) * 100
}

export function xpProgressToNextLevel(xp: number): number {
  const level = xpToLevel(xp)
  const currentLevelXp = levelToXp(level)
  const nextLevelXp = levelToXp(level + 1)
  return Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
}

// ── Debounce ─────────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}

// ── Copy to Clipboard ─────────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true }
  catch { return false }
}

// ── Grade Converter ──────────────────────────────────────────────────────
export function scoreToGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  return 'F'
}
