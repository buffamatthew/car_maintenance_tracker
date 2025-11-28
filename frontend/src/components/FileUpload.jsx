import React from 'react'
import './FileUpload.css'

const MAX_FILES = 5
const MAX_FILE_SIZE = 16 * 1024 * 1024 // 16MB

function FileUpload({ files, onChange, onRemove, label = "Attachments" }) {
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const currentCount = files.length
    const newCount = currentCount + selectedFiles.length

    // Validate file count
    if (newCount > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - currentCount} more.`)
      return
    }

    // Validate file sizes
    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 16MB.`)
        return
      }
    }

    onChange([...files, ...selectedFiles])
    e.target.value = '' // Reset input
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'heic'].includes(ext)) return '🖼️'
    if (ext === 'pdf') return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
    if (ext === 'txt') return '📃'
    return '📎'
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="file-upload-component">
      <label className="file-upload-label">{label} (Optional)</label>

      {files.length < MAX_FILES && (
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload-input"
            multiple
            accept=".png,.jpg,.jpeg,.pdf,.gif,.doc,.docx,.txt,.csv,.xlsx,.heic"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="file-upload-input" className="file-input-label">
            📎 Choose files ({files.length}/{MAX_FILES})
          </label>
          <p className="file-hint">
            Accepted: Images, PDF, Documents (max 16MB each, up to {MAX_FILES} files)
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="files-list">
          <div className="files-header">
            <span className="files-count">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
            <span className="files-size">Total: {formatFileSize(totalSize)}</span>
          </div>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span className="file-icon">{getFileIcon(file)}</span>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="file-remove"
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
