import { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ToggleSwitch from '../components/ToggleSwitch'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
  'Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
]

const cardSx = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
}

const METHOD_OPTIONS = [
  { value: 'standard', label: 'Standard Delivery', defaultDaysMin: 4, defaultDaysMax: 7, defaultCharge: 49 },
  { value: 'express',  label: 'Express Delivery',  defaultDaysMin: 1, defaultDaysMax: 2, defaultCharge: 99 },
  { value: 'same_day', label: 'Same Day Delivery',  defaultDaysMin: 0, defaultDaysMax: 0, defaultCharge: 149 },
  { value: 'pickup',   label: 'Pickup',             defaultDaysMin: 0, defaultDaysMax: 0, defaultCharge: 0 },
]

// ─── Delivery Rule Form ───────────────────────────────────────────────
const emptyForm = () => ({
  name: '', charge: 0, freeAbove: 0, method: 'standard',
  applicableRegions: [], estimatedDaysMin: 3, estimatedDaysMax: 7, isActive: true,
})

// ─── Payment Controller Page ─────────────────────────────────────────
const PaymentController = ({ token }) => {
  const [tab, setTab] = useState('delivery')

  // ── Delivery state ──────────────────────────────────────────────────
  const [rules, setRules] = useState([])
  const [loadingRules, setLoadingRules] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  // ── COD state ───────────────────────────────────────────────────────
  const [codSettings, setCodSettings] = useState({})
  const [codLoading, setCodLoading] = useState(true)
  const [codSaving, setCodSaving] = useState(null)

  // ── Fetch delivery rules ────────────────────────────────────────────
  const fetchRules = async () => {
    setLoadingRules(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/delivery/admin/all`, { headers: { token } })
      if (data.success) setRules(data.options)
      else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoadingRules(false)
    }
  }

  // ── Fetch COD settings ──────────────────────────────────────────────
  const fetchCod = async () => {
    setCodLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/cod/admin`, { headers: { token } })
      if (data.success) {
        const map = {}
        data.settings.forEach(s => { map[s.state] = s })
        setCodSettings(map)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setCodLoading(false)
    }
  }

  useEffect(() => { fetchRules(); fetchCod() }, [])

  // ── Delivery handlers ───────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    const f = emptyForm()
    f.name = METHOD_OPTIONS[0].label
    setForm(f)
    setShowForm(true)
  }

  const openEdit = (r) => {
    setEditingId(r._id)
    setForm({
      name: r.name || '', charge: r.charge || 0, freeAbove: r.freeAbove || 0,
      method: r.method || 'standard', applicableRegions: r.applicableRegions || [],
      estimatedDaysMin: r.estimatedDaysMin || 3, estimatedDaysMax: r.estimatedDaysMax || 7, isActive: r.isActive,
    })
    setShowForm(true)
  }

  const handleMethodChange = (method) => {
    const opt = METHOD_OPTIONS.find(m => m.value === method) || METHOD_OPTIONS[0]
    setForm(f => ({
      ...f,
      method,
      name: opt.label,
      charge: f.charge === 0 ? opt.defaultCharge : f.charge,
      estimatedDaysMin: f.estimatedDaysMin === 3 ? opt.defaultDaysMin : f.estimatedDaysMin,
      estimatedDaysMax: f.estimatedDaysMax === 7 ? opt.defaultDaysMax : f.estimatedDaysMax,
    }))
  }

  const handleSaveRule = async (e) => {
    e.preventDefault()
    if (form.applicableRegions.length === 0) return toast.error('Select a state')
    if (!form.method) return toast.error('Select a delivery method')
    setSaving(true)
    try {
      const payload = { ...form, charge: Number(form.charge), freeAbove: Number(form.freeAbove), estimatedDaysMin: Number(form.estimatedDaysMin), estimatedDaysMax: Number(form.estimatedDaysMax) }
      if (editingId) {
        const { data } = await axios.put(`${backendUrl}/api/delivery/${editingId}`, payload, { headers: { token } })
        if (data.success) toast.success('Updated')
        else throw new Error(data.message)
      } else {
        const { data } = await axios.post(`${backendUrl}/api/delivery`, payload, { headers: { token } })
        if (data.success) toast.success('Created')
        else throw new Error(data.message)
      }
      setShowForm(false); fetchRules()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally { setSaving(false) }
  }

  const handleDeleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return
    try {
      const { data } = await axios.delete(`${backendUrl}/api/delivery/${id}`, { headers: { token } })
      if (data.success) { toast.success('Deleted'); fetchRules() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
  }

  const handleToggleRule = async (id, val) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/delivery/${id}`, { isActive: val }, { headers: { token } })
      if (data.success) fetchRules()
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
  }

  // ── COD handlers ────────────────────────────────────────────────────
  const handleCodToggle = async (state, enabled) => {
    setCodSaving(state)
    try {
      const cur = codSettings[state] || {}
      const { data } = await axios.put(`${backendUrl}/api/cod/admin/${encodeURIComponent(state)}`,
        { enabled, minOrderValue: cur.minOrderValue || 0, maxOrderValue: cur.maxOrderValue || 0 },
        { headers: { token } }
      )
      if (data.success) { setCodSettings(prev => ({ ...prev, [state]: data.setting })); toast.success(`${state}: COD ${enabled ? 'on' : 'off'}`) }
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setCodSaving(null) }
  }

  const handleCodSave = async (state) => {
    setCodSaving(state)
    try {
      const s = codSettings[state] || {}
      const { data } = await axios.put(`${backendUrl}/api/cod/admin/${encodeURIComponent(state)}`,
        { enabled: s.enabled || false, minOrderValue: Number(s.minOrderValue || 0), maxOrderValue: Number(s.maxOrderValue || 0) },
        { headers: { token } }
      )
      if (data.success) { setCodSettings(prev => ({ ...prev, [state]: data.setting })); toast.success(`${state} saved`) }
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setCodSaving(null) }
  }

  const updateCodField = (state, field, val) => {
    setCodSettings(prev => ({
      ...prev,
      [state]: { ...(prev[state] || { state, enabled: false }), [field]: val },
    }))
  }

  const inpSx = {
    width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827',
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const selectSx = {
    ...inpSx, appearance: 'none', cursor: 'pointer', background: '#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M2 4l4 4 4-4%27/%3E%3C/svg%3E") no-repeat right 12px center',
    paddingRight: 36,
  }
  const labelSx = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>
          Payment Controller
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
          Delivery charges &amp; COD settings per state
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {[
          { id: 'delivery', label: 'Delivery Charges' },
          { id: 'cod', label: 'COD Control' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '11px 20px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            background: tab === t.id ? '#2563eb' : '#fff',
            color: tab === t.id ? '#fff' : '#374151',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  TAB: DELIVERY CHARGES                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'delivery' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={openAdd} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Add Rule</button>
          </div>

          {loadingRules ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>Loading...</div>
          ) : rules.length === 0 ? (
            <div style={{ ...cardSx, textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>No delivery rules yet.</div>
          ) : (
            <div style={{ ...cardSx, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={thSx}>Name</th>
                      <th style={thSx}>States</th>
                      <th style={thSx}>Charge</th>
                      <th style={thSx}>Free Above</th>
                      <th style={thSx}>Days</th>
                      <th style={thSx}>Active</th>
                      <th style={{ ...thSx, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(r => (
                      <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tdSx}>{r.name || '—'}</td>
                        <td style={tdSx}>
                          {r.applicableRegions?.length
                            ? r.applicableRegions.slice(0, 2).join(', ') + (r.applicableRegions.length > 2 ? ` +${r.applicableRegions.length - 2}` : '')
                            : 'All'}
                        </td>
                        <td style={tdSx}>₹{Number(r.charge).toLocaleString('en-IN')}</td>
                        <td style={tdSx}>₹{Number(r.freeAbove).toLocaleString('en-IN')}</td>
                        <td style={tdSx}>{r.estimatedDaysMin}–{r.estimatedDaysMax}d</td>
                        <td style={tdSx}><ToggleSwitch val={r.isActive} onToggle={() => handleToggleRule(r._id, !r.isActive)} /></td>
                        <td style={{ ...tdSx, textAlign: 'right' }}>
                          <button onClick={() => openEdit(r)} style={btnSx}>Edit</button>
                          <button onClick={() => handleDeleteRule(r._id)} style={{ ...btnSx, color: '#dc2626' }}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Delivery Rule Modal ─────────────────────────────────── */}
          {showForm && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={() => setShowForm(false)}>
              <div style={{ ...cardSx, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>{editingId ? 'Edit Rule' : 'New Rule'}</h2>
                <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelSx}>Delivery Method</label>
                    <select style={selectSx} value={form.method} onChange={e => handleMethodChange(e.target.value)} required>
                      {METHOD_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSx}>Applicable State</label>
                    <select style={selectSx} value={form.applicableRegions[0] || ''} onChange={e => setForm(f => ({ ...f, applicableRegions: e.target.value ? [e.target.value] : [] }))} required>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelSx}>Charge (₹)</label>
                      <input type="number" style={inpSx} value={form.charge} onChange={e => setForm(f => ({ ...f, charge: e.target.value }))} min="0" required />
                    </div>
                    <div>
                      <label style={labelSx}>Free Above (₹)</label>
                      <input type="number" style={inpSx} value={form.freeAbove} onChange={e => setForm(f => ({ ...f, freeAbove: e.target.value }))} min="0" required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelSx}>Est. Min Days</label>
                      <input type="number" style={inpSx} value={form.estimatedDaysMin} onChange={e => setForm(f => ({ ...f, estimatedDaysMin: e.target.value }))} min="0" required />
                    </div>
                    <div>
                      <label style={labelSx}>Est. Max Days</label>
                      <input type="number" style={inpSx} value={form.estimatedDaysMax} onChange={e => setForm(f => ({ ...f, estimatedDaysMax: e.target.value }))} min="0" required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ToggleSwitch val={form.isActive} onToggle={() => setForm(f => ({ ...f, isActive: !f.isActive }))} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: form.isActive ? '#059669' : '#9ca3af' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  TAB: COD CONTROL                                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'cod' && (
        <div>
          {codLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ ...cardSx, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={thSx}>State</th>
                      <th style={thSx}>COD Available</th>
                      <th style={thSx}>Min Order (₹)</th>
                      <th style={thSx}>Max Order (₹)</th>
                      <th style={thSx}>Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INDIAN_STATES.map(state => {
                      const s = codSettings[state] || {}
                      const isSaving = codSaving === state
                      return (
                        <tr key={state} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ ...tdSx, fontWeight: 600 }}>{state}</td>
                          <td style={tdSx}>
                            <ToggleSwitch val={!!s.enabled} onToggle={() => handleCodToggle(state, !s.enabled)} disabled={isSaving} />
                          </td>
                          <td style={tdSx}>
                            <input type="number" style={codInpSx} min="0" value={s.minOrderValue ?? ''}
                              onChange={e => updateCodField(state, 'minOrderValue', e.target.value)} placeholder="0" />
                          </td>
                          <td style={tdSx}>
                            <input type="number" style={codInpSx} min="0" value={s.maxOrderValue ?? ''}
                              onChange={e => updateCodField(state, 'maxOrderValue', e.target.value)} placeholder="0" />
                          </td>
                          <td style={tdSx}>
                            <button onClick={() => handleCodSave(state)} disabled={isSaving} style={{
                              padding: '5px 14px', borderRadius: 6, border: 'none',
                              background: isSaving ? '#93c5fd' : '#2563eb',
                              color: '#fff', fontSize: 11, fontWeight: 600,
                              cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            }}>{isSaving ? '...' : 'Save'}</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const thSx = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const tdSx = { padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }
const btnSx = { padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#2563eb', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 6 }
const codInpSx = { width: '100%', padding: '6px 10px', fontSize: 12, color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', maxWidth: 120 }

export default PaymentController
