import React from 'react'
import './Select.css'

function Select({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error
}) {
  return (
    <div className="select-group">
      {label && (
        <label htmlFor={name} className="select-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`select ${error ? 'select-error' : ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

export default Select
