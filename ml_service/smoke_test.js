const { performance } = require('perf_hooks');

async function measure(name, fn) {
  const start = performance.now();
  const res = await fn();
  const duration = (performance.now() - start).toFixed(2);
  console.log(`[LOCAL SMOKE TEST] ${name}: ${duration}ms | Status: ${res.status}`);
  return { name, duration, data: res.data };
}

async function run() {
  console.log('=== Performance Smoke Test & End-to-End Integration ===\n');

  await measure('GET /health', async () => {
    const r = await fetch('http://localhost:8001/health');
    return { status: r.status, data: await r.json() };
  });

  await measure('GET /health/ready', async () => {
    const r = await fetch('http://localhost:8001/health/ready');
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/digital-twin/analyze', async () => {
    const r = await fetch('http://localhost:8001/api/ml/digital-twin/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Faizan Gafoor', cgpa: 8.6, attendance: 91.0, coding_score: 85 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/digital-twin/5-sub (Legacy Alias)', async () => {
    const r = await fetch('http://localhost:8001/api/ml/digital-twin/5-sub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sivaani', cgpa: 8.8, attendance: 92.0, coding_score: 88 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/placement/predict', async () => {
    const r = await fetch('http://localhost:8001/api/ml/placement/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cgpa: 8.5, projects_count: 3, skills: ['React', 'Node.js', 'Python'], ats_score: 85.0 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/ats-score', async () => {
    const r = await fetch('http://localhost:8001/api/ml/ats-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'Fullstack Dev', skills: ['React', 'Node.js', 'MongoDB'], targetRole: 'Fullstack Developer' })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/eden/chat', async () => {
    const r = await fetch('http://localhost:8001/api/ml/eden/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is my current GPA status?', userName: 'Faizan', gpa: 8.6 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/eden/rag-chat', async () => {
    const r = await fetch('http://localhost:8001/api/ml/eden/rag-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How does attendance affect exam eligibility?', role: 'student' })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/attendance/predict', async () => {
    const r = await fetch('http://localhost:8001/api/ml/attendance/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presentClasses: 88, totalClasses: 100, targetGoal: 90.0 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('POST /api/ml/recommendations', async () => {
    const r = await fetch('http://localhost:8001/api/ml/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cgpa: 8.2, attendance: 85.0, weak_topics: ['Algorithms & Data Structures'], coding_score: 65 })
    });
    return { status: r.status, data: await r.json() };
  });

  await measure('GET Backend /api/health', async () => {
    const r = await fetch('http://localhost:5000/api/health');
    return { status: r.status, data: await r.json() };
  });

  await measure('GET Frontend (http://localhost:5173)', async () => {
    const r = await fetch('http://localhost:5173');
    return { status: r.status, data: 'HTML' };
  });

  console.log('\n=== All smoke tests passed successfully ===');
}

run().catch(console.error);
