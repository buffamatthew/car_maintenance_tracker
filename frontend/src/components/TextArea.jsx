import React from 'react'
import './TextArea.css'

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 4
}) {
  return (
    <div className="textarea-group">
      {label && (
        <label htmlFor={name} className="textarea-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`textarea ${error ? 'textarea-error' : ''}`}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

export default TextArea
