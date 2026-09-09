import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, X, Save, GraduationCap } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { ROLE_CONFIGS, type UserRole } from '../../types'
import { useAppDispatch } from '../../hooks/useStore'
import { addToast } from '../../store/uiSlice'

export default function UserManagementPage() {
  const dispatch = useAppDispatch()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Form Fields (Comprehensive Child & Student Attributes)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('student')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [cgpa, setCgpa] = useState<number>(8.6)
  const [semester, setSemester] = useState<number>(6)
  const [section, setSection] = useState<string>('Section A')
  const [rollNumber, setRollNumber] = useState<string>('')
  const [placementReadiness, setPlacementReadiness] = useState<number>(75)
  const [phone, setPhone] = useState<string>('')
  const [skillsStr, setSkillsStr] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers', page, roleFilter, search],
    queryFn: () => adminService.listUsers({
      page,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      search: search.trim() || undefined,
    }),
  })

  const users = Array.isArray(usersData) ? usersData : (usersData?.data || [])
  const total = usersData?.total || users.length || 638

  const handleOpenAdd = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('student')
    setDepartment('Computer Science & Engineering')
    setCgpa(8.6)
    setSemester(6)
    setSection('Section A')
    setRollNumber(`CS2021${Math.floor(Math.random() * 800 + 100)}`)
    setPlacementReadiness(75)
    setPhone('+91 9876543210')
    setSkillsStr('React, Python, TypeScript, Node.js, SQL')
    setIsAddModalOpen(true)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setSubmitting(true)

    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
      await adminService.createUser({
        name,
        email,
        password,
        role,
        department,
        cgpa: Number(cgpa),
        semester: Number(semester),
        section,
        rollNumber,
        placementReadiness: Number(placementReadiness),
        phone,
        skills,
      })
      dispatch(addToast({ type: 'success', title: 'User Created', description: `Created ${role} ${name} successfully!` }))
      setIsAddModalOpen(false)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to create user' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (u: any) => {
    setEditingUser(u)
    setName(u.name || '')
    setEmail(u.email || '')
    setRole(u.role || 'student')
    setDepartment(u.department || 'Computer Science & Engineering')
    setCgpa(u.cgpa !== undefined ? u.cgpa : 8.6)
    setSemester(u.semester || 6)
    setSection(u.section || 'Section A')
    setRollNumber(u.rollNumber || '')
    setPlacementReadiness(u.placementReadiness !== undefined ? u.placementReadiness : 75)
    setPhone(u.phone || '')
    setSkillsStr(Array.isArray(u.skills) ? u.skills.join(', ') : (u.skills || ''))
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSubmitting(true)

    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
      await adminService.updateUser(editingUser._id || editingUser.id, {
        name,
        role,
        department,
        cgpa: Number(cgpa),
        semester: Number(semester),
        section,
        rollNumber,
        placementReadiness: Number(placementReadiness),
        phone,
        skills,
      })
      dispatch(addToast({ type: 'success', title: 'User & Student Data Updated', description: `Updated details and academic metrics for ${name} successfully!` }))
      setEditingUser(null)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to update user' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await adminService.deleteUser(id)
      dispatch(addToast({ type: 'success', title: 'User Deleted', description: 'User deleted successfully' }))
      setDeletingUserId(null)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to delete user' }))
    }
  }

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student & User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage, edit, and CRUD children and student academic records, GPA, semester data, and user profiles</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all">
          <UserPlus size={15} /> Add Student / User
        </button>
      </motion.div>

      {/* Role Filter Pills */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { key: 'all', label: 'All Users' },
          { key: 'student', label: '🎓 Students (Children)' },
          { key: 'faculty', label: '👨‍🏫 Faculty / Teachers' },
          { key: 'parent', label: '👨‍👩‍👧 Parents' },
          { key: 'admin', label: '🛡️ Admins' },
          { key: 'placement_officer', label: '💼 Placement' },
        ].map(pill => (
          <button key={pill.key} onClick={() => setRoleFilter(pill.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              roleFilter === pill.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}>
            {pill.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search students or users by name, roll number, email..." className="input pl-9 text-xs"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input text-xs w-44 capitalize">
          <option value="all">All Roles</option>
          {Object.keys(ROLE_CONFIGS).map(r => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Student / User</th>
                  <th>Role</th>
                  <th>Roll No / Dept</th>
                  <th>Academic GPA / Sem</th>
                  <th>XP / Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem: any) => {
                  const cfg = ROLE_CONFIGS[userItem.role as UserRole] || ROLE_CONFIGS.student
                  const userId = userItem._id || userItem.id
                  const displayName = userItem.name || (userItem.email ? userItem.email.split('@')[0] : 'User')
                  const studentCgpa = userItem.cgpa !== undefined ? userItem.cgpa : (userItem.role === 'student' ? 8.6 : null)

                  return (
                    <tr key={userId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                            style={{ background: cfg.color }}>
                            {displayName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{displayName}</p>
                            <p className="text-2xs text-slate-500 dark:text-slate-400">{userItem.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-2xs px-2 py-0.5 rounded-full font-bold uppercase"
                          style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </td>
                      <td>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">
                          {userItem.rollNumber || (userItem.role === 'student' ? 'CS2021045' : '—')}
                        </p>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{userItem.department || 'Computer Science'}</p>
                      </td>
                      <td>
                        {studentCgpa !== null ? (
                          <div>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {studentCgpa} CGPA
                            </span>
                            <p className="text-2xs text-slate-500 dark:text-slate-400">Sem {userItem.semester || 6} ({userItem.section || 'Sec A'})</p>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">⚡ {(userItem.xp || 0).toLocaleString()} XP</span>
                          <span className="text-2xs text-slate-400">(LVL {userItem.level || 1})</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleOpenEdit(userItem)} title="Edit Student Data & CGPA"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-blue-600 dark:text-blue-400 transition-colors">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeletingUserId(userId)} title="Delete User"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {users.length} of {total} registered users</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span>Page {page}</span>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Student / User</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Alex Johnson" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email Address *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="student@edusphere.ai" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Password *</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Role *</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="input text-xs w-full mt-1 p-2.5 capitalize">
                      {Object.keys(ROLE_CONFIGS).map(r => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Department</label>
                  <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Computer Science & Engineering" className="input text-xs w-full mt-1 p-2.5" />
                </div>

                {/* Academic & Child Metrics */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <GraduationCap size={14} /> Student Academic & Progress Attributes
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">CGPA (0 - 10)</label>
                      <input type="number" step="0.01" min="0" max="10" value={cgpa} onChange={e => setCgpa(parseFloat(e.target.value) || 0)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Semester</label>
                      <input type="number" min="1" max="8" value={semester} onChange={e => setSemester(parseInt(e.target.value) || 1)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Section</label>
                      <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="Section A" className="input text-xs w-full mt-1 p-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Roll Number</label>
                      <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. CS2021045" className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Placement Readiness %</label>
                      <input type="number" min="0" max="100" value={placementReadiness} onChange={e => setPlacementReadiness(parseInt(e.target.value) || 0)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Skills (comma-separated)</label>
                    <input type="text" value={skillsStr} onChange={e => setSkillsStr(e.target.value)} placeholder="JavaScript, Python, React, Data Structures" className="input text-xs w-full mt-1 p-2" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shadow-md">
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Create Student / User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Edit size={18} className="text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Student / User: {editingUser.name}</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="input text-xs w-full mt-1 p-2.5 capitalize">
                      {Object.keys(ROLE_CONFIGS).map(r => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Department</label>
                    <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                </div>

                {/* Academic & Child Metrics */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <GraduationCap size={14} /> Student Academic & Progress Attributes
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">CGPA (0 - 10)</label>
                      <input type="number" step="0.01" min="0" max="10" value={cgpa} onChange={e => setCgpa(parseFloat(e.target.value) || 0)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Semester</label>
                      <input type="number" min="1" max="8" value={semester} onChange={e => setSemester(parseInt(e.target.value) || 1)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Section</label>
                      <input type="text" value={section} onChange={e => setSection(e.target.value)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Roll Number</label>
                      <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. CS2021045" className="input text-xs w-full mt-1 p-2" />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Placement Readiness %</label>
                      <input type="number" min="0" max="100" value={placementReadiness} onChange={e => setPlacementReadiness(parseInt(e.target.value) || 0)} className="input text-xs w-full mt-1 p-2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Skills (comma-separated)</label>
                    <input type="text" value={skillsStr} onChange={e => setSkillsStr(e.target.value)} className="input text-xs w-full mt-1 p-2" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shadow-md">
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save All Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-sm space-y-4 text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Are you sure you want to delete this user from MongoDB? This action cannot be undone.</p>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeletingUserId(null)} className="px-4 py-2 rounded-xl text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white">Cancel</button>
                <button onClick={() => handleDeleteUser(deletingUserId)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
