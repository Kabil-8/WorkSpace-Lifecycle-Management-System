import dotenv from 'dotenv'
dotenv.config({ path: 'backend/.env' })
import mongoose from 'mongoose'
import dns from 'dns'
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']) } catch {}

const MONGO_URI = process.env.MONGO_URI

async function findAlpha() {
  await mongoose.connect(MONGO_URI)
  const User = mongoose.connection.collection('users')
  const AcademicResult = mongoose.connection.collection('academicresults')

  const alpha = await User.find({ $or: [{ name: /alpha/i }, { email: /student/i }] }).limit(10).toArray()
  console.log('Alpha / Student users:', alpha.map(u => ({ id: u._id, name: u.name, email: u.email, cgpa: u.cgpa, semester: u.semester })))

  await mongoose.disconnect()
}

findAlpha().catch(console.error)
