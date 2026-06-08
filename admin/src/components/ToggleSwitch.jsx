import React from 'react'

const ToggleSwitch = ({ val, onToggle, label, disabled = false }) => (
  <label className={`inline-flex items-center gap-4 select-none ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}>
    <div className="relative">
      <button
        type="button"
        role="switch"
        aria-checked={val}
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-9 h-5 rounded-full transition-colors ${
        val ? 'bg-blue-600' : 'bg-slate-300'
      }`} />
      <div className={`absolute left-0.5 top-0.5 w-[15.5px] h-[15.5px] bg-white rounded-full transition-transform ${
        val ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </div>
    {label && <span className="text-sm text-slate-900">{label}</span>}
  </label>
)

export default ToggleSwitch
