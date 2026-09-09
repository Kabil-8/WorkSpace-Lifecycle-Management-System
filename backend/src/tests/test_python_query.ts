import dotenv from 'dotenv'
import { OpenDomainAIEngine } from '../ai/OpenDomainAIEngine.js'

dotenv.config()

async function testMernStackQuery() {
  console.log('🧪 Testing EDEN Query Resolution for "i need to take studies on mern stack"...\n')
  const userContext = { userId: 'std-101', userName: 'Alpha', role: 'student', department: 'Computer Science' }

  const res = await OpenDomainAIEngine.resolveQuery('i need to take studies on mern stack', userContext)
  console.log('--- EDEN RESPONSE ---')
  console.log(res.text)
  console.log('---------------------\n')

  if (res.text.includes('MERN Stack') && res.text.includes('MongoDB') && res.text.includes('React.js') && !res.text.includes('Regarding your question on')) {
    console.log('✅ PASS: "i need to take studies on mern stack" returned structured MERN Stack Master Roadmap!')
    process.exit(0)
  } else {
    console.error('❌ FAIL: Returned generic response!')
    process.exit(1)
  }
}

testMernStackQuery().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
