import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 60000,
})

// ── Auth interceptor ──────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tsa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tsa_token')
      localStorage.removeItem('tsa_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  list:    ()        => api.get('/tasks/'),
  create:  (data)    => api.post('/tasks/', data),
  update:  (id, d)   => api.put(`/tasks/${id}`, d),
  delete:  (id)      => api.delete(`/tasks/${id}`),
  preview: (file)    => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/tasks/files/preview', fd)
  },
  import:  (file, opts = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts.title_col)       fd.append('title_col', opts.title_col)
    if (opts.description_col) fd.append('description_col', opts.description_col)
    if (opts.combine_remaining !== undefined) fd.append('combine_remaining', opts.combine_remaining)
    return api.post('/tasks/import/file', fd)
  },
}

// ── Similarity ────────────────────────────────────────────────────────────────
export const similarityAPI = {
  analyze: (data) => api.post('/similarity/analyze', data),
  analyzeBulk: (file, opts = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts.title_col)       fd.append('title_col', opts.title_col)
    if (opts.description_col) fd.append('description_col', opts.description_col)
    if (opts.combine_remaining !== undefined) fd.append('combine_remaining', opts.combine_remaining)
    return api.post('/similarity/analyze/bulk', fd)
  },
  reportPDF: (file, opts = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts.title_col)       fd.append('title_col', opts.title_col)
    if (opts.description_col) fd.append('description_col', opts.description_col)
    return api.post('/similarity/report/pdf', fd, { responseType: 'blob' })
  },
  reportExcel: (file, opts = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts.title_col)       fd.append('title_col', opts.title_col)
    if (opts.description_col) fd.append('description_col', opts.description_col)
    return api.post('/similarity/report/excel', fd, { responseType: 'blob' })
  },
}

// ── Logs ──────────────────────────────────────────────────────────────────────
export const logsAPI = {
  list:  (params = {}) => api.get('/logs/', { params }),
  stats: (params = {}) => api.get('/logs/stats', { params }),
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default api
