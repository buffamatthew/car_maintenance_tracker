import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`)
}

export const maintenanceItemAPI = {
  getAll: (vehicleId) => api.get('/maintenance-items', { params: { vehicle_id: vehicleId } }),
  getById: (id) => api.get(`/maintenance-items/${id}`),
  create: (data) => api.post('/maintenance-items', data),
  update: (id, data) => api.put(`/maintenance-items/${id}`, data),
  delete: (id) => api.delete(`/maintenance-items/${id}`)
}

export const maintenanceLogAPI = {
  getAll: (itemId) => api.get('/maintenance-logs', { params: { maintenance_item_id: itemId } }),
  getById: (id) => api.get(`/maintenance-logs/${id}`),
  create: (data) => {
    // Use axios directly for FormData to avoid Content-Type: application/json header
    if (data instanceof FormData) {
      return axios.post(`${API_BASE_URL}/maintenance-logs`, data)
    }
    return api.post('/maintenance-logs', data)
  },
  update: (id, data) => {
    // Check if data is FormData or regular object
    if (data instanceof FormData) {
      // Send as multipart/form-data - create new axios instance without JSON header
      return axios.put(`${API_BASE_URL}/maintenance-logs/${id}`, data)
    } else {
      // Send as JSON
      return api.put(`/maintenance-logs/${id}`, data)
    }
  },
  delete: (id) => api.delete(`/maintenance-logs/${id}`),
  deleteAttachment: (id) => api.delete(`/maintenance-logs/attachments/${id}`)
}

export const generalMaintenanceAPI = {
  getAll: (vehicleId) => api.get(`/general-maintenance`, { params: { vehicle_id: vehicleId } }),
  getById: (id) => api.get(`/general-maintenance/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/general-maintenance`, data),
  update: (id, data) => {
    if (data instanceof FormData) {
      return axios.put(`${API_BASE_URL}/general-maintenance/${id}`, data)
    } else {
      return api.put(`/general-maintenance/${id}`, data)
    }
  },
  delete: (id) => api.delete(`/general-maintenance/${id}`),
  deleteAttachment: (id) => api.delete(`/general-maintenance/attachments/${id}`)
}

export const backupAPI = {
  export: () => {
    // Use axios directly to handle file download
    return axios.get(`${API_BASE_URL}/backup/export`, {
      responseType: 'blob'
    })
  },
  import: (file, mode = 'merge') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)
    return axios.post(`${API_BASE_URL}/backup/import`, formData)
  }
}

export default api
