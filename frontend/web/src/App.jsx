import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/store/authStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import AuthPage from '@/components/auth/AuthPage'
import Dashboard from '@/components/dashboard/Dashboard'
import AnalyzePage from '@/components/similarity/AnalyzePage'
import ImportPage from '@/components/similarity/ImportPage'
import TasksPage from '@/components/tasks/TasksPage'
import ReportsPage from '@/components/reports/ReportsPage'
import LogsPage from '@/components/logs/LogsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index      element={<Dashboard />} />
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="import"  element={<ImportPage />} />
            <Route path="tasks"   element={<TasksPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="logs"    element={<LogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
