import React from 'react'
import './AttachmentDisplay.css'

function AttachmentDisplay({ attachments, onDelete, showDelete = false }) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  const isImage = (filename) => {
    const ext = getFileExtension(filename)
    return ['jpg', 'jpeg', 'png', 'gif', 'heic'].includes(ext)
  }

  const isPDF = (filename) => {
    return getFileExtension(filename) === 'pdf'
  }

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename)
    if (isImage(filename)) return '🖼️'
    if (ext === 'pdf') return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
    if (ext === 'txt') return '📃'
    return '📎'
  }

  const getFileUrl = (attachment) => {
    // Extract just the filename from the file_path
    const filename = attachment.file_path.split('/').pop()
    return `/uploads/${filename}`
  }

  return (
    <div className="attachment-display">
      <div className="attachment-label">Attachments ({attachments.length}):</div>
      <div className="attachments-grid">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-item">
            {isImage(attachment.filename) ? (
              <a
                href={getFileUrl(attachment)}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link attachment-image"
              >
                <img
                  src={getFileUrl(attachment)}
                  alt={attachment.filename}
                  className="attachment-thumbnail"
                />
                <div className="attachment-overlay">
                  <span className="overlay-icon">🔍</span>
                </div>
              </a>
            ) : (
              <a
                href={getFileUrl(attachment)}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link attachment-file"
              >
                <div className="file-icon-large">{getFileIcon(attachment.filename)}</div>
                {isPDF(attachment.filename) && (
                  <div className="pdf-label">PDF</div>
                )}
              </a>
            )}
            <div className="attachment-info">
              <span className="attachment-filename" title={attachment.filename}>
                {attachment.filename}
              </span>
              <span className="attachment-size">
                {formatFileSize(attachment.file_size)}
              </span>
            </div>
            {showDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(attachment.id)}
                className="attachment-delete"
                aria-label="Delete attachment"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttachmentDisplay
