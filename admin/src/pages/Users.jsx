// pages/Users.jsx
// Admin panel User Management (super_admin only)
// Add, edit role, change password, delete admin/staff users

import axios from 'axios'
import React, { useEffect, useState, useCallback } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

// ── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    staff: 'bg-amber-100 text-amber-700 border-amber-200',
    bloger: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${styles[role] || 'bg-gray-100 text-gray-500'}`}>
      {role === 'admin' ? 'Admin' : role === 'bloger' ? 'Bloger' : 'Staff'}
    </span>
  )
}

// ── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({ children, onClose, title }) => (
  <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
    <div className='bg-white rounded-2xl w-full max-w-md shadow-xl' onClick={e => e.stopPropagation()}>
      <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
        <h3 className='text-lg font-bold text-gray-800'>{title}</h3>
        <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl leading-none'>×</button>
      </div>
      <div className='p-6'>
        {children}
      </div>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
const Users = ({ token }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPass, setAddPass] = useState('')
  const [addRole, setAddRole] = useState('staff')
  const [addLoading, setAddLoading] = useState(false)

  const [editUser, setEditUser] = useState(null)
  const [editRole, setEditRole] = useState('staff')
  const [editLoading, setEditLoading] = useState(false)

  const [pwUser, setPwUser] = useState(null)
  const [pwNew, setPwNew] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Fetch admin users ──────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin-users`,
        {},
        { headers: { token } }
      )
      if (data.success) setUsers(data.users)
      else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Add user ───────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addName.trim() || !addEmail.trim() || !addPass.trim()) {
      toast.error('All fields required')
      return
    }
    setAddLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin-users/add`,
        { name: addName.trim(), email: addEmail.trim(), password: addPass, role: addRole },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        setShowAdd(false)
        setAddName(''); setAddEmail(''); setAddPass(''); setAddRole('staff')
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setAddLoading(false)
    }
  }

  // ── Update role ────────────────────────────────────────────────────────────
  const handleUpdateRole = async () => {
    if (!editUser) return
    setEditLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin-users/update`,
        { userId: editUser._id, role: editRole },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        setEditUser(null)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwNew.trim()) {
      toast.error('New password is required')
      return
    }
    setPwLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin-users/change-password`,
        { userId: pwUser._id, newPassword: pwNew },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        setPwUser(null)
        setPwNew('')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin-users/delete`,
        { userId: deleteConfirm._id },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        setDeleteConfirm(null)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Input class ────────────────────────────────────────────────────────────
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white'

  return (
    <div className='flex flex-col gap-4'>

      {/* ── Header ── */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h2 className='text-xl font-bold text-gray-800'>User Management</h2>
          <p className='text-sm text-gray-500'>{users.length} admin users</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold
            flex items-center gap-2 transition-colors shadow-sm'>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add User
        </button>
      </div>

      {/* ── Table header ── */}
      <div className='hidden md:grid grid-cols-[1fr_1fr_100px_100px_180px] items-center
        px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wide'>
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span className='text-center'>Status</span>
        <span className='text-center'>Actions</span>
      </div>

      {/* ── Rows ── */}
      {loading ? (
        <div className='text-center py-20 text-gray-400'>Loading...</div>
      ) : users.length === 0 ? (
        <div className='text-center py-20 text-gray-400'>No admin users found</div>
      ) : (
        users.map(user => (
          <div key={user._id}
            className='grid grid-cols-[1fr] md:grid-cols-[1fr_1fr_100px_100px_180px] items-center gap-3
              px-4 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow'>

            {/* Mobile: stacked layout */}
            <div className='md:hidden'>
              <div className='flex items-center justify-between mb-1'>
                <p className='font-semibold text-gray-800 text-sm'>{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
              <p className='text-xs text-gray-500 mb-2'>{user.email}</p>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  user.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </span>
                <button onClick={() => { setEditUser(user); setEditRole(user.role) }}
                  className='text-xs text-blue-600 hover:underline'>Edit Role</button>
                <button onClick={() => { setPwUser(user); setPwNew('') }}
                  className='text-xs text-blue-600 hover:underline'>Password</button>
                <button onClick={() => setDeleteConfirm(user)}
                  className='text-xs text-red-500 hover:underline'>Delete</button>
              </div>
            </div>

            {/* Desktop columns */}
            <p className='hidden md:block font-semibold text-gray-800 text-sm'>{user.name}</p>
            <p className='hidden md:block text-sm text-gray-600 truncate'>{user.email}</p>
            <div className='hidden md:block'>
              <RoleBadge role={user.role} />
            </div>
            <div className='hidden md:flex justify-center'>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                user.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {user.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>

            {/* Desktop actions */}
            <div className='hidden md:flex items-center gap-2 justify-center'>
              <button onClick={() => { setEditUser(user); setEditRole(user.role) }}
                className='px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-xs font-medium'>
                Edit Role
              </button>
              <button onClick={() => { setPwUser(user); setPwNew('') }}
                className='px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-xs font-medium'>
                Password
              </button>
              <button onClick={() => setDeleteConfirm(user)}
                className='px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors text-xs font-medium'>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* ══ ADD USER MODAL ════════════════════════════════════════════════════ */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title='Add Admin User'>
          <form onSubmit={handleAdd} className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>Full Name</label>
              <input value={addName} onChange={e => setAddName(e.target.value)}
                className={inp} placeholder='John Doe' required />
            </div>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>Email</label>
              <input value={addEmail} onChange={e => setAddEmail(e.target.value)}
                type='email' className={inp} placeholder='user@example.com' required />
            </div>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>Password</label>
              <input value={addPass} onChange={e => setAddPass(e.target.value)}
                type='password' className={inp} placeholder='Strong password' required />
              <p className='text-[10px] text-gray-400 mt-1'>Min 8 chars, uppercase, lowercase, number & special char</p>
            </div>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>Role</label>
              <div className='flex gap-3'>
                {['staff', 'admin', 'bloger'].map(r => (
                  <label key={r}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer
                      transition-all text-sm font-semibold
                      ${addRole === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}>
                    <input type='radio' name='addRole' value={r} checked={addRole === r}
                      onChange={e => setAddRole(e.target.value)} className='sr-only' />
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${addRole === r ? 'border-blue-500' : 'border-gray-300'}`}>
                      {addRole === r && <span className='w-2 h-2 rounded-full bg-blue-500' />}
                    </span>
                    {r === 'admin' ? 'Admin' : r === 'bloger' ? 'Bloger' : 'Staff'}
                  </label>
                ))}
              </div>
              <p className='text-[10px] text-gray-400 mt-1.5'>
                {addRole === 'admin' ? 'Full access except user management' : addRole === 'bloger' ? 'Content only (Blog, Hero, CTA, Footer)' : 'Orders + Products (add/list) only'}
              </p>
            </div>
            <div className='flex gap-3 pt-1'>
              <button type='button' onClick={() => setShowAdd(false)}
                className='flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                Cancel
              </button>
              <button type='submit' disabled={addLoading}
                className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                  text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2'>
                {addLoading
                  ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Creating...</>
                  : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ EDIT ROLE MODAL ══════════════════════════════════════════════════ */}
      {editUser && (
        <Modal onClose={() => setEditUser(null)} title={`Edit Role: ${editUser.name}`}>
          <div className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>Current: <RoleBadge role={editUser.role} /></label>
              <div className='flex gap-3 mt-2'>
                {['staff', 'admin', 'bloger'].map(r => (
                  <label key={r}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer
                      transition-all text-sm font-semibold
                      ${editRole === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}>
                    <input type='radio' name='editRole' value={r} checked={editRole === r}
                      onChange={e => setEditRole(e.target.value)} className='sr-only' />
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${editRole === r ? 'border-blue-500' : 'border-gray-300'}`}>
                      {editRole === r && <span className='w-2 h-2 rounded-full bg-blue-500' />}
                    </span>
                    {r === 'admin' ? 'Admin' : r === 'bloger' ? 'Bloger' : 'Staff'}
                  </label>
                ))}
              </div>
            </div>
            <div className='flex gap-3 pt-1'>
              <button onClick={() => setEditUser(null)}
                className='flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                Cancel
              </button>
              <button onClick={handleUpdateRole} disabled={editLoading}
                className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                  text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2'>
                {editLoading
                  ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Saving...</>
                  : 'Save Role'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ CHANGE PASSWORD MODAL ════════════════════════════════════════════ */}
      {pwUser && (
        <Modal onClose={() => setPwUser(null)} title={`Change Password: ${pwUser.name}`}>
          <form onSubmit={handleChangePassword} className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-semibold text-gray-500 block mb-1'>New Password</label>
              <input value={pwNew} onChange={e => setPwNew(e.target.value)}
                type='password' className={inp} placeholder='Enter new strong password' required />
              <p className='text-[10px] text-gray-400 mt-1'>Min 8 chars, uppercase, lowercase, number & special char</p>
            </div>
            <div className='flex gap-3 pt-1'>
              <button type='button' onClick={() => setPwUser(null)}
                className='flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                Cancel
              </button>
              <button type='submit' disabled={pwLoading}
                className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                  text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2'>
                {pwLoading
                  ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Changing...</>
                  : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ DELETE CONFIRM MODAL ═════════════════════════════════════════════ */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title='Delete User'>
          <div className='text-center'>
            <div className='text-4xl mb-3'>⚠️</div>
            <p className='text-gray-800 font-semibold mb-1'>{deleteConfirm.name}</p>
            <p className='text-sm text-gray-500 mb-1'>{deleteConfirm.email}</p>
            <p className='text-xs text-gray-400 mb-6'>
              This will permanently remove this user from the admin panel.
            </p>
            <div className='flex gap-3'>
              <button onClick={() => setDeleteConfirm(null)}
                className='flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50'>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className='flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300
                  text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2'>
                {deleteLoading
                  ? <><span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Deleting...</>
                  : 'Delete User'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default Users
