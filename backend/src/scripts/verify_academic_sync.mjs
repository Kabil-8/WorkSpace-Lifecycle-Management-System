async function testDataDrivenEndpoints() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edusphere.ai', password: 'EduSphere@2026' })
  })
  const loginJson = await loginRes.json()
  console.log('Login Result:', { success: loginJson.success, token: !!loginJson.token, userCgpa: loginJson.user?.cgpa })

  const token = loginJson.token
  if (!token) return

  // 1. Transcript
  const transRes = await fetch('http://localhost:5000/api/v1/academic/transcript', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const transJson = await transRes.json()
  console.log('Transcript API:', {
    success: transJson.success,
    hasData: transJson.data?.hasData,
    cgpa: transJson.data?.cgpa,
    semestersCount: transJson.data?.semesters?.length,
    latestSemSgpa: transJson.data?.semesters?.[transJson.data.semesters.length - 1]?.sgpa
  })

  // 2. Dashboard
  const dashRes = await fetch('http://localhost:5000/api/v1/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const dashJson = await dashRes.json()
  console.log('Dashboard API:', {
    success: dashJson.success,
    userCgpa: dashJson.data?.user?.cgpa,
    gpaHistory: dashJson.data?.gpaHistory,
  })

  // 3. Digital Twin
  const twinRes = await fetch('http://localhost:5000/api/v1/digital-twin/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const twinJson = await twinRes.json()
  console.log('Digital Twin API:', {
    success: twinJson.success,
    predictedCGPA: twinJson.data?.predictedCGPA,
    placementProbabilityPct: twinJson.data?.placementProbabilityPct,
    learningPaceScore: twinJson.data?.learningPaceScore,
    codingProficiencyScore: twinJson.data?.codingProficiencyScore
  })
}

testDataDrivenEndpoints().catch(console.error)
