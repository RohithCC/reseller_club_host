import { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const decodeToken = (token) => {
  if (!token) return { role: null, email: '' }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      role: payload.role || (payload.isAdmin ? 'super_admin' : ''),
      email: payload.email || '',
      id: payload.id || null,
      name: payload.name || '',
      isAdmin: payload.isAdmin || false,
    }
  } catch {
    return { role: null, email: '' }
  }
}

const cardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const inpSx = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  color: '#111827',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelSx = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 6,
}

const fi = e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }
const bi = e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }

const ROLES = {
  super_admin: { label: 'Super Admin', color: '#2563eb', bg: '#eff6ff' },
  admin: { label: 'Admin', color: '#8b5cf6', bg: '#faf5ff' },
  staff: { label: 'Staff', color: '#d97706', bg: '#fffbeb' },
  bloger: { label: 'Bloger', color: '#059669', bg: '#ecfdf5' },
}

const Profile = ({ token }) => {
  const navigate = useNavigate()
  const decoded = decodeToken(token)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.post(`${backendUrl}/api/user/profile`, {}, { headers: { token } })
        if (data.success) {
          setProfile(data.user)
          setName(data.user.name || '')
        }
      } catch {
        // Super admin (env-var) has no DB record — that's fine
      } finally {
        setLoading(false)
      }
    }
    if (decoded.id) fetchProfile()
    else setLoading(false)
  }, [token])

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/change-password`,
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        { headers: { token } })
      if (data.success) {
        toast.success('Password changed successfully')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setPwSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/update-profile`,
        { name: name.trim() }, { headers: { token } })
      if (data.success) {
        toast.success('Name updated')
        setProfile(prev => prev ? { ...prev, name: name.trim() } : prev)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  const roleInfo = ROLES[decoded.role] || { label: decoded.role || 'Unknown', color: '#6b7280', bg: '#f3f4f6' }

  return (
    <div style={{ maxWidth: 680, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #9ca3af; }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
            My Profile
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Manage your account information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{ ...cardSx, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(profile?.name || decoded.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                {profile?.name || decoded.name || 'Admin User'}
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                background: roleInfo.bg, color: roleInfo.color,
                border: `1px solid ${roleInfo.color}33`,
                whiteSpace: 'nowrap',
              }}>
                {roleInfo.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
              {decoded.email}
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div style={{ ...cardSx, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          Account Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSx}>Email</label>
            <div style={{ ...inpSx, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}>
              {decoded.email || '—'}
            </div>
          </div>
          <div>
            <label style={labelSx}>Role</label>
            <div style={{ ...inpSx, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}>
              {roleInfo.label}
            </div>
          </div>
          {decoded.id && (
            <div>
              <label style={labelSx}>User ID</label>
              <div style={{ ...inpSx, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed', fontSize: 11, fontFamily: 'monospace' }}>
                {decoded.id}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Name */}
      {decoded.id && (
        <div style={{ ...cardSx, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            Display Name
          </h3>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>
            Update how your name appears across the admin panel
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={inpSx}
                onFocus={fi}
                onBlur={bi}
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim() || name === (profile?.name || '')}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: saving || !name.trim() || name === (profile?.name || '')
                  ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: saving || !name.trim() || name === (profile?.name || '') ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div style={{ ...cardSx, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Change Password
        </h3>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px' }}>
          Update your login password
        </p>
        {decoded.id ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelSx}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw.current ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  style={{ ...inpSx, paddingRight: 40 }}
                  onFocus={fi}
                  onBlur={bi}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: 4, display: 'flex',
                  }}
                  aria-label={showPw.current ? 'Hide password' : 'Show password'}
                >
                  {showPw.current ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
                      <path d="M10.73 10.73a3 3 0 004.54 4.54"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label style={labelSx}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="8+ chars, uppercase, lowercase, number, special char"
                  style={{ ...inpSx, paddingRight: 40 }}
                  onFocus={fi}
                  onBlur={bi}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: 4, display: 'flex',
                  }}
                  aria-label={showPw.new ? 'Hide password' : 'Show password'}
                >
                  {showPw.new ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
                      <path d="M10.73 10.73a3 3 0 004.54 4.54"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label style={labelSx}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  style={{ ...inpSx, paddingRight: 40 }}
                  onFocus={fi}
                  onBlur={bi}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: 4, display: 'flex',
                  }}
                  aria-label={showPw.confirm ? 'Hide password' : 'Show password'}
                >
                  {showPw.confirm ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
                      <path d="M10.73 10.73a3 3 0 004.54 4.54"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17}}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword
                    ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 0 0', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, margin: '0 0 4px' }}>
              Super Admin Account
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              You are logged in as the environment-variable super admin. Password is managed in the{' '}
              <code>.env</code> file on the server. To manage other users' passwords, go to the{' '}
              <span
                onClick={() => navigate('/users')}
                style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
              >
                Users page
              </span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
