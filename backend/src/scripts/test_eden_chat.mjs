async function testEden() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edusphere.ai', password: 'EduSphere@2026' })
  })
  const loginJson = await loginRes.json()
  const token = loginJson.token

  console.log('Testing EDEN Chat via authenticated backend...')
  const edenRes = await fetch('http://localhost:5000/api/v1/eden/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'What should I focus on this week to improve my placement readiness for Fullstack Developer?'
    })
  })

  const edenJson = await edenRes.json()
  console.log('EDEN Status:', edenRes.status)
  console.log('EDEN Response:\n', edenJson.reply || edenJson.content || JSON.stringify(edenJson))
}

testEden()
