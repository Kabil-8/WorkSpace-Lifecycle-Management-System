async function verify() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edusphere.ai', password: 'EduSphere@2026' })
  })
  const loginJson = await loginRes.json()
  const token = loginJson.token

  const syncRes = await fetch('http://localhost:5000/api/v1/profile/sync-external', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      leetcodeUsername: 'Kabil_08',
      githubUsername: 'alex-developer',
      linkedinUrl: 'https://linkedin.com/in/k-kabil-091233325',
      linkedinHeadline: 'Software Engineer & AI Researcher | Final Year CSE',
      linkedinSkills: ['Data Structures & Algorithms', 'Full Stack Development', 'System Design', 'Cloud Computing', 'TypeScript'],
      linkedinCertifications: ['AWS Certified Cloud Practitioner', 'Meta Certified Front-End Developer']
    })
  })

  const syncJson = await syncRes.json()
  console.log('Extracted LeetCode Stats:', JSON.stringify(syncJson.data?.externalProfiles?.leetcode, null, 2))
  console.log('Extracted LinkedIn Stats:', JSON.stringify(syncJson.data?.externalProfiles?.linkedin, null, 2))
}

verify()
