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
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.post('/maintenance-logs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (id) => api.delete(`/maintenance-logs/${id}`)
}

export default api
