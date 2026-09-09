import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Building2, Plus, Edit, Trash2, Loader2, X, Save } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { useAppDispatch } from '../../hooks/useStore'
import { addToast } from '../../store/uiSlice'

export default function DepartmentPage() {
  const dispatch = useAppDispatch()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any | null>(null)
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [hodName, setHodName] = useState('')
  const [building, setBuilding] = useState('Block A')
  const [studentCount, setStudentCount] = useState(150)
  const [facultyCount, setFacultyCount] = useState(12)
  const [submitting, setSubmitting] = useState(false)

  const { data: deptsData, isLoading, refetch } = useQuery({
    queryKey: ['adminDepartments'],
    queryFn: adminService.getDepartments,
  })

  const departments = Array.isArray(deptsData) ? deptsData : (deptsData?.data || [])

  const handleOpenAdd = () => {
    setName('')
    setCode('')
    setHodName('')
    setBuilding('Block A')
    setStudentCount(150)
    setFacultyCount(12)
    setIsAddModalOpen(true)
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) return
    setSubmitting(true)

    try {
      await adminService.createDepartment({ name, code, hodName: hodName || 'Dr. Robert Lee', building, studentCount, facultyCount })
      dispatch(addToast({ type: 'success', title: 'Department Created', description: `Department ${name} created successfully!` }))
      setIsAddModalOpen(false)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to create department' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (dept: any) => {
    setEditingDept(dept)
    setName(dept.name)
    setCode(dept.code)
    setHodName(dept.hodName || '')
    setBuilding(dept.building || 'Block A')
    setStudentCount(dept.studentCount || 150)
    setFacultyCount(dept.facultyCount || 12)
  }

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept) return
    setSubmitting(true)

    try {
      await adminService.updateDepartment(editingDept._id || editingDept.id, { name, code, hodName, building, studentCount, facultyCount })
      dispatch(addToast({ type: 'success', title: 'Department Updated', description: `Department ${name} updated successfully!` }))
      setEditingDept(null)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to update department' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    try {
      await adminService.deleteDepartment(id)
      dispatch(addToast({ type: 'success', title: 'Department Deleted', description: 'Department deleted successfully' }))
      setDeletingDeptId(null)
      refetch()
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', description: err.message || 'Failed to delete department' }))
    }
  }

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{departments.length} Real Academic Departments loaded from MongoDB Atlas</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700">
          <Plus size={14} /> Add Department
        </button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {departments.map((dept: any, i: number) => {
            const deptId = dept._id || dept.id || i
            return (
              <motion.div
                key={deptId}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }} className="card p-5 border border-slate-200 dark:border-white/10 relative group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10">
                      <Building2 size={20} className="text-teal-500 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{dept.code} · HoD: {dept.hodName || 'Dr. Robert Lee'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(dept)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => setDeletingDeptId(deptId)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 dark:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {dept.building || 'Block A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[
                    { label: 'Students', value: dept.studentCount || 150 },
                    { label: 'Faculty', value: dept.facultyCount || 12 },
                    { label: 'Courses', value: dept.courseCount || 20 },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-transparent">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                      <p className="text-2xs text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Department Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Department</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-3">
                <div>
                  <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Department Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Data Science & AI" className="input text-xs w-full mt-1 p-2.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Code</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="DSAI" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Building</label>
                    <input type="text" value={building} onChange={e => setBuilding(e.target.value)} placeholder="Block C" className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                </div>
                <div>
                  <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Head of Department (HoD)</label>
                  <input type="text" value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Dr. Elena Vasquez" className="input text-xs w-full mt-1 p-2.5" />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Create Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Department Modal */}
      <AnimatePresence>
        {editingDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Department: {editingDept.name}</h3>
                <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateDepartment} className="space-y-3">
                <div>
                  <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Department Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input text-xs w-full mt-1 p-2.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Code</label>
                    <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Building</label>
                    <input type="text" value={building} onChange={e => setBuilding(e.target.value)} className="input text-xs w-full mt-1 p-2.5" />
                  </div>
                </div>
                <div>
                  <label className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase">Head of Department (HoD)</label>
                  <input type="text" value={hodName} onChange={e => setHodName(e.target.value)} className="input text-xs w-full mt-1 p-2.5" />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setEditingDept(null)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDeptId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-sm space-y-4 text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Department?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Are you sure you want to delete this department? This action cannot be undone.</p>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeletingDeptId(null)} className="px-4 py-2 rounded-xl text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white">Cancel</button>
                <button onClick={() => handleDeleteDepartment(deletingDeptId)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
