import fs from 'fs'
import path from 'path'

const PRODUCTION_DIRS = [
  path.resolve(process.cwd(), 'src/ai'),
  path.resolve(process.cwd(), 'src/controllers'),
  path.resolve(process.cwd(), 'src/services'),
  path.resolve(process.cwd(), 'src/routes'),
]

// Suspicious patterns that indicate hardcoded/fake/mock data in production
const SUSPICIOUS_PATTERNS = [
  /std-101/i,
  /student-001/i,
  /demo-user/i,
  /int\[\]\s*numbers\s*=\s*\{\s*10,\s*20,\s*30,\s*40,\s*50\s*\}/i,
  /₹6\.0L\s*-\s*₹12\.0L\s*PA/i,
  /learningPaceScore\s*:\s*85/i,
]

function scanDirectory(dirPath: string): { scannedFiles: number; findings: string[] } {
  let scannedFiles = 0
  const findings: string[] = []

  if (!fs.existsSync(dirPath)) return { scannedFiles, findings }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'tests') continue
      const sub = scanDirectory(fullPath)
      scannedFiles += sub.scannedFiles
      findings.push(...sub.findings)
    } else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/i.test(entry.name)) {
      scannedFiles++
      const content = fs.readFileSync(fullPath, 'utf-8')
      const relativePath = path.relative(process.cwd(), fullPath)

      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(content)) {
          findings.push(`[${relativePath}] Matched suspicious pattern: ${pattern.toString()}`)
        }
      }
    }
  }

  return { scannedFiles, findings }
}

function runNoMockGate() {
  console.log('🛡️ EduSphere Enterprise Zero-Mock Gate v4 (EDEN AI Architecture)\n')

  let totalScanned = 0
  const allFindings: string[] = []

  for (const dir of PRODUCTION_DIRS) {
    const res = scanDirectory(dir)
    totalScanned += res.scannedFiles
    allFindings.push(...res.findings)
  }

  console.log(`📁 Production source files scanned: ${totalScanned}`)
  console.log(`🔎 Suspicious findings: ${allFindings.length}`)

  if (allFindings.length > 0) {
    console.error('\n❌ ZERO-MOCK GATE FAILED:')
    allFindings.forEach(f => console.error('  - ' + f))
    process.exit(1)
  } else {
    console.log('\n✅ ZERO-MOCK GATE PASSED')
    console.log('No suspicious canned responses or dummy student identity patterns detected in production AI path.\n')
    process.exit(0)
  }
}

runNoMockGate()
